const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Starting deployment...");

    // Get the contract factories
    const CryptixTicket = await ethers.getContractFactory("CryptixTicket");
    const CryptixMarketplace = await ethers.getContractFactory("CryptixMarketplace");
    const CryptixMultiSig = await ethers.getContractFactory("CryptixMultiSig");

    // Deploy CryptixTicket
    console.log("Deploying CryptixTicket...");
    const cryptixTicket = await CryptixTicket.deploy();
    await cryptixTicket.deployed();
    console.log("CryptixTicket deployed to:", cryptixTicket.address);

    // Deploy CRX Token (assuming it's already deployed)
    // Replace this address with the actual deployed CRX token address
    const crxTokenAddress = process.env.CRX_TOKEN_ADDRESS;

    // Deploy CryptixMarketplace
    console.log("Deploying CryptixMarketplace...");
    const cryptixMarketplace = await CryptixMarketplace.deploy(
        cryptixTicket.address,
        crxTokenAddress
    );
    await cryptixMarketplace.deployed();
    console.log("CryptixMarketplace deployed to:", cryptixMarketplace.address);

    // Deploy CryptixMultiSig
    console.log("Deploying CryptixMultiSig...");
    const owners = [
        process.env.OWNER1_ADDRESS,
        process.env.OWNER2_ADDRESS,
        process.env.OWNER3_ADDRESS
    ];
    const requiredConfirmations = 2; // Require 2 out of 3 signatures
    const cryptixMultiSig = await CryptixMultiSig.deploy(owners, requiredConfirmations);
    await cryptixMultiSig.deployed();
    console.log("CryptixMultiSig deployed to:", cryptixMultiSig.address);

    // Save deployment addresses
    const deploymentInfo = {
        CryptixTicket: cryptixTicket.address,
        CryptixMarketplace: cryptixMarketplace.address,
        CryptixMultiSig: cryptixMultiSig.address,
        CRXToken: crxTokenAddress,
        network: network.name,
        timestamp: new Date().toISOString()
    };

    // Save deployment info to file
    const deploymentsDir = path.join(__dirname, 'deployments');
    if (!fs.existsSync(deploymentsDir)){
        fs.mkdirSync(deploymentsDir);
    }
    
    fs.writeFileSync(
        path.join(deploymentsDir, `${network.name}.json`),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("Deployment completed!");
    console.log("Deployment info saved to:", path.join(deploymentsDir, `${network.name}.json`));

    // Verify contracts on Etherscan
    if (process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying contracts on Etherscan...");
        
        await hre.run("verify:verify", {
            address: cryptixTicket.address,
            constructorArguments: []
        });

        await hre.run("verify:verify", {
            address: cryptixMarketplace.address,
            constructorArguments: [cryptixTicket.address, crxTokenAddress]
        });

        await hre.run("verify:verify", {
            address: cryptixMultiSig.address,
            constructorArguments: [owners, requiredConfirmations]
        });

        console.log("Contract verification completed!");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
