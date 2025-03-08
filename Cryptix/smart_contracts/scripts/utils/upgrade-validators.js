const { ethers, upgrades } = require("hardhat");
const { getImplementationAddress } = require("./upgrade-helpers");

/**
 * Validate contract upgrade safety
 * @param {string} proxyAddress - Proxy contract address
 * @param {Object} CurrentContract - Current contract factory
 * @param {Object} NewContract - New contract factory
 * @returns {Object} Validation results
 */
async function validateUpgradeSafety(proxyAddress, CurrentContract, NewContract) {
    const results = {
        safe: false,
        storage: {
            compatible: false,
            errors: [],
            warnings: []
        },
        functions: {
            compatible: false,
            errors: [],
            warnings: []
        },
        security: {
            passed: false,
            checks: []
        }
    };

    try {
        // Validate storage layout
        const storageValidation = await validateStorageLayout(proxyAddress, CurrentContract, NewContract);
        results.storage = storageValidation;

        // Validate function compatibility
        const functionValidation = await validateFunctionCompatibility(CurrentContract, NewContract);
        results.functions = functionValidation;

        // Validate security aspects
        const securityValidation = await validateSecurityAspects(NewContract);
        results.security = securityValidation;

        // Overall safety check
        results.safe = results.storage.compatible && 
                      results.functions.compatible && 
                      results.security.passed;

    } catch (error) {
        results.error = error.message;
    }

    return results;
}

/**
 * Validate storage layout compatibility
 * @param {string} proxyAddress - Proxy contract address
 * @param {Object} CurrentContract - Current contract factory
 * @param {Object} NewContract - New contract factory
 * @returns {Object} Storage validation results
 */
async function validateStorageLayout(proxyAddress, CurrentContract, NewContract) {
    const results = {
        compatible: false,
        errors: [],
        warnings: [],
        changes: {
            added: [],
            modified: [],
            removed: []
        }
    };

    try {
        // Get storage layouts
        const currentLayout = await getStorageLayout(CurrentContract);
        const newLayout = await getStorageLayout(NewContract);

        // Check storage compatibility using OpenZeppelin's validator
        const validationResult = await upgrades.validateUpgrade(
            proxyAddress,
            NewContract,
            { kind: "uups" }
        );

        results.compatible = validationResult.ok;
        if (!validationResult.ok) {
            results.errors.push(...validationResult.errors);
            results.warnings.push(...validationResult.warnings);
        }

        // Analyze storage changes
        for (const [slot, currentVar] of Object.entries(currentLayout.storage)) {
            const newVar = newLayout.storage[slot];
            
            if (!newVar) {
                results.changes.removed.push({
                    name: currentVar.label,
                    type: currentVar.type,
                    slot
                });
                results.errors.push(`Storage variable removed: ${currentVar.label}`);
            } else if (currentVar.type !== newVar.type) {
                results.changes.modified.push({
                    name: currentVar.label,
                    oldType: currentVar.type,
                    newType: newVar.type,
                    slot
                });
                results.errors.push(`Storage type changed: ${currentVar.label}`);
            }
        }

        // Check for new variables
        for (const [slot, newVar] of Object.entries(newLayout.storage)) {
            if (!currentLayout.storage[slot]) {
                results.changes.added.push({
                    name: newVar.label,
                    type: newVar.type,
                    slot
                });
            }
        }

        // Check for storage gaps
        if (!hasStorageGaps(newLayout)) {
            results.warnings.push("No storage gaps found. Consider adding storage gaps for future upgrades.");
        }

    } catch (error) {
        results.errors.push(`Storage validation error: ${error.message}`);
    }

    return results;
}

/**
 * Validate function compatibility
 * @param {Object} CurrentContract - Current contract factory
 * @param {Object} NewContract - New contract factory
 * @returns {Object} Function validation results
 */
async function validateFunctionCompatibility(CurrentContract, NewContract) {
    const results = {
        compatible: true,
        errors: [],
        warnings: [],
        changes: {
            added: [],
            modified: [],
            removed: []
        }
    };

    try {
        const currentFunctions = Object.values(CurrentContract.interface.functions);
        const newFunctions = Object.values(NewContract.interface.functions);

        // Check for removed functions
        for (const func of currentFunctions) {
            const newFunc = newFunctions.find(f => f.name === func.name);
            
            if (!newFunc) {
                results.changes.removed.push(func.name);
                results.errors.push(`Function removed: ${func.name}`);
                results.compatible = false;
            } else {
                // Check for signature changes
                if (!areFunctionSignaturesCompatible(func, newFunc)) {
                    results.changes.modified.push({
                        name: func.name,
                        oldSignature: func.format(),
                        newSignature: newFunc.format()
                    });
                    results.errors.push(`Function signature changed: ${func.name}`);
                    results.compatible = false;
                }
            }
        }

        // Check for added functions
        for (const func of newFunctions) {
            if (!currentFunctions.find(f => f.name === func.name)) {
                results.changes.added.push(func.name);
            }
        }

        // Check for potential selector clashes
        const selectorClashes = findSelectorClashes(newFunctions);
        if (selectorClashes.length > 0) {
            results.warnings.push("Function selector clashes detected");
            results.warnings.push(...selectorClashes);
        }

    } catch (error) {
        results.errors.push(`Function validation error: ${error.message}`);
        results.compatible = false;
    }

    return results;
}

