const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Manage contract storage and state
 * @param {string} proxyAddress - Proxy contract address
 * @param {Object} Contract - Contract factory
 * @returns {Object} Storage manager instance
 */
function createStorageManager(proxyAddress, Contract) {
    const manager = {
        proxyAddress,
        contract: null,
        storageLayout: null,
        storageSlots: new Map(),
        stateVariables: new Map(),
        history: [],
        options: {
            trackHistory: true,
            validateAccess: true,
            backupBeforeWrite: true
        }
    };

    // Initialize manager functions
    manager.initialize = async () => await initializeStorage(manager, Contract);
    manager.readStorage = async (slot) => await readStorageSlot(manager, slot);
    manager.writeStorage = async (slot, value) => await writeStorageSlot(manager, slot, value);
    manager.getState = async () => await getContractState(manager);
    manager.setState = async (state) => await setContractState(manager, state);
    manager.compareState = async (oldState, newState) => compareStates(oldState, newState);
    manager.backup = async () => await backupStorage(manager);
    manager.restore = async (backup) => await restoreStorage(manager, backup);
    manager.getHistory = () => manager.history;

    return manager;
}

/**
 * Initialize storage manager
 * @param {Object} manager - Storage manager instance
 * @param {Object} Contract - Contract factory
 */
async function initializeStorage(manager, Contract) {
    try {
        // Initialize contract instance
        manager.contract = new ethers.Contract(
            manager.proxyAddress,
            Contract.interface,
            ethers.provider
        );

        // Get storage layout
        manager.storageLayout = await getStorageLayout(Contract);

        // Initialize storage slots map
        if (manager.storageLayout) {
            for (const item of manager.storageLayout.storage) {
                manager.storageSlots.set(item.label, item);
            }
        }

        // Initialize state variables map
        const stateVars = Object.values(manager.contract.interface.functions)
            .filter(f => f.stateMutability === "view" && f.inputs.length === 0);
        
        for (const func of stateVars) {
            manager.stateVariables.set(func.name, {
                name: func.name,
                outputs: func.outputs,
                value: null
            });
        }

    } catch (error) {
        throw new Error(`Failed to initialize storage manager: ${error.message}`);
    }
}

/**
 * Read storage slot value
 * @param {Object} manager - Storage manager instance
 * @param {string} slot - Storage slot identifier
 * @returns {string} Storage value
 */
async function readStorageSlot(manager, slot) {
    try {
        let slotNumber;

        if (typeof slot === "string") {
            // Get slot number from variable name
            const slotInfo = manager.storageSlots.get(slot);
            if (!slotInfo) {
                throw new Error(`Unknown storage variable: ${slot}`);
            }
            slotNumber = slotInfo.slot;
        } else {
            slotNumber = slot;
        }

        const value = await ethers.provider.getStorageAt(
            manager.proxyAddress,
            slotNumber
        );

        if (manager.options.trackHistory) {
            manager.history.push({
                timestamp: Date.now(),
                action: "read",
                slot: slotNumber,
                value
            });
        }

        return value;

    } catch (error) {
        throw new Error(`Failed to read storage slot: ${error.message}`);
    }
}

/**
 * Write storage slot value
 * @param {Object} manager - Storage manager instance
 * @param {string} slot - Storage slot identifier
 * @param {string} value - Value to write
 */
async function writeStorageSlot(manager, slot, value) {
    if (manager.options.validateAccess) {
        // Validate access before writing
        const canWrite = await validateStorageAccess(manager, slot);
        if (!canWrite) {
            throw new Error(`Storage access validation failed for slot: ${slot}`);
        }
    }

    if (manager.options.backupBeforeWrite) {
        // Backup current value
        const currentValue = await readStorageSlot(manager, slot);
        manager.history.push({
            timestamp: Date.now(),
            action: "backup",
            slot,
            value: currentValue
        });
    }

    try {
        let slotNumber;
        if (typeof slot === "string") {
            const slotInfo = manager.storageSlots.get(slot);
            if (!slotInfo) {
                throw new Error(`Unknown storage variable: ${slot}`);
            }
            slotNumber = slotInfo.slot;
        } else {
            slotNumber = slot;
        }

        // Note: This is a low-level operation that requires special permissions
        // It's typically used in a forked network for testing
        await network.provider.send("hardhat_setStorageAt", [
            manager.proxyAddress,
            slotNumber,
            value
        ]);

        if (manager.options.trackHistory) {
            manager.history.push({
                timestamp: Date.now(),
                action: "write",
                slot: slotNumber,
                value
            });
        }

    } catch (error) {
        throw new Error(`Failed to write storage slot: ${error.message}`);
    }
}

/**
 * Get complete contract state
 * @param {Object} manager - Storage manager instance
 * @returns {Object} Contract state
 */
