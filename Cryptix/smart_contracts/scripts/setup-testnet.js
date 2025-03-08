const { ethers, network } = require("hardhat");

async function main() {
    console.log("\n🔧 Verifying testnet setup...\n");

    // Get network and account info
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const balance = await deployer.getBalance();

    console.log("Network Information:");
    console.log("- Name:", network.name);
    console.log("- Chain ID:", network.chainId);
    console.log("- Account:", deployer.address);
    console.log("- Balance:", ethers.utils.formatEther(balance), "ETH");

    // Check environment variables
    console.log("\nChecking environment variables:");
    const requiredEnvVars = [
        "SEPOLIA_URL",
        "PRIVATE_KEY",
        "ETHERSCAN_API_KEY"
    ];

    let missingVars = [];
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missingVars.push(envVar);
            console.log(`❌ Missing ${envVar}`);
        } else {
            console.log(`✓ ${envVar} is set`);
        }
    }

    if (missingVars.length > 0) {
        console.log("\n⚠️  Missing environment variables. Please set them in .env file.");
        return;
    }

    // Check balance requirements
    const minimumBalance = ethers.utils.parseEther("0.1"); // 0.1 ETH
    if (balance.lt(minimumBalance)) {
        console.log("\n⚠️  Insufficient balance for deployment");
        console.log("\nYou can get testnet ETH from these faucets:");
        
        if (network.name === "sepolia") {
            console.log("- Alchemy Sepolia Faucet: https://sepoliafaucet.com/");
            console.log("- Infura Sepolia Faucet: https://infura.io/faucet/sepolia");
            console.log("- Chainlink Faucets: https://faucets.chain.link/");
        } else if (network.name === "goerli") {
            console.log("- Goerli Faucet: https://goerlifaucet.com/");
            console.log("- Chainlink Faucets: https://faucets.chain.link/goerli");
        }
        return;
    }

    // Check network RPC connection
    console.log("\nTesting network connection:");
    try {
        const blockNumber = await ethers.provider.getBlockNumber();
        console.log(`✓ Connected to network. Current block: ${blockNumber}`);
    } catch (error) {
        console.log("❌ Failed to connect to network");
        console.log("Error:", error.message);
        return;
    }

    // Check gas prices
    console.log("\nChecking gas prices:");
    try {
        const gasPrice = await ethers.provider.getGasPrice();
        console.log("Current gas price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");
        
        // Estimate deployment costs
        const estimatedGas = 3000000; // Approximate gas for deployment
        const estimatedCost = gasPrice.mul(estimatedGas);
        console.log("Estimated deployment cost:", ethers.utils.formatEther(estimatedCost), "ETH");
        
        if (balance.lt(estimatedCost)) {
            console.log("⚠️  Warning: Balance might be insufficient for deployment");
        } else {
            console.log("✓ Balance sufficient for deployment");
        }
    } catch (error) {
        console.log("❌ Failed to check gas prices");
        console.log("Error:", error.message);
        return;
    }

    // Final status
    console.log("\nSetup Status:");
    if (missingVars.length === 0 && balance.gte(minimumBalance)) {
        console.log("✓ Ready for deployment");
        console.log("\nYou can now run:");
        console.log(`npm run deploy:${network.name}`);
    } else {
        console.log("❌ Setup incomplete. Please address the issues above.");
    }

    console.log(); // Empty line for readability
}

// Execute setup check
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
