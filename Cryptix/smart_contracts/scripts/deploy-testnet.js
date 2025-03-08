const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Ensure we're on a testnet
  if (network.name === "mainnet") {
    throw new Error("This script is for testnet deployment only");
  }

  console.log(`Starting deployment on ${network.name} testnet...`);
  console.log("Network config:", network.config);

  // Get the deployer's account
  const [deployer, ...signers] = await ethers.getSigners();
  const balance = await deployer.getBalance();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(balance.toString()), "ETH");

  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    throw new Error("Insufficient balance for deployment. Please fund your account with testnet ETH.");
  }

  try {
    // Deploy CryptixTicket
    console.log("\nDeploying CryptixTicket...");
    const CryptixTicket = await ethers.getContractFactory("CryptixTicket");
    const cryptixTicket = await CryptixTicket.deploy();
    await cryptixTicket.deployed();
    console.log("CryptixTicket deployed to:", cryptixTicket.address);
    console.log("Transaction hash:", cryptixTicket.deployTransaction.hash);
    
    // Wait for more confirmations
    console.log("Waiting for confirmations...");
    await cryptixTicket.deployTransaction.wait(5);

    // Deploy CryptixMultiSig
    console.log("\nDeploying CryptixMultiSig...");
    const CryptixMultiSig = await ethers.getContractFactory("CryptixMultiSig");
    const initialOwners = [
      deployer.address,
      signers[0]?.address || deployer.address,
      signers[1]?.address || deployer.address
    ];
    const requiredConfirmations = 2;
    const cryptixMultiSig = await CryptixMultiSig.deploy(initialOwners, requiredConfirmations);
    await cryptixMultiSig.deployed();
    console.log("CryptixMultiSig deployed to:", cryptixMultiSig.address);
    console.log("Transaction hash:", cryptixMultiSig.deployTransaction.hash);
    
    // Wait for more confirmations
    console.log("Waiting for confirmations...");
    await cryptixMultiSig.deployTransaction.wait(5);

    // Deploy CryptixMarketplace
    console.log("\nDeploying CryptixMarketplace...");
    const CryptixMarketplace = await ethers.getContractFactory("CryptixMarketplace");
    const cryptixMarketplace = await CryptixMarketplace.deploy(
      cryptixTicket.address,
      cryptixMultiSig.address
    );
    await cryptixMarketplace.deployed();
    console.log("CryptixMarketplace deployed to:", cryptixMarketplace.address);
    console.log("Transaction hash:", cryptixMarketplace.deployTransaction.hash);
    
    // Wait for more confirmations
    console.log("Waiting for confirmations...");
    await cryptixMarketplace.deployTransaction.wait(5);

    // Set up initial configuration
    console.log("\nSetting up initial configuration...");

    // Grant marketplace contract permission to manage tickets
    const MARKETPLACE_ROLE = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("MARKETPLACE_ROLE")
    );
    console.log("Granting MARKETPLACE_ROLE to marketplace contract...");
    const grantRoleTx = await cryptixTicket.grantRole(MARKETPLACE_ROLE, cryptixMarketplace.address);
    await grantRoleTx.wait(2);
    console.log("Role granted. Transaction hash:", grantRoleTx.hash);

    // Transfer ownership of ticket contract to multisig
    console.log("Transferring ticket contract ownership to multisig...");
    const transferOwnershipTx = await cryptixTicket.transferOwnership(cryptixMultiSig.address);
    await transferOwnershipTx.wait(2);
    console.log("Ownership transferred. Transaction hash:", transferOwnershipTx.hash);

    // Save deployment info
    const deploymentInfo = {
      network: network.name,
      chainId: network.config.chainId,
      deployer: deployer.address,
      contracts: {
        CryptixTicket: {
          address: cryptixTicket.address,
          deploymentHash: cryptixTicket.deployTransaction.hash,
          version: "1.0.0"
        },
        CryptixMultiSig: {
          address: cryptixMultiSig.address,
          deploymentHash: cryptixMultiSig.deployTransaction.hash,
          version: "1.0.0",
          owners: initialOwners,
          requiredConfirmations
        },
        CryptixMarketplace: {
          address: cryptixMarketplace.address,
          deploymentHash: cryptixMarketplace.deployTransaction.hash,
          version: "1.0.0"
        }
      },
      timestamp: new Date().toISOString(),
      blockNumber: cryptixMarketplace.deployTransaction.blockNumber
    };

    // Ensure directories exist
    const deploymentDir = path.join(__dirname, "../deployments", network.name);
    const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
    
    [deploymentDir, frontendDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Save deployment info
    const deploymentPath = path.join(deploymentDir, "deployment.json");
    const frontendPath = path.join(frontendDir, `deployment-${network.name}.json`);
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    fs.writeFileSync(frontendPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\nDeployment info saved to:", deploymentPath);
    console.log("Frontend deployment info saved to:", frontendPath);

    // Verify contracts on block explorer
    if (process.env.VERIFY_CONTRACTS === "true") {
      console.log("\nVerifying contracts on block explorer...");
      
      try {
        console.log("Verifying CryptixTicket...");
        await hre.run("verify:verify", {
          address: cryptixTicket.address,
          constructorArguments: []
        });

        console.log("Verifying CryptixMultiSig...");
        await hre.run("verify:verify", {
          address: cryptixMultiSig.address,
          constructorArguments: [initialOwners, requiredConfirmations]
        });

        console.log("Verifying CryptixMarketplace...");
        await hre.run("verify:verify", {
          address: cryptixMarketplace.address,
          constructorArguments: [cryptixTicket.address, cryptixMultiSig.address]
        });

        console.log("Contract verification completed!");
      } catch (error) {
        console.warn("Contract verification failed:", error.message);
        console.log("You can try verifying manually using the deployment info");
      }
    }

    console.log("\nTestnet deployment completed successfully!");
    console.log(`Network: ${network.name}`);
    console.log(`Block Explorer: ${network.config.blockExplorerUrls?.[0] || "Not available"}`);
    console.log("\nContract Addresses:");
    console.log("CryptixTicket:", cryptixTicket.address);
    console.log("CryptixMultiSig:", cryptixMultiSig.address);
    console.log("CryptixMarketplace:", cryptixMarketplace.address);

    return deploymentInfo;
  } catch (error) {
    console.error("\nDeployment failed:", error);
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
