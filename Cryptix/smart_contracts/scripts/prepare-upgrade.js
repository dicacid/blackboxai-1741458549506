const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n🔧 Preparing contracts for upgrade...\n");

    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}\n`);

    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployments", network.name, "deployment.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployment info not found. Please deploy contracts first.");
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    // Create preparation report directory
    const reportDir = path.join(__dirname, "../reports/upgrade-preparation");
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const preparation = {
        timestamp: Date.now(),
        network: network.name,
        chainId: network.chainId,
        contracts: {}
    };

    // Prepare each contract
    for (const [name, info] of Object.entries(deploymentInfo.contracts)) {
        if (!info.upgradeable) continue;

        console.log(`\nPreparing ${name} for upgrade...`);
        
        try {
            // Load current and new contract versions
            const CurrentContract = await ethers.getContractFactory(name);
            const NewContract = await ethers.getContractFactory(`${name}V2`);

            // Validate upgrade safety
            console.log("\nValidating upgrade safety...");
            const validationErrors = await validateUpgrade(
                info.address,
                CurrentContract,
                NewContract
            );

            if (validationErrors.length > 0) {
                console.log("\n❌ Upgrade validation failed:");
                validationErrors.forEach(error => console.log(`- ${error}`));
                preparation.contracts[name] = {
                    status: "failed",
                    errors: validationErrors
                };
                continue;
            }

            console.log("✓ Upgrade validation passed");

            // Check storage layout
            console.log("\nAnalyzing storage layout...");
            const storageChanges = await analyzeStorageLayout(
                CurrentContract,
                NewContract
            );

            // Optimize implementation
            console.log("\nOptimizing implementation...");
            const optimizations = await optimizeImplementation(NewContract);

            // Estimate upgrade costs
            console.log("\nEstimating upgrade costs...");
            const costs = await estimateUpgradeCosts(
                info.address,
                NewContract
            );

            // Record preparation results
            preparation.contracts[name] = {
                status: "success",
                currentVersion: info.version,
                newVersion: `${parseInt(info.version) + 1}.0.0`,
                storageChanges,
                optimizations,
                costs,
                recommendations: generateRecommendations(
                    storageChanges,
                    optimizations,
                    costs
                )
            };

            console.log("\n✓ Preparation completed");

        } catch (error) {
            console.error(`\nError preparing ${name}:`, error.message);
            preparation.contracts[name] = {
                status: "error",
                error: error.message
            };
        }
    }

    // Generate preparation report
    const report = generatePreparationReport(preparation);
    const reportPath = path.join(reportDir, `preparation-${Date.now()}.md`);
    fs.writeFileSync(reportPath, report);

    // Save preparation details
    const detailsPath = path.join(reportDir, `preparation-${Date.now()}.json`);
    fs.writeFileSync(detailsPath, JSON.stringify(preparation, null, 2));

    console.log("\nPreparation Summary:");
    console.log("-------------------");
    Object.entries(preparation.contracts).forEach(([name, info]) => {
        if (info.status === "success") {
            console.log(`✓ ${name}: Ready for upgrade`);
            if (info.recommendations.length > 0) {
                console.log("  Recommendations:");
                info.recommendations.forEach(rec => console.log(`  - ${rec}`));
            }
        } else {
            console.log(`❌ ${name}: ${info.status === "failed" ? "Validation failed" : "Error"}`);
        }
    });

    console.log("\nDetailed report saved to:", reportPath);
}

async function validateUpgrade(proxyAddress, CurrentContract, NewContract) {
    const errors = [];

    try {
        // Check UUPS compatibility
        if (!NewContract.interface.fragments.some(f => f.name === "upgradeTo")) {
            errors.push("New implementation missing upgradeTo function");
        }

        // Validate storage layout compatibility
        const layoutCompatibility = await upgrades.validateUpgrade(
            proxyAddress,
            NewContract,
            { kind: "uups" }
        );

        if (layoutCompatibility.errors.length > 0) {
            errors.push(...layoutCompatibility.errors);
        }

        // Check function selectors
        const currentSelectors = Object.keys(CurrentContract.interface.functions);
        const newSelectors = Object.keys(NewContract.interface.functions);
        
        const removedFunctions = currentSelectors.filter(
            s => !newSelectors.includes(s) && !s.startsWith("upgradeTo")
        );

        if (removedFunctions.length > 0) {
            errors.push(`Removed functions: ${removedFunctions.join(", ")}`);
        }

    } catch (error) {
        errors.push(error.message);
    }

    return errors;
}

async function analyzeStorageLayout(CurrentContract, NewContract) {
    const changes = {
        added: [],
        modified: [],
        unchanged: []
    };

    try {
        const currentLayout = await getStorageLayout(CurrentContract);
        const newLayout = await getStorageLayout(NewContract);

        // Compare storage slots
        for (const [slot, currentVar] of Object.entries(currentLayout)) {
            const newVar = newLayout[slot];
            
            if (!newVar) {
                changes.modified.push({
                    variable: currentVar.label,
                    type: "removed",
                    slot
                });
            } else if (currentVar.type !== newVar.type) {
                changes.modified.push({
                    variable: currentVar.label,
                    type: "type_changed",
                    from: currentVar.type,
                    to: newVar.type,
                    slot
                });
            } else {
                changes.unchanged.push(currentVar.label);
            }
        }

        // Find new variables
        for (const [slot, newVar] of Object.entries(newLayout)) {
            if (!currentLayout[slot]) {
                changes.added.push({
                    variable: newVar.label,
                    type: newVar.type,
                    slot
                });
            }
        }

    } catch (error) {
        console.warn("Error analyzing storage layout:", error.message);
    }

    return changes;
}

async function optimizeImplementation(Contract) {
    const optimizations = [];

    try {
        // Get contract bytecode
        const bytecode = Contract.bytecode;
        const size = (bytecode.length - 2) / 2;

        // Check contract size
        if (size > 24576) {
            optimizations.push({
                type: "size",
                message: `Contract size (${size} bytes) exceeds limit (24576 bytes)`,
                recommendation: "Consider splitting contract or removing unused functions"
            });
        }

        // Check function optimizations
        const functions = Object.values(Contract.interface.functions);
        
        functions.forEach(func => {
            // Check function complexity
            if (func.inputs.length > 10) {
                optimizations.push({
                    type: "complexity",
                    message: `Function ${func.name} has many parameters (${func.inputs.length})`,
                    recommendation: "Consider using a struct for parameters"
                });
            }

            // Check state mutability
            if (func.stateMutability === "nonpayable" && !func.payable) {
                optimizations.push({
                    type: "gas",
                    message: `Function ${func.name} could be marked view/pure`,
                    recommendation: "Review state mutability"
                });
            }
        });

    } catch (error) {
        console.warn("Error optimizing implementation:", error.message);
    }

    return optimizations;
}

async function estimateUpgradeCosts(proxyAddress, NewContract) {
    const costs = {
        implementation: "0",
        upgrade: "0",
        total: "0"
    };

    try {
        // Estimate implementation deployment
        const implementationGas = await NewContract.signer.estimateGas(
            NewContract.getDeployTransaction()
        );
        costs.implementation = implementationGas.toString();

        // Estimate upgrade transaction
        const proxy = await ethers.getContractAt("ITransparentUpgradeableProxy", proxyAddress);
        const upgradeGas = await proxy.estimateGas.upgradeTo(NewContract.address);
        costs.upgrade = upgradeGas.toString();

        // Calculate total
        costs.total = (implementationGas.add(upgradeGas)).toString();

    } catch (error) {
        console.warn("Error estimating costs:", error.message);
    }

    return costs;
}

function generateRecommendations(storageChanges, optimizations, costs) {
    const recommendations = [];

    // Storage recommendations
    if (storageChanges.modified.length > 0) {
        recommendations.push("Review storage modifications carefully");
    }
    if (storageChanges.added.length > 0) {
        recommendations.push("Consider using storage gaps for future upgrades");
    }

    // Optimization recommendations
    optimizations.forEach(opt => {
        recommendations.push(opt.recommendation);
    });

    // Cost recommendations
    const totalGas = parseInt(costs.total);
    if (totalGas > 1000000) {
        recommendations.push("Consider optimizing for lower gas costs");
    }

    return recommendations;
}

function generatePreparationReport(preparation) {
    return `# Contract Upgrade Preparation Report

