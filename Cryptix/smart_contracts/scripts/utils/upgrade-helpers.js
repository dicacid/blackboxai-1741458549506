const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Load deployment information for the current network
 * @param {string} networkName - Name of the network
 * @returns {Object} Deployment information
 */
async function loadDeploymentInfo(networkName) {
    const deploymentPath = path.join(__dirname, "../../deployments", networkName, "deployment.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`No deployment found for network: ${networkName}`);
    }
    return JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
}

/**
 * Load upgrade history for the current network
 * @param {string} networkName - Name of the network
 * @returns {Object} Upgrade history
 */
function loadUpgradeHistory(networkName) {
    const historyPath = path.join(__dirname, "../../upgrades", networkName, "history.json");
    if (!fs.existsSync(historyPath)) {
        return { network: networkName, contracts: {} };
    }
    return JSON.parse(fs.readFileSync(historyPath, "utf8"));
}

/**
 * Save upgrade history
 * @param {string} networkName - Name of the network
 * @param {Object} history - Upgrade history to save
 */
function saveUpgradeHistory(networkName, history) {
    const historyPath = path.join(__dirname, "../../upgrades", networkName, "history.json");
    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

/**
 * Get storage layout for a contract
 * @param {Object} Contract - Contract factory
 * @returns {Object} Storage layout information
 */
async function getStorageLayout(Contract) {
    try {
        const artifact = await artifacts.readArtifact(Contract.name);
        const buildInfo = await artifacts.getBuildInfo(Contract.name);
        return buildInfo.output.contracts[artifact.sourceName][Contract.name].storageLayout;
    } catch (error) {
        console.warn(`Warning: Could not get storage layout for ${Contract.name}`);
        return null;
    }
}

/**
 * Compare storage layouts between two contracts
 * @param {Object} oldLayout - Old contract storage layout
 * @param {Object} newLayout - New contract storage layout
 * @returns {Object} Storage comparison results
 */
function compareStorageLayouts(oldLayout, newLayout) {
    const changes = {
        added: [],
        modified: [],
        unchanged: []
    };

    if (!oldLayout || !newLayout) return changes;

    // Compare storage slots
    oldLayout.storage.forEach(oldVar => {
        const newVar = newLayout.storage.find(v => v.label === oldVar.label);
        
        if (!newVar) {
            changes.modified.push({
                variable: oldVar.label,
                type: "removed",
                slot: oldVar.slot
            });
        } else if (oldVar.type !== newVar.type) {
            changes.modified.push({
                variable: oldVar.label,
                type: "type_changed",
                from: oldVar.type,
                to: newVar.type,
                slot: oldVar.slot
            });
        } else {
            changes.unchanged.push(oldVar.label);
        }
    });

    // Find new variables
    newLayout.storage.forEach(newVar => {
        if (!oldLayout.storage.find(v => v.label === newVar.label)) {
            changes.added.push({
                variable: newVar.label,
                type: newVar.type,
                slot: newVar.slot
            });
        }
    });

    return changes;
}

/**
 * Validate version number sequence
 * @param {string} oldVersion - Old version number
 * @param {string} newVersion - New version number
 * @returns {boolean} Whether the sequence is valid
 */
function isValidVersionSequence(oldVersion, newVersion) {
    const [oldMajor, oldMinor, oldPatch] = oldVersion.split(".").map(Number);
    const [newMajor, newMinor, newPatch] = newVersion.split(".").map(Number);

    if (newMajor < oldMajor) return false;
    if (newMajor === oldMajor && newMinor < oldMinor) return false;
    if (newMajor === oldMajor && newMinor === oldMinor && newPatch < oldPatch) return false;

    return true;
}

/**
 * Format contract state for backup/restore
 * @param {Object} state - Contract state
 * @returns {Object} Formatted state
 */
function formatContractState(state) {
    const formatted = {};

    for (const [key, value] of Object.entries(state)) {
        if (value._isBigNumber) {
            formatted[key] = value.toString();
        } else if (Array.isArray(value)) {
            formatted[key] = value.map(v => v._isBigNumber ? v.toString() : v);
        } else if (typeof value === 'object' && value !== null) {
            formatted[key] = formatContractState(value);
        } else {
            formatted[key] = value;
        }
    }

    return formatted;
}

/**
 * Generate a report file
 * @param {string} reportType - Type of report
 * @param {Object} data - Report data
 * @param {string} networkName - Name of the network
 */
function generateReport(reportType, data, networkName) {
    const reportDir = path.join(__dirname, "../../reports", reportType, networkName);
    fs.mkdirSync(reportDir, { recursive: true });

    const timestamp = Date.now();
    const reportPath = path.join(reportDir, `${reportType}-${timestamp}.json`);
    const reportData = {
        timestamp,
        network: networkName,
        ...data
    };

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    return reportPath;
}

/**
 * Estimate gas costs for contract operations
 * @param {Object} contract - Contract instance
 * @param {string} functionName - Function to estimate
 * @param {Array} args - Function arguments
 * @returns {Object} Gas estimation results
 */
async function estimateGasCosts(contract, functionName, args = []) {
    try {
        const gasPrice = await ethers.provider.getGasPrice();
        const gasEstimate = await contract.estimateGas[functionName](...args);
        const costWei = gasEstimate.mul(gasPrice);
        const costEth = ethers.utils.formatEther(costWei);

        return {
            gas: gasEstimate.toString(),
            gasPrice: gasPrice.toString(),
            costWei: costWei.toString(),
            costEth
        };
    } catch (error) {
        console.warn(`Warning: Could not estimate gas for ${functionName}`);
        return null;
    }
}

/**
 * Check if a contract is upgradeable
 * @param {string} address - Contract address
 * @returns {Promise<boolean>} Whether the contract is upgradeable
 */
async function isUpgradeable(address) {
    try {
        const code = await ethers.provider.getCode(address);
        // Check for UUPS proxy pattern
        return code.includes("3659cfe6") || // upgradeTo(address)
               code.includes("4f1ef286");    // upgradeToAndCall(address,bytes)
    } catch (error) {
        return false;
    }
}

/**
 * Get implementation address for a proxy contract
 * @param {string} proxyAddress - Proxy contract address
 * @returns {Promise<string>} Implementation address
 */
async function getImplementationAddress(proxyAddress) {
    try {
        return await upgrades.erc1967.getImplementationAddress(proxyAddress);
    } catch (error) {
        console.warn(`Warning: Could not get implementation address for ${proxyAddress}`);
        return null;
    }
}

module.exports = {
    loadDeploymentInfo,
    loadUpgradeHistory,
    saveUpgradeHistory,
    getStorageLayout,
    compareStorageLayouts,
    isValidVersionSequence,
    formatContractState,
    generateReport,
    estimateGasCosts,
    isUpgradeable,
    getImplementationAddress
};