/**
 * Validate security aspects
 * @param {Object} Contract - Contract factory
 * @returns {Object} Security validation results
 */
async function validateSecurityAspects(Contract) {
    const results = {
        passed: true,
        checks: [],
        warnings: []
    };

    try {
        // Check for UUPS upgradeability
        const hasUpgradeTo = Contract.interface.fragments.some(f => 
            f.name === "upgradeTo" && f.type === "function"
        );
        results.checks.push({
            name: "UUPS Upgradeability",
            passed: hasUpgradeTo,
            description: hasUpgradeTo ? "Contract has upgradeTo function" : "Missing upgradeTo function"
        });

        // Check for initializer
        const hasInitializer = Contract.interface.fragments.some(f => 
            f.name === "initialize" && f.type === "function"
        );
        results.checks.push({
            name: "Initializer",
            passed: hasInitializer,
            description: hasInitializer ? "Contract has initializer" : "Missing initializer function"
        });

        // Check for access control
        const hasAccessControl = Contract.interface.fragments.some(f => 
            f.name === "owner" || f.name === "hasRole"
        );
        results.checks.push({
            name: "Access Control",
            passed: hasAccessControl,
            description: hasAccessControl ? "Contract has access control" : "Missing access control"
        });

        // Check for reentrancy protection
        const code = Contract.bytecode;
        const hasReentrancyGuard = code.includes("nonReentrant");
        results.checks.push({
            name: "Reentrancy Protection",
            passed: hasReentrancyGuard,
            description: hasReentrancyGuard ? "Contract has reentrancy protection" : "Consider adding reentrancy guards"
        });

        // Update overall status
        results.passed = results.checks.every(check => check.passed);

    } catch (error) {
        results.checks.push({
            name: "Security Validation",
            passed: false,
            description: `Error: ${error.message}`
        });
        results.passed = false;
    }

    return results;
}

/**
 * Check if storage layout has gaps
 * @param {Object} layout - Storage layout
 * @returns {boolean} Whether layout has gaps
 */
function hasStorageGaps(layout) {
    return layout.storage.some(item => 
        item.label.includes("__gap") || 
        item.label.includes("_reserved")
    );
}

/**
 * Compare function signatures for compatibility
 * @param {Object} func1 - First function
 * @param {Object} func2 - Second function
 * @returns {boolean} Whether signatures are compatible
 */
function areFunctionSignaturesCompatible(func1, func2) {
    // Check inputs
    if (func1.inputs.length !== func2.inputs.length) return false;
    for (let i = 0; i < func1.inputs.length; i++) {
        if (func1.inputs[i].type !== func2.inputs[i].type) return false;
    }

    // Check outputs
    if (func1.outputs.length !== func2.outputs.length) return false;
    for (let i = 0; i < func1.outputs.length; i++) {
        if (func1.outputs[i].type !== func2.outputs[i].type) return false;
    }

    // Check state mutability
    if (func1.stateMutability !== func2.stateMutability) {
        // Allow changing from nonpayable to payable
        if (!(func1.stateMutability === "nonpayable" && func2.stateMutability === "payable")) {
            return false;
        }
    }

    return true;
}

/**
 * Find function selector clashes
 * @param {Array} functions - Array of functions
 * @returns {Array} Array of clash descriptions
 */
function findSelectorClashes(functions) {
    const selectors = new Map();
    const clashes = [];

    for (const func of functions) {
        const selector = ethers.utils.id(func.format()).slice(0, 10);
        if (selectors.has(selector)) {
            clashes.push(`Selector clash: ${func.format()} with ${selectors.get(selector)}`);
        } else {
            selectors.set(selector, func.format());
        }
    }

    return clashes;
}

module.exports = {
    validateUpgradeSafety,
    validateStorageLayout,
    validateFunctionCompatibility,
    validateSecurityAspects
};