## Overview
- Timestamp: ${new Date(preparation.timestamp).toISOString()}
- Network: ${preparation.network}
- Chain ID: ${preparation.chainId}

## Contract Analysis

${Object.entries(preparation.contracts).map(([name, info]) => `
### ${name}
${info.status === "success" ? `
Status: ✓ Ready for upgrade
Current Version: ${info.currentVersion}
New Version: ${info.newVersion}

#### Storage Changes
- Added Variables: ${info.storageChanges.added.length}
- Modified Variables: ${info.storageChanges.modified.length}
- Unchanged Variables: ${info.storageChanges.unchanged.length}

${info.storageChanges.added.length > 0 ? `
Added Variables:
${info.storageChanges.added.map(v => `- ${v.variable} (${v.type})`).join('\n')}
` : ''}

${info.storageChanges.modified.length > 0 ? `
Modified Variables:
${info.storageChanges.modified.map(v => `- ${v.variable}: ${v.type}`).join('\n')}
` : ''}

#### Optimizations
${info.optimizations.map(opt => `- ${opt.message}`).join('\n')}

#### Estimated Costs
- Implementation Deployment: ${info.costs.implementation} gas
- Upgrade Transaction: ${info.costs.upgrade} gas
- Total: ${info.costs.total} gas

#### Recommendations
${info.recommendations.map(rec => `- ${rec}`).join('\n')}
` : `
Status: ❌ ${info.status === "failed" ? "Validation Failed" : "Error"}
${info.errors ? `
Errors:
${info.errors.map(err => `- ${err}`).join('\n')}
` : `Error: ${info.error}`}`}
`).join('\n')}

## Next Steps
1. Review all recommendations
2. Address any validation errors
3. Test new implementations thoroughly
4. Prepare upgrade transactions
5. Monitor gas prices for optimal deployment

## Notes
- All storage modifications should be carefully reviewed
- Consider running simulation tests before upgrading
- Have rollback plan ready
- Monitor contract events during upgrade
`;
}

// Execute preparation
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
