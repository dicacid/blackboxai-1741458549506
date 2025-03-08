const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n🔍 Validating contract upgrades...\n");

    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployments", network.name, "deployment.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployment info not found. Please deploy contracts first.");
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const network = await ethers.provider.getNetwork();
    
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}\n`);

    // Create validation report directory
    const reportDir = path.join(__dirname, "../reports/upgrade-validation");
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const validationReport = {
        timestamp: new Date().toISOString(),
        network: network.name,
        chainId: network.chainId,
        results: {}
    };

    // Validate each upgradeable contract
    for (const [name, info] of Object.entries(deploymentInfo.contracts)) {
        if (info.upgradeable) {
            console.log(`\nValidating ${name}...`);
            
            try {
                // Get contract factories
                const ContractV1 = await ethers.getContractFactory(name);
                const ContractV2 = await ethers.getContractFactory(`${name}V2`);

                console.log("Checking storage layout compatibility...");
                const validationErrors = await validateStorageLayout(ContractV1, ContractV2);

                if (validationErrors.length > 0) {
                    console.log("\n❌ Storage layout validation failed:");
                    validationErrors.forEach(error => console.log(`- ${error}`));
                    
                    validationReport.results[name] = {
                        status: "failed",
                        errors: validationErrors
                    };
                    continue;
                }

                console.log("✓ Storage layout is compatible");

                // Validate upgrade safety
                console.log("\nValidating upgrade safety...");
                const validationResult = await upgrades.validateUpgrade(
                    info.address,
                    ContractV2,
                    { kind: "transparent" }
                );

                if (validationResult.errors.length > 0) {
                    console.log("\n❌ Upgrade validation failed:");
                    validationResult.errors.forEach(error => console.log(`- ${error}`));
                    
                    validationReport.results[name] = {
                        status: "failed",
                        errors: validationResult.errors
                    };
                    continue;
                }

                console.log("✓ Upgrade validation passed");

                // Simulate upgrade
                console.log("\nSimulating upgrade...");
                const simulation = await simulateUpgrade(info.address, ContractV2);

                validationReport.results[name] = {
                    status: "success",
                    storageCompatible: true,
                    upgradeValid: true,
                    simulation
                };

                console.log("✓ Upgrade simulation completed successfully");
                console.log("\nGas estimation:", simulation.gasEstimate.toString());
                console.log("State changes:", simulation.stateChanges.length);

            } catch (error) {
                console.error(`\n❌ Error validating ${name}:`, error.message);
                validationReport.results[name] = {
                    status: "error",
                    error: error.message
                };
            }
        }
    }

    // Generate detailed report
    const report = generateValidationReport(validationReport);
    const reportPath = path.join(reportDir, `validation-${Date.now()}.md`);
    fs.writeFileSync(reportPath, report);

    // Save validation results
    const resultsPath = path.join(reportDir, `validation-${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(validationReport, null, 2));

    console.log("\nValidation Summary:");
    console.log("------------------");
    Object.entries(validationReport.results).forEach(([name, result]) => {
        const status = result.status === "success" ? "✓" : "❌";
        console.log(`${status} ${name}: ${result.status}`);
    });

    console.log("\nDetailed report saved to:", reportPath);
    console.log("Validation results saved to:", resultsPath);
}

async function validateStorageLayout(V1Factory, V2Factory) {
    const errors = [];
    
    // Get storage layouts
    const layoutV1 = await getStorageLayout(V1Factory);
    const layoutV2 = await getStorageLayout(V2Factory);

    // Compare storage slots
    layoutV1.storage.forEach((slotV1, index) => {
        const slotV2 = layoutV2.storage[index];
        
        if (!slotV2) {
            errors.push(`Storage slot ${index} removed in V2`);
            return;
        }

        if (slotV1.type !== slotV2.type) {
            errors.push(`Storage slot ${index} type changed from ${slotV1.type} to ${slotV2.type}`);
        }

        if (slotV1.label !== slotV2.label) {
            errors.push(`Storage slot ${index} label changed from ${slotV1.label} to ${slotV2.label}`);
        }
    });

    return errors;
}

