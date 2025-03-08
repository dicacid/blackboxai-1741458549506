const fs = require("fs");
const path = require("path");

/**
 * Generate a markdown report for contract upgrades
 * @param {Object} data - Report data
 * @param {string} type - Report type
 * @returns {string} Markdown content
 */
function generateMarkdownReport(data, type) {
    switch (type) {
        case "upgrade":
            return generateUpgradeReport(data);
        case "validation":
            return generateValidationReport(data);
        case "preparation":
            return generatePreparationReport(data);
        case "simulation":
            return generateSimulationReport(data);
        case "backup":
            return generateBackupReport(data);
        case "restore":
            return generateRestoreReport(data);
        default:
            return generateGenericReport(data);
    }
}

/**
 * Generate upgrade report
 * @param {Object} data - Upgrade data
 * @returns {string} Markdown content
 */
function generateUpgradeReport(data) {
    return `# Contract Upgrade Report

## Overview
- Timestamp: ${new Date(data.timestamp).toISOString()}
- Network: ${data.network}
- Chain ID: ${data.chainId}

## Upgraded Contracts

${Object.entries(data.contracts).map(([name, info]) => `
### ${name}
${info.status === "success" ? `
✓ Upgrade Successful
- Previous Version: ${info.previousVersion}
- New Version: ${info.newVersion}
- Implementation: \`${info.implementationAddress}\`
- Proxy: \`${info.proxyAddress}\`
- Transaction: \`${info.transaction}\`

#### Changes
${info.changes.map(change => `- ${change}`).join('\n')}

#### Gas Usage
- Implementation Deployment: ${info.gas.implementation} gas
- Upgrade Transaction: ${info.gas.upgrade} gas
- Total Cost: ${info.gas.totalEth} ETH

#### Verification
- Contract Verified: ${info.verified ? '✓' : '❌'}
- Explorer Link: ${info.explorerLink || 'N/A'}
` : `
❌ Upgrade Failed
Error: ${info.error}
`}`).join('\n')}

## Post-Upgrade Verification
${data.verification.map(v => `- ${v.status ? '✓' : '❌'} ${v.check}`).join('\n')}

## Recommendations
${data.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps
1. Verify all contract functionality
2. Monitor contract events
3. Update frontend applications
4. Document changes
5. Monitor for any issues

## Notes
- Backup Location: ${data.backup.location}
- Deployment Files: ${data.backup.files.join(', ')}
- Documentation Updated: ${data.docsUpdated ? '✓' : '❌'}
`;
}

/**
 * Generate validation report
 * @param {Object} data - Validation data
 * @returns {string} Markdown content
 */
function generateValidationReport(data) {
    return `# Contract Validation Report

## Overview
- Timestamp: ${new Date(data.timestamp).toISOString()}
- Network: ${data.network}
- Chain ID: ${data.chainId}

## Validation Results

${Object.entries(data.contracts).map(([name, info]) => `
### ${name}
${info.status === "success" ? `
✓ Validation Passed

#### Storage Layout
- Compatible: ${info.storage.compatible ? '✓' : '❌'}
- Added Variables: ${info.storage.added.length}
- Modified Variables: ${info.storage.modified.length}
- Unchanged Variables: ${info.storage.unchanged.length}

${info.storage.added.length > 0 ? `
Added Variables:
${info.storage.added.map(v => `- ${v.name}: ${v.type}`).join('\n')}
` : ''}

${info.storage.modified.length > 0 ? `
Modified Variables:
${info.storage.modified.map(v => `- ${v.name}: ${v.from} -> ${v.to}`).join('\n')}
` : ''}

#### Function Compatibility
- Removed Functions: ${info.functions.removed.length}
- Modified Functions: ${info.functions.modified.length}
- Added Functions: ${info.functions.added.length}

${info.functions.removed.length > 0 ? `
Removed Functions:
${info.functions.removed.map(f => `- ${f}`).join('\n')}
` : ''}

${info.functions.modified.length > 0 ? `
Modified Functions:
${info.functions.modified.map(f => `- ${f.name}: ${f.changes}`).join('\n')}
` : ''}

${info.functions.added.length > 0 ? `
Added Functions:
${info.functions.added.map(f => `- ${f}`).join('\n')}
` : ''}

#### Security Checks
${info.security.map(check => `- ${check.passed ? '✓' : '❌'} ${check.name}`).join('\n')}
` : `
❌ Validation Failed
${info.errors.map(err => `- ${err}`).join('\n')}
`}`).join('\n')}

## Recommendations
${data.recommendations.map(rec => `- ${rec}`).join('\n')}

## Required Actions
${data.requiredActions.map(action => `- ${action}`).join('\n')}
`;
}

/**
 * Generate preparation report
 * @param {Object} data - Preparation data
 * @returns {string} Markdown content
 */
