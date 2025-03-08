const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`Starting deployment on network: ${network.name}`);

  // Validate network
  if (network.name === "mainnet") {
    throw new Error("Prevented deployment to mainnet");
  }

  // Get the contract factories
  const CryptixTicket = await ethers.getContractFactory("CryptixTicket");
  const CryptixMultiSig = await ethers.getContractFactory("CryptixMultiSig");
  const CryptixMarketplace = await ethers.getContractFactory("CryptixMarketplace");

  // Get signers
  const [deployer, ...signers] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  try {
    // Deploy CryptixTicket with retry mechanism
    console.log("Deploying CryptixTicket...");
    let cryptixTicket;
    try {
      cryptixTicket = await CryptixTicket.deploy();
      await cryptixTicket.deployed();
      console.log("CryptixTicket deployed to:", cryptixTicket.address);
    } catch (error) {
      console.error("Failed to deploy CryptixTicket:", error);
      throw error;
    }

    // Deploy CryptixMultiSig with retry mechanism
    console.log("Deploying CryptixMultiSig...");
    let cryptixMultiSig;
    try {
      const initialOwners = [
        deployer.address,
        signers[0]?.address || deployer.address,
        signers[1]?.address || deployer.address
      ];
      const requiredConfirmations = 2;
      cryptixMultiSig = await CryptixMultiSig.deploy(initialOwners, requiredConfirmations);
      await cryptixMultiSig.deployed();
      console.log("CryptixMultiSig deployed to:", cryptixMultiSig.address);
    } catch (error) {
      console.error("Failed to deploy CryptixMultiSig:", error);
      throw error;
    }

    // Deploy CryptixMarketplace with retry mechanism
    console.log("Deploying CryptixMarketplace...");
    let cryptixMarketplace;
    try {
      cryptixMarketplace = await CryptixMarketplace.deploy(
        cryptixTicket.address,
        cryptixMultiSig.address
      );
      await cryptixMarketplace.deployed();
      console.log("CryptixMarketplace deployed to:", cryptixMarketplace.address);
    } catch (error) {
      console.error("Failed to deploy CryptixMarketplace:", error);
      throw error;
    }

    // Set up initial configuration
    console.log("Setting up initial configuration...");

    // Grant marketplace contract permission to manage tickets
    try {
      const MARKETPLACE_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("MARKETPLACE_ROLE")
      );
      const grantRoleTx = await cryptixTicket.grantRole(MARKETPLACE_ROLE, cryptixMarketplace.address);
      await grantRoleTx.wait(1); // Wait for 1 confirmation
      console.log("Granted MARKETPLACE_ROLE to marketplace contract");
    } catch (error) {
      console.error("Failed to grant MARKETPLACE_ROLE:", error);
      throw error;
    }

    // Transfer ownership of ticket contract to multisig
    try {
      const transferOwnershipTx = await cryptixTicket.transferOwnership(cryptixMultiSig.address);
      await transferOwnershipTx.wait(1); // Wait for 1 confirmation
      console.log("Transferred ticket contract ownership to multisig");
    } catch (error) {
      console.error("Failed to transfer ownership:", error);
      throw error;
    }

    // Save deployment info
    const deploymentInfo = {
      network: network.name,
      chainId: network.config.chainId,
      cryptixTicket: cryptixTicket.address,
      cryptixMultiSig: cryptixMultiSig.address,
      cryptixMarketplace: cryptixMarketplace.address,
      deployedBy: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        CryptixTicket: {
          address: cryptixTicket.address,
          version: "1.0.0"
        },
        CryptixMultiSig: {
          address: cryptixMultiSig.address,
          version: "1.0.0"
        },
        CryptixMarketplace: {
          address: cryptixMarketplace.address,
          version: "1.0.0"
        }
      }
    };

    // Ensure directories exist
    const contractsDir = path.join(__dirname, "../deployment");
    const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
    
    [contractsDir, frontendDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Save deployment info to both locations
    const deploymentFile = `deployment-${network.name}.json`;
    fs.writeFileSync(
      path.join(contractsDir, deploymentFile),
      JSON.stringify(deploymentInfo, null, 2)
    );
    fs.writeFileSync(
      path.join(frontendDir, deploymentFile),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log(`Deployment info saved to ${deploymentFile}`);

    // Verify contracts on testnet explorer
    if (network.name !== "localhost" && network.name !== "hardhat") {
      console.log("Waiting for additional block confirmations...");
      // Wait for more confirmations before verification
      await Promise.all([
        cryptixTicket.deployTransaction.wait(5),
        cryptixMultiSig.deployTransaction.wait(5),
        cryptixMarketplace.deployTransaction.wait(5)
      ]);

      console.log("Verifying contracts on block explorer...");
      
      try {
        await hre.run("verify:verify", {
          address: cryptixTicket.address,
          constructorArguments: [],
        });
        console.log("CryptixTicket verified");

        await hre.run("verify:verify", {
          address: cryptixMultiSig.address,
          constructorArguments: [
            [deployer.address, signers[0]?.address || deployer.address, signers[1]?.address || deployer.address],
            2
          ],
        });
        console.log("CryptixMultiSig verified");

        await hre.run("verify:verify", {
          address: cryptixMarketplace.address,
          constructorArguments: [cryptixTicket.address, cryptixMultiSig.address],
        });
        console.log("CryptixMarketplace verified");
      } catch (error) {
        console.error("Error during contract verification:", error);
        console.log("Contract verification failed, but deployment was successful");
      }
    }

    console.log("Deployment completed successfully!");
    return deploymentInfo;

  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