async function getStorageLayout(Factory) {
    const artifact = await Factory.deploy();
    return await artifact.getStorageLayout();
}

async function simulateUpgrade(proxyAddress, V2Factory) {
    const simulation = {
        gasEstimate: ethers.BigNumber.from(0),
        stateChanges: []
    };

    try {
        // Deploy implementation
        const implementation = await V2Factory.deploy();
        await implementation.deployed();

        // Estimate gas
        const proxy = await ethers.getContractAt(V2Factory.interface, proxyAddress);
        const upgradeCall = proxy.interface.encodeFunctionData("upgradeTo", [implementation.address]);
        simulation.gasEstimate = await proxy.estimateGas.upgradeTo(implementation.address);

        // Simulate state changes
        const stateBefore = await getContractState(proxy);
        await proxy.upgradeTo(implementation.address);
        const stateAfter = await getContractState(proxy);

        // Compare states
        Object.keys(stateBefore).forEach(key => {
            if (stateBefore[key] !== stateAfter[key]) {
                simulation.stateChanges.push({
                    variable: key,
                    before: stateBefore[key],
                    after: stateAfter[key]
                });
            }
        });

    } catch (error) {
        simulation.error = error.message;
    }

    return simulation;
}

async function getContractState(contract) {
    const state = {};
    const functions = Object.values(contract.interface.functions)
        .filter(f => f.stateMutability === "view");

    for (const func of functions) {
        try {
            const result = await contract[func.name]();
            state[func.name] = result.toString();
        } catch (error) {
            // Skip failed calls
            continue;
        }
    }

    return state;
}

function generateValidationReport(validationReport) {
    let report = `# Contract Upgrade Validation Report

## Overview
- Timestamp: ${validationReport.timestamp}
- Network: ${validationReport.network}
- Chain ID: ${validationReport.chainId}

## Validation Results\n`;

    Object.entries(validationReport.results).forEach(([name, result]) => {
        report += `\n### ${name}\n`;
        report += `Status: ${result.status === "success" ? "✓ Passed" : "❌ Failed"}\n`;

        if (result.status === "success") {
            report += `
- Storage Layout: ${result.storageCompatible ? "✓ Compatible" : "❌ Incompatible"}
- Upgrade Safety: ${result.upgradeValid ? "✓ Valid" : "❌ Invalid"}
- Gas Estimation: ${result.simulation.gasEstimate.toString()}
- State Changes: ${result.simulation.stateChanges.length}\n`;

            if (result.simulation.stateChanges.length > 0) {
                report += "\nState Changes:\n";
                result.simulation.stateChanges.forEach(change => {
                    report += `- ${change.variable}: ${change.before} -> ${change.after}\n`;
                });
            }
        } else if (result.status === "failed") {
            report += "\nValidation Errors:\n";
            result.errors.forEach(error => {
                report += `- ${error}\n`;
            });
        } else {
            report += `\nError: ${result.error}\n`;
        }
    });

    report += `\n## Recommendations\n`;
    const recommendations = generateRecommendations(validationReport);
    recommendations.forEach(rec => {
        report += `- ${rec}\n`;
    });

    return report;
}

function generateRecommendations(validationReport) {
    const recommendations = [];
    const hasFailures = Object.values(validationReport.results)
        .some(result => result.status !== "success");

    if (hasFailures) {
        recommendations.push("Address all validation errors before proceeding with upgrades");
        recommendations.push("Review storage layout changes carefully");
        recommendations.push("Consider using storage gaps in upgradeable contracts");
    }

    recommendations.push(
        "Test all contract functionality after upgrade",
        "Monitor gas costs for any significant changes",
        "Update frontend applications to handle any interface changes",
        "Document all changes in contract behavior",
        "Consider gradual rollout strategy for critical upgrades"
    );

    return recommendations;
}

// Execute validation
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
