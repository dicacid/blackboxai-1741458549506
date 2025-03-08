const { ethers, run, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n🔍 Starting contract verification...\n");

    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployments", network.name, "deployment.json");
    
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`Deployment info not found at ${deploymentPath}. Please deploy contracts first.`);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.config.chainId}\n`);

    try {
        // Verify CryptixTicket
        console.log("Verifying CryptixTicket...");
        await run("verify:verify", {
            address: deploymentInfo.contracts.CryptixTicket.address,
            constructorArguments: []
        });
        console.log("✓ CryptixTicket verified\n");

        // Verify CryptixMultiSig
        console.log("Verifying CryptixMultiSig...");
        await run("verify:verify", {
            address: deploymentInfo.contracts.CryptixMultiSig.address,
            constructorArguments: [
                deploymentInfo.contracts.CryptixMultiSig.owners,
                deploymentInfo.contracts.CryptixMultiSig.requiredConfirmations
            ]
        });
        console.log("✓ CryptixMultiSig verified\n");

        // Verify CryptixMarketplace
        console.log("Verifying CryptixMarketplace...");
        await run("verify:verify", {
            address: deploymentInfo.contracts.CryptixMarketplace.address,
            constructorArguments: [
                deploymentInfo.contracts.CryptixTicket.address,
                deploymentInfo.contracts.CryptixMultiSig.address
            ]
        });
        console.log("✓ CryptixMarketplace verified\n");

        // Update deployment info with verification status
        deploymentInfo.contracts.CryptixTicket.verified = true;
        deploymentInfo.contracts.CryptixMultiSig.verified = true;
        deploymentInfo.contracts.CryptixMarketplace.verified = true;
        deploymentInfo.verificationTimestamp = new Date().toISOString();

        // Save updated deployment info
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        
        // Generate verification report
        const reportPath = path.join(__dirname, "../deployments", network.name, "verification-report.md");
        const report = generateVerificationReport(deploymentInfo, network);
        fs.writeFileSync(reportPath, report);

        console.log("🎉 All contracts verified successfully!");
        console.log("\nVerification report saved to:", reportPath);
        console.log("\nContract Links:");
        
        const explorerUrl = network.config.blockExplorerUrls?.[0] || "";
        if (explorerUrl) {
            Object.entries(deploymentInfo.contracts).forEach(([name, info]) => {
                console.log(`${name}: ${explorerUrl}/address/${info.address}`);
            });
        }

    } catch (error) {
        console.error("\n❌ Verification failed:", error.message);
        
        if (error.message.includes("already verified")) {
            console.log("\n✓ Contract is already verified");
        } else {
            console.log("\nTroubleshooting steps:");
            console.log("1. Ensure ETHERSCAN_API_KEY is correct in .env");
            console.log("2. Wait for more block confirmations");
            console.log("3. Check contract addresses in deployment.json");
            console.log("4. Verify constructor arguments match deployment");
        }
        
        throw error;
    }
}

function generateVerificationReport(deploymentInfo, network) {
    const explorerUrl = network.config.blockExplorerUrls?.[0] || "";
    
    return `# Contract Verification Report

## Network Information
- Network: ${network.name}
- Chain ID: ${network.config.chainId}
- Deployment Timestamp: ${deploymentInfo.timestamp}
- Verification Timestamp: ${deploymentInfo.verificationTimestamp}

## Verified Contracts

### CryptixTicket
- Address: \`${deploymentInfo.contracts.CryptixTicket.address}\`
- Transaction Hash: \`${deploymentInfo.contracts.CryptixTicket.deploymentHash}\`
- Version: ${deploymentInfo.contracts.CryptixTicket.version}
${explorerUrl ? `- Explorer: ${explorerUrl}/address/${deploymentInfo.contracts.CryptixTicket.address}` : ''}

### CryptixMultiSig
- Address: \`${deploymentInfo.contracts.CryptixMultiSig.address}\`
- Transaction Hash: \`${deploymentInfo.contracts.CryptixMultiSig.deploymentHash}\`
- Version: ${deploymentInfo.contracts.CryptixMultiSig.version}
- Required Confirmations: ${deploymentInfo.contracts.CryptixMultiSig.requiredConfirmations}
- Initial Owners:
${deploymentInfo.contracts.CryptixMultiSig.owners.map(owner => `  - \`${owner}\``).join('\n')}
${explorerUrl ? `- Explorer: ${explorerUrl}/address/${deploymentInfo.contracts.CryptixMultiSig.address}` : ''}

### CryptixMarketplace
- Address: \`${deploymentInfo.contracts.CryptixMarketplace.address}\`
- Transaction Hash: \`${deploymentInfo.contracts.CryptixMarketplace.deploymentHash}\`
- Version: ${deploymentInfo.contracts.CryptixMarketplace.version}
${explorerUrl ? `- Explorer: ${explorerUrl}/address/${deploymentInfo.contracts.CryptixMarketplace.address}` : ''}

## Contract Relationships
- CryptixTicket owner: CryptixMultiSig
- CryptixMarketplace dependencies:
  - Ticket Contract: CryptixTicket
  - MultiSig Contract: CryptixMultiSig

## Verification Status
- All contracts successfully verified on ${network.name} network
- Verification completed at: ${deploymentInfo.verificationTimestamp}

## Block Explorer
${explorerUrl ? `Block Explorer URL: ${explorerUrl}` : 'Block Explorer URL not available for this network'}

## Notes
- Contract source code and deployment artifacts are available in the repository
- ABI files can be found in \`artifacts/contracts\` directory
- Deployment information is stored in \`deployments/${network.name}/deployment.json\`
`;
}

// Execute verification
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