async function getContractState(manager) {
    const state = {
        timestamp: Date.now(),
        variables: {},
        storage: {}
    };

    try {
        // Get state variables
        for (const [name, info] of manager.stateVariables) {
            try {
                const value = await manager.contract[name]();
                state.variables[name] = formatValue(value);
            } catch (error) {
                console.warn(`Failed to read state variable ${name}: ${error.message}`);
            }
        }

        // Get storage slots
        for (const [name, info] of manager.storageSlots) {
            try {
                const value = await readStorageSlot(manager, info.slot);
                state.storage[name] = value;
            } catch (error) {
                console.warn(`Failed to read storage slot ${name}: ${error.message}`);
            }
        }

    } catch (error) {
        throw new Error(`Failed to get contract state: ${error.message}`);
    }

    return state;
}

/**
 * Set contract state
 * @param {Object} manager - Storage manager instance
 * @param {Object} state - State to set
 */
async function setContractState(manager, state) {
    try {
        // Backup current state if enabled
        if (manager.options.backupBeforeWrite) {
            await backupStorage(manager);
        }

        // Set storage slots
        for (const [name, value] of Object.entries(state.storage || {})) {
            await writeStorageSlot(manager, name, value);
        }

        // Set state variables through setters
        for (const [name, value] of Object.entries(state.variables || {})) {
            const setterName = `set${name.charAt(0).toUpperCase()}${name.slice(1)}`;
            if (manager.contract[setterName]) {
                await manager.contract[setterName](value);
            }
        }

    } catch (error) {
        throw new Error(`Failed to set contract state: ${error.message}`);
    }
}

/**
 * Compare two contract states
 * @param {Object} oldState - Old state
 * @param {Object} newState - New state
 * @returns {Object} Comparison results
 */
function compareStates(oldState, newState) {
    const comparison = {
        timestamp: Date.now(),
        changes: {
            variables: [],
            storage: []
        }
    };

    // Compare variables
    for (const [name, newValue] of Object.entries(newState.variables || {})) {
        const oldValue = oldState.variables?.[name];
        if (!isEqual(oldValue, newValue)) {
            comparison.changes.variables.push({
                name,
                from: oldValue,
                to: newValue
            });
        }
    }

    // Compare storage
    for (const [name, newValue] of Object.entries(newState.storage || {})) {
        const oldValue = oldState.storage?.[name];
        if (oldValue !== newValue) {
            comparison.changes.storage.push({
                name,
                from: oldValue,
                to: newValue
            });
        }
    }

    return comparison;
}

/**
 * Backup contract storage
 * @param {Object} manager - Storage manager instance
 * @returns {Object} Storage backup
 */
async function backupStorage(manager) {
    const backup = {
        timestamp: Date.now(),
        address: manager.proxyAddress,
        state: await getContractState(manager)
    };

    manager.history.push({
        timestamp: backup.timestamp,
        action: "backup",
        state: backup.state
    });

    return backup;
}

/**
 * Restore contract storage from backup
 * @param {Object} manager - Storage manager instance
 * @param {Object} backup - Storage backup
 */
async function restoreStorage(manager, backup) {
    try {
        await setContractState(manager, backup.state);

        manager.history.push({
            timestamp: Date.now(),
            action: "restore",
            backup
        });

    } catch (error) {
        throw new Error(`Failed to restore storage: ${error.message}`);
    }
}

/**
 * Get contract storage layout
 * @param {Object} Contract - Contract factory
 * @returns {Object} Storage layout
 */
async function getStorageLayout(Contract) {
    try {
        const buildInfo = await artifacts.getBuildInfo(Contract.name);
        return buildInfo.output.contracts[Contract.name].storageLayout;
    } catch (error) {
        console.warn(`Could not get storage layout: ${error.message}`);
        return null;
    }
}

/**
 * Validate storage access
 * @param {Object} manager - Storage manager instance
 * @param {string} slot - Storage slot
 * @returns {boolean} Whether access is allowed
 */
async function validateStorageAccess(manager, slot) {
    // Add custom validation logic here
    // For example, check if slot is reserved for proxy implementation
    const slotNumber = typeof slot === "string" 
        ? manager.storageSlots.get(slot)?.slot 
        : slot;

    // Check if slot is implementation slot
    if (slotNumber === "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc") {
        return false;
    }

    return true;
}

/**
 * Format contract value for storage
 * @param {any} value - Value to format
 * @returns {any} Formatted value
 */
function formatValue(value) {
    if (value && value._isBigNumber) {
        return value.toString();
    }
    if (Array.isArray(value)) {
        return value.map(formatValue);
    }
    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, formatValue(v)])
        );
    }
    return value;
}

/**
 * Deep equality comparison
 * @param {any} a - First value
 * @param {any} b - Second value
 * @returns {boolean} Whether values are equal
 */
function isEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return false;
    if (!a || !b) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => isEqual(a[key], b[key]));
}

module.exports = {
    createStorageManager,
    getStorageLayout,
    compareStates
};
