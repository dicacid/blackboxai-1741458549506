const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n🔄 Restoring contract state from backup...\n");

    // Get backup timestamp from command line
    const timestamp = process.env.BACKUP_TIMESTAMP;
    if (!timestamp) {
        throw new Error("Please provide BACKUP_TIMESTAMP environment variable");
    }

    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}`);
    console.log(`Backup Timestamp: ${timestamp}\n`);

    // Load backup
    const backupDir = path.join(__dirname, "../backups", network.name, timestamp);
    if (!fs.existsSync(backupDir)) {
        throw new Error(`Backup not found at ${backupDir}`);
    }

    const backupPath = path.join(backupDir, "backup.json");
    const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));

    // Verify network
    if (backup.chainId !== network.chainId) {
        throw new Error(`Network mismatch. Backup is for chain ID ${backup.chainId}, but current network is ${network.chainId}`);
    }

    // Create restore report directory
    const reportDir = path.join(__dirname, "../reports/restore", network.name);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const restore = {
        timestamp: Date.now(),
        backupTimestamp: parseInt(timestamp),
        network: network.name,
        chainId: network.chainId,
        contracts: {}
    };

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Restoring with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

    // Restore each contract
    for (const [name, info] of Object.entries(backup.contracts)) {
        console.log(`\nRestoring ${name}...`);
        
        try {
            // Get contract instance
            const artifact = await artifacts.readArtifact(name);
            const contract = new ethers.Contract(
                info.address,
                artifact.abi,
                deployer
            );

            // Verify contract code
            const code = await ethers.provider.getCode(info.address);
            if (code === "0x") {
                throw new Error("Contract not deployed at specified address");
            }

            // Restore state
            const restoredState = await restoreContractState(contract, info.state, name);
            
            restore.contracts[name] = {
                address: info.address,
                restoredVariables: restoredState.restored,
                skippedVariables: restoredState.skipped,
                transactions: restoredState.transactions
            };

            console.log(`✓ Restored ${restoredState.restored.length} state variables`);
            if (restoredState.skipped.length > 0) {
                console.log(`⚠️  Skipped ${restoredState.skipped.length} variables`);
            }

        } catch (error) {
            console.error(`Error restoring ${name}:`, error.message);
            restore.contracts[name] = {
                address: info.address,
                error: error.message
            };
        }
    }

    // Generate restore report
    const report = generateRestoreReport(restore, backup);
    const reportPath = path.join(reportDir, `restore-${Date.now()}.md`);
    fs.writeFileSync(reportPath, report);

    // Save restore manifest
    const manifestPath = path.join(reportDir, `restore-${Date.now()}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(restore, null, 2));

    console.log("\nRestore Summary:");
    console.log("---------------");
    Object.entries(restore.contracts).forEach(([name, info]) => {
        if (info.error) {
            console.log(`❌ ${name}: Restore failed - ${info.error}`);
        } else {
            console.log(`✓ ${name}: ${info.restoredVariables.length} variables restored`);
            if (info.skippedVariables.length > 0) {
                console.log(`  ⚠️  ${info.skippedVariables.length} variables skipped`);
            }
        }
    });

    console.log("\nRestore report saved to:", reportPath);
    console.log("Restore manifest saved to:", manifestPath);
}

async function restoreContractState(contract, state, name) {
    const result = {
        restored: [],
        skipped: [],
        transactions: []
    };

    try {
        // Get setter functions
        const setters = Object.values(contract.interface.functions)
            .filter(f => 
                f.stateMutability === "nonpayable" &&
                f.type === "function" &&
                f.name.startsWith("set")
            );

        // Match getters with setters
        for (const [key, value] of Object.entries(state)) {
            if (key === '_storage') continue; // Skip raw storage data

            // Find corresponding setter
            const setterName = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
            const setter = setters.find(f => f.name === setterName);

            if (setter) {
                try {
                    // Prepare value for setter
                    const preparedValue = prepareValueForSetter(value);
                    
                    // Call setter
                    const tx = await contract[setterName](preparedValue);
                    await tx.wait();

                    result.restored.push(key);
                    result.transactions.push(tx.hash);

                } catch (error) {
                    console.warn(`Warning: Failed to restore ${key} in ${name}:`, error.message);
                    result.skipped.push({ key, reason: error.message });
                }
            } else {
                result.skipped.push({ key, reason: "No setter found" });
            }
        }

        // Handle storage restoration if needed
        if (state._storage) {
            console.log("Attempting low-level storage restoration...");
            await restoreStorageSlots(contract.address, state._storage);
        }

    } catch (error) {
        console.error("Error in state restoration:", error);
    }

    return result;
}

function prepareValueForSetter(value) {
    if (Array.isArray(value)) {
        return value.map(prepareValueForSetter);
    } else if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, prepareValueForSetter(v)])
        );
    } else if (typeof value === 'string' && value.startsWith('0x')) {
        return value; // Return hex strings as-is
    } else if (!isNaN(value)) {
        return ethers.BigNumber.from(value);
    }
    return value;
}

async function restoreStorageSlots(address, storage) {
    // Note: This is a low-level operation that should be used with caution
    for (const [slot, value] of Object.entries(storage)) {
        try {
            // This would require special permissions or network forking
            console.warn(`Storage restoration for slot ${slot} not implemented`);
        } catch (error) {
            console.warn(`Failed to restore storage slot ${slot}:`, error.message);
        }
    }
}

function generateRestoreReport(restore, backup) {
    return `# Contract State Restore Report

## Overview
- Restore Timestamp: ${new Date(restore.timestamp).toISOString()}
- Backup Timestamp: ${new Date(restore.backupTimestamp).toISOString()}
- Network: ${restore.network}
- Chain ID: ${restore.chainId}

## Restored Contracts

${Object.entries(restore.contracts).map(([name, info]) => `
### ${name}
${info.error ? `❌ Restore failed: ${info.error}` : `
- Address: \`${info.address}\`
- Restored Variables: ${info.restoredVariables.length}
- Skipped Variables: ${info.skippedVariables.length}
- Transactions: ${info.transactions.length}

#### Restored Variables
${info.restoredVariables.map(v => `- ${v}`).join('\n')}

${info.skippedVariables.length > 0 ? `#### Skipped Variables
${info.skippedVariables.map(v => `- ${v.key}: ${v.reason}`).join('\n')}` : ''}

#### Transactions
${info.transactions.map(tx => `- ${tx}`).join('\n')}
`}`).join('\n')}

## Verification Steps
1. Check all restored variables match backup values
2. Verify contract functionality
3. Test critical operations
4. Monitor for any anomalies
5. Check event emissions

## Notes
- Some variables may require manual restoration
- Complex data structures might need verification
- Monitor contract behavior after restore
- Some storage slots may not be directly accessible

## Recommendations
1. Verify all critical state variables
2. Test contract interactions
3. Monitor events and transactions
4. Document any manual interventions
5. Plan for potential rollback if needed
`;
}

// Execute restore
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