function generatePreparationReport(data) {
    return `# Upgrade Preparation Report

## Overview
- Timestamp: ${new Date(data.timestamp).toISOString()}
- Network: ${data.network}
- Chain ID: ${data.chainId}

## Contract Analysis

${Object.entries(data.contracts).map(([name, info]) => `
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
` : `Error: ${info.error}`}`}`).join('\n')}

## Required Actions
${data.requiredActions.map(action => `- ${action}`).join('\n')}

## Next Steps
1. Review all recommendations
2. Address any validation errors
3. Test new implementations thoroughly
4. Prepare upgrade transactions
5. Monitor gas prices for optimal deployment
`;
}

/**
 * Generate simulation report
 * @param {Object} data - Simulation data
 * @returns {string} Markdown content
 */
function generateSimulationReport(data) {
    return `# Upgrade Simulation Report

## Overview
- Timestamp: ${new Date(data.timestamp).toISOString()}
- Network: ${data.network} (Forked)
- Block Number: ${data.blockNumber}

## Simulation Results

${Object.entries(data.contracts).map(([name, info]) => `
### ${name}
${info.status === "success" ? `
✓ Simulation Successful

#### State Changes
${Object.entries(info.stateChanges).map(([key, value]) => `- ${key}: ${value.from} -> ${value.to}`).join('\n')}

#### Events Emitted
${info.events.map(event => `- ${event.name}(${event.args.join(', ')})`).join('\n')}

#### Gas Usage
- Implementation: ${info.gas.implementation} gas
- Upgrade: ${info.gas.upgrade} gas
- Function Calls: ${info.gas.functions} gas
` : `
❌ Simulation Failed
Error: ${info.error}
`}`).join('\n')}

## Test Scenarios
${data.scenarios.map(scenario => `
### ${scenario.name}
Status: ${scenario.success ? '✓ Passed' : '❌ Failed'}
${scenario.error ? `Error: ${scenario.error}` : ''}
`).join('\n')}

## Recommendations
${data.recommendations.map(rec => `- ${rec}`).join('\n')}
`;
}

/**
 * Generate backup report
 * @param {Object} data - Backup data
 * @returns {string} Markdown content
 */
function generateBackupReport(data) {
    return `# Contract State Backup Report

## Overview
- Timestamp: ${new Date(data.timestamp).toISOString()}
- Network: ${data.network}
- Block Number: ${data.blockNumber}

## Backed Up Contracts

${Object.entries(data.contracts).map(([name, info]) => `
### ${name}
${info.error ? `❌ Backup failed: ${info.error}` : `
- Address: \`${info.address}\`
- Implementation: \`${info.implementation}\`
- Version: ${info.version}
- State Variables: ${Object.keys(info.state).length}
- Storage Slots: ${info.state._storage ? Object.keys(info.state._storage).length : 'N/A'}
`}`).join('\n')}

## Storage Details

${Object.entries(data.contracts)
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

## Backup Location
- Directory: ${data.backupPath}
- Files: ${data.files.join(', ')}

## Recommendations
1. Keep this backup secure and accessible
2. Test restore functionality before upgrading
3. Verify all critical state is captured
4. Document any custom state transformations
5. Monitor contract events during restore
`;
}

/**
 * Generate restore report
 * @param {Object} data - Restore data
 * @returns {string} Markdown content
 */
function generateRestoreReport(data) {
    return `# Contract State Restore Report

## Overview
- Restore Timestamp: ${new Date(data.timestamp).toISOString()}
- Backup Timestamp: ${new Date(data.backupTimestamp).toISOString()}
- Network: ${data.network}
- Chain ID: ${data.chainId}

## Restored Contracts

${Object.entries(data.contracts).map(([name, info]) => `
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

/**
 * Generate generic report
 * @param {Object} data - Report data
 * @returns {string} Markdown content
 */
function generateGenericReport(data) {
    return `# Contract Operation Report

## Overview
- Timestamp: ${new Date(data.timestamp).toISOString()}
- Network: ${data.network}
- Chain ID: ${data.chainId}

## Details
${Object.entries(data).map(([key, value]) => 
    typeof value === 'object' 
        ? `\n### ${key}\n${JSON.stringify(value, null, 2)}`
        : `- ${key}: ${value}`
).join('\n')}
`;
}

/**
 * Save report to file
 * @param {string} content - Report content
 * @param {string} type - Report type
 * @param {string} network - Network name
 * @returns {string} Report file path
 */
function saveReport(content, type, network) {
    const reportDir = path.join(__dirname, "../../reports", type, network);
    fs.mkdirSync(reportDir, { recursive: true });

    const timestamp = Date.now();
    const reportPath = path.join(reportDir, `${type}-${timestamp}.md`);
    fs.writeFileSync(reportPath, content);

    return reportPath;
}

module.exports = {
    generateMarkdownReport,
    generateUpgradeReport,
    generateValidationReport,
    generatePreparationReport,
    generateSimulationReport,
    generateBackupReport,
    generateRestoreReport,
    generateGenericReport,
    saveReport
};
