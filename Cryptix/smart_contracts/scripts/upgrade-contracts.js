const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n🔄 Starting contract upgrade process...\n");

    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployments", network.name, "deployment.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployment info not found. Please deploy contracts first.");
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const network = await ethers.provider.getNetwork();
    
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}\n`);

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Upgrading contracts with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

    // Create upgrade history directory
    const upgradeDir = path.join(__dirname, "../deployments", network.name, "upgrades");
    if (!fs.existsSync(upgradeDir)) {
        fs.mkdirSync(upgradeDir, { recursive: true });
    }

    // Load upgrade manifest if exists
    const manifestPath = path.join(upgradeDir, "manifest.json");
    let upgradeManifest = {
        network: network.name,
        chainId: network.chainId,
        upgrades: []
    };

    if (fs.existsSync(manifestPath)) {
        upgradeManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    }

    try {
        // Prepare upgrade info
        const upgradeInfo = {
            timestamp: new Date().toISOString(),
            contracts: {}
        };

        // Upgrade each upgradeable contract
        for (const [name, info] of Object.entries(deploymentInfo.contracts)) {
            if (info.upgradeable) {
                console.log(`Upgrading ${name}...`);

                try {
                    // Get contract factory
                    const ContractV2 = await ethers.getContractFactory(name);

                    // Prepare upgrade
                    console.log("Preparing upgrade...");
                    const validationResult = await upgrades.validateUpgrade(
                        info.address,
                        ContractV2
                    );

                    if (validationResult.errors.length > 0) {
                        console.error("Validation errors:", validationResult.errors);
                        continue;
                    }

                    // Perform upgrade
                    console.log("Executing upgrade...");
                    const upgraded = await upgrades.upgradeProxy(
                        info.address,
                        ContractV2
                    );
                    await upgraded.deployed();

                    // Verify the upgrade
                    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
                        upgraded.address
                    );

                    console.log(`✓ ${name} upgraded successfully`);
                    console.log("Proxy:", upgraded.address);
                    console.log("Implementation:", implementationAddress);

                    // Save upgrade info
                    upgradeInfo.contracts[name] = {
                        proxyAddress: upgraded.address,
                        implementationAddress,
                        version: info.version + 1,
                        upgradeTransaction: upgraded.deployTransaction.hash
                    };

                    // Update deployment info
                    deploymentInfo.contracts[name].version = info.version + 1;
                    deploymentInfo.contracts[name].implementationAddress = implementationAddress;

                    // Verify new implementation on block explorer
                    if (process.env.VERIFY_CONTRACTS === "true") {
                        try {
                            console.log("\nVerifying new implementation...");
                            await hre.run("verify:verify", {
                                address: implementationAddress,
                                constructorArguments: []
                            });
                            console.log("✓ Implementation verified");
                        } catch (error) {
                            if (!error.message.includes("already verified")) {
                                console.warn("Verification failed:", error.message);
                            }
                        }
                    }

                } catch (error) {
                    console.error(`Error upgrading ${name}:`, error.message);
                    upgradeInfo.contracts[name] = {
                        status: "failed",
                        error: error.message
                    };
                }
            }
        }

        // Save upgrade info
        upgradeManifest.upgrades.push(upgradeInfo);
        fs.writeFileSync(manifestPath, JSON.stringify(upgradeManifest, null, 2));

        // Update deployment info
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

        // Generate upgrade report
        const report = generateUpgradeReport(upgradeInfo, network);
        const reportPath = path.join(upgradeDir, `upgrade-report-${Date.now()}.md`);
        fs.writeFileSync(reportPath, report);

        console.log("\n✓ Upgrade completed successfully");
        console.log("Upgrade report saved to:", reportPath);

        // Print upgrade summary
        console.log("\nUpgrade Summary:");
        for (const [name, info] of Object.entries(upgradeInfo.contracts)) {
            if (info.status === "failed") {
                console.log(`❌ ${name}: Upgrade failed - ${info.error}`);
            } else {
                console.log(`✓ ${name}: Upgraded to version ${info.version}`);
            }
        }

    } catch (error) {
        console.error("\nUpgrade process failed:", error.message);
        throw error;
    }
}

function generateUpgradeReport(upgradeInfo, network) {
    const explorerUrl = network.config.blockExplorerUrls?.[0] || "";
    
    let report = `# Contract Upgrade Report

## Overview
- Network: ${network.name}
- Chain ID: ${network.chainId}
- Timestamp: ${upgradeInfo.timestamp}

## Upgraded Contracts\n`;

    for (const [name, info] of Object.entries(upgradeInfo.contracts)) {
        if (info.status === "failed") {
            report += `\n### ${name}
- Status: ❌ Failed
- Error: ${info.error}`;
        } else {
            report += `\n### ${name}
- Status: ✓ Success
- New Version: ${info.version}
- Proxy Address: \`${info.proxyAddress}\`
- Implementation Address: \`${info.implementationAddress}\`
- Upgrade Transaction: \`${info.upgradeTransaction}\``;

            if (explorerUrl) {
                report += `
- Explorer Links:
  - [Proxy Contract](${explorerUrl}/address/${info.proxyAddress})
  - [Implementation Contract](${explorerUrl}/address/${info.implementationAddress})
  - [Upgrade Transaction](${explorerUrl}/tx/${info.upgradeTransaction})`;
            }
        }
    }

    report += `\n\n## Verification Status
- Block Explorer: ${explorerUrl || "Not available"}
- Contract verification: ${process.env.VERIFY_CONTRACTS === "true" ? "Enabled" : "Disabled"}

## Notes
- All proxy contracts maintain their existing addresses
- Storage layouts have been validated for compatibility
- New implementations have been verified on the block explorer (if enabled)
- Previous implementations remain available but are no longer used

## Next Steps
1. Verify the upgraded contracts are functioning correctly
2. Monitor events and transactions for any issues
3. Update frontend applications to use new features
4. Document any new functions or changes in behavior
`;

    return report;
}

// Execute upgrade
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
