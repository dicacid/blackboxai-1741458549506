const { ethers } = require("hardhat");

async function main() {
    console.log("\n🧹 Cleaning up pending transactions...\n");

    const [deployer] = await ethers.getSigners();
    const provider = deployer.provider;
    
    try {
        // Get current nonce
        const currentNonce = await provider.getTransactionCount(deployer.address, "latest");
        const pendingNonce = await provider.getTransactionCount(deployer.address, "pending");
        
        console.log("Account:", deployer.address);
        console.log("Current nonce:", currentNonce);
        console.log("Pending nonce:", pendingNonce);

        if (currentNonce === pendingNonce) {
            console.log("\n✓ No pending transactions found.");
            return;
        }

        console.log("\nFound", pendingNonce - currentNonce, "pending transactions");
        
        // Send zero-value transaction with higher gas price to clear pending transactions
        console.log("\nSending cleanup transaction...");
        
        const gasPrice = await provider.getGasPrice();
        const increasedGasPrice = gasPrice.mul(2); // Double the current gas price

        const tx = await deployer.sendTransaction({
            to: deployer.address, // Send to self
            value: 0,
            nonce: currentNonce,
            gasPrice: increasedGasPrice,
            gasLimit: 21000 // Standard gas limit for ETH transfer
        });

        console.log("Cleanup transaction hash:", tx.hash);
        console.log("Waiting for confirmation...");
        
        await tx.wait();
        
        // Verify nonces are synced
        const newCurrentNonce = await provider.getTransactionCount(deployer.address, "latest");
        const newPendingNonce = await provider.getTransactionCount(deployer.address, "pending");
        
        console.log("\nNew current nonce:", newCurrentNonce);
        console.log("New pending nonce:", newPendingNonce);
        
        if (newCurrentNonce === newPendingNonce) {
            console.log("\n✓ Transaction queue cleared successfully!");
        } else {
            console.log("\n⚠️  Some transactions may still be pending.");
            console.log("You may need to run this script again or wait for transactions to expire.");
        }

        // Get current balance
        const balance = await deployer.getBalance();
        console.log("\nRemaining balance:", ethers.utils.formatEther(balance), "ETH");

    } catch (error) {
        console.error("\n❌ Error cleaning transactions:", error.message);
        
        if (error.message.includes("nonce")) {
            console.log("\nSuggested actions:");
            console.log("1. Wait for pending transactions to confirm or expire");
            console.log("2. Check your wallet's transaction queue");
            console.log("3. Try running this script again with higher gas price");
        }
        
        throw error;
    }
}

// Execute cleanup
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
