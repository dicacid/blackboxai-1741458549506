const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n💾 Creating contract state backup...\n");

    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployments", network.name, "deployment.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployment info not found. Please deploy contracts first.");
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const network = await ethers.provider.getNetwork();
    
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}\n`);

    // Create backup directory
    const timestamp = Date.now();
    const backupDir = path.join(__dirname, "../backups", network.name, timestamp.toString());
    fs.mkdirSync(backupDir, { recursive: true });

    const backup = {
        timestamp,
        network: network.name,
        chainId: network.chainId,
        blockNumber: await ethers.provider.getBlockNumber(),
        contracts: {}
    };

    // Backup each contract
    for (const [name, info] of Object.entries(deploymentInfo.contracts)) {
        console.log(`\nBacking up ${name}...`);
        
        try {
            // Get contract instance
            const artifact = await artifacts.readArtifact(name);
            const contract = new ethers.Contract(
                info.address,
                artifact.abi,
                ethers.provider
            );

            // Capture contract state
            const state = await captureContractState(contract, name);
            
            // Save contract state
            backup.contracts[name] = {
                address: info.address,
                implementation: info.implementationAddress,
                version: info.version,
                state
            };

            // Save ABI separately
            fs.writeFileSync(
                path.join(backupDir, `${name}.abi.json`),
                JSON.stringify(artifact.abi, null, 2)
            );

            console.log(`✓ Backed up ${Object.keys(state).length} state variables`);

        } catch (error) {
            console.error(`Error backing up ${name}:`, error.message);
            backup.contracts[name] = {
                address: info.address,
                error: error.message
            };
        }
    }

    // Save backup manifest
    const manifestPath = path.join(backupDir, "backup.json");
    fs.writeFileSync(manifestPath, JSON.stringify(backup, null, 2));

    // Generate backup report
    const report = generateBackupReport(backup);
    const reportPath = path.join(backupDir, "backup-report.md");
    fs.writeFileSync(reportPath, report);

    // Create backup info file
    const infoPath = path.join(__dirname, "../backups", network.name, "backups.json");
    let backupInfo = { backups: [] };
    
    if (fs.existsSync(infoPath)) {
        backupInfo = JSON.parse(fs.readFileSync(infoPath, "utf8"));
    }

    backupInfo.backups.push({
        timestamp,
        path: backupDir,
        network: network.name,
        blockNumber: backup.blockNumber
    });

    fs.writeFileSync(infoPath, JSON.stringify(backupInfo, null, 2));

    console.log("\n✓ Backup completed successfully");
    console.log("Backup location:", backupDir);
    console.log("Backup report:", reportPath);

    // Print summary
    console.log("\nBackup Summary:");
    console.log("---------------");
    Object.entries(backup.contracts).forEach(([name, info]) => {
        if (info.error) {
            console.log(`❌ ${name}: Backup failed - ${info.error}`);
        } else {
            console.log(`✓ ${name}: ${Object.keys(info.state).length} state variables backed up`);
        }
    });
}

async function captureContractState(contract, name) {
    const state = {};
    
    try {
        // Get all readable functions
        const functions = Object.values(contract.interface.functions)
            .filter(f => f.stateMutability === "view" && f.inputs.length === 0);

        // Call each function
        for (const func of functions) {
            try {
                const result = await contract[func.name]();
                
                // Handle different return types
                if (Array.isArray(result)) {
                    state[func.name] = result.map(item => 
                        item._isBigNumber ? item.toString() : item
                    );
                } else if (result._isBigNumber) {
                    state[func.name] = result.toString();
                } else if (typeof result === 'object') {
                    state[func.name] = Object.fromEntries(
                        Object.entries(result).map(([k, v]) => [
                            k,
                            v._isBigNumber ? v.toString() : v
                        ])
                    );
                } else {
                    state[func.name] = result;
                }
            } catch (error) {
                console.warn(`Warning: Failed to backup ${func.name} in ${name}:`, error.message);
            }
        }

        // Get storage slots for non-view variables
        const storageLayout = await getStorageLayout(name);
        if (storageLayout) {
            state._storage = {};
            for (const variable of storageLayout.storage) {
                try {
                    const value = await ethers.provider.getStorageAt(
                        contract.address,
                        variable.slot
                    );
                    state._storage[variable.label] = value;
                } catch (error) {
                    console.warn(`Warning: Failed to read storage slot for ${variable.label}`);
                }
            }
        }

    } catch (error) {
        console.error("Error capturing contract state:", error);
    }

    return state;
}

async function getStorageLayout(contractName) {
    try {
        const buildInfo = await artifacts.getBuildInfo(contractName);
        return buildInfo.output.contracts[contractName].storageLayout;
    } catch (error) {
        console.warn(`Warning: Could not get storage layout for ${contractName}`);
        return null;
    }
}

function generateBackupReport(backup) {
    return `# Contract State Backup Report

## Overview
- Timestamp: ${new Date(backup.timestamp).toISOString()}
- Network: ${backup.network}
- Chain ID: ${backup.chainId}
- Block Number: ${backup.blockNumber}

## Backed Up Contracts

${Object.entries(backup.contracts).map(([name, info]) => `
### ${name}
${info.error ? `❌ Backup failed: ${info.error}` : `
- Address: \`${info.address}\`
- Implementation: \`${info.implementation}\`
- Version: ${info.version}
- State Variables: ${Object.keys(info.state).length}
- Storage Slots: ${info.state._storage ? Object.keys(info.state._storage).length : 'N/A'}
`}`).join('\n')}

## Storage Details

${Object.entries(backup.contracts)
    .filter(([_, info]) => !info.error)
    .map(([name, info]) => `
### ${name}
${Object.entries(info.state)
    .filter(([key]) => key !== '_storage')
    .map(([key, value]) => `- ${key}: ${
        typeof value === 'object' ? 
            '\n  ' + JSON.stringify(value, null, 2).replace(/\n/g, '\n  ') : 
            value
    }`)
    .join('\n')
}`).join('\n')}

## Recommendations
1. Keep this backup secure and accessible
2. Test restore functionality before upgrading
3. Verify all critical state is captured
4. Document any custom state transformations
5. Monitor contract events during restore

## Notes
- Backup includes all public view functions
- Storage slots are backed up where possible
- Some complex data types may need manual verification
- Consider running a restore test before upgrading
`;
}

// Execute backup
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
