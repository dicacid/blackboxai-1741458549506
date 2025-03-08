const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Manage contract security and access control
 * @param {Object} options - Manager options
 * @returns {Object} Security manager instance
 */
function createSecurityManager(options = {}) {
    const manager = {
        roles: new Map(),
        permissions: new Map(),
        timelock: null,
        multisig: null,
        options: {
            requireTimelock: true,
            requireMultisig: true,
            validatePermissions: true,
            enforceAccessControl: true,
            ...options
        }
    };

    // Initialize manager functions
    manager.initialize = async (contracts) => await initializeSecurity(manager, contracts);
    manager.validateAccess = async (address, role) => await validateAccess(manager, address, role);
    manager.checkUpgradePermissions = async (caller) => await checkUpgradePermissions(manager, caller);
    manager.setupTimelock = async (params) => await setupTimelock(manager, params);
    manager.queueUpgrade = async (upgrade) => await queueUpgradeInTimelock(manager, upgrade);
    manager.validateMultisig = async (address) => await validateMultisigSetup(manager, address);

    return manager;
}

/**
 * Initialize security settings
 * @param {Object} manager - Security manager
 * @param {Object} contracts - Contract information
 */
async function initializeSecurity(manager, contracts) {
    try {
        // Initialize roles and permissions
        for (const [name, info] of Object.entries(contracts)) {
            // Get contract factory
            const Contract = await ethers.getContractFactory(name);
            
            // Extract roles
            const roles = await extractContractRoles(Contract);
            manager.roles.set(name, roles);

            // Extract permissions
            const permissions = await extractContractPermissions(Contract);
            manager.permissions.set(name, permissions);
        }

        // Setup timelock if required
        if (manager.options.requireTimelock) {
            await setupTimelock(manager);
        }

        // Setup multisig if required
        if (manager.options.requireMultisig) {
            await setupMultisig(manager);
        }

    } catch (error) {
        throw new Error(`Failed to initialize security: ${error.message}`);
    }
}

/**
 * Extract contract roles
 * @param {Object} Contract - Contract factory
 * @returns {Object} Contract roles
 */
async function extractContractRoles(Contract) {
    const roles = {
        admin: [],
        upgrader: [],
        pauser: [],
        custom: []
    };

    try {
        // Get contract artifact
        const artifact = await artifacts.readArtifact(Contract.name);

        // Analyze contract AST
        const buildInfo = await artifacts.getBuildInfo(Contract.name);
        const ast = buildInfo.output.sources[artifact.sourceName].ast;

        // Find role definitions
        roles.admin = findRoleDefinitions(ast, "admin");
        roles.upgrader = findRoleDefinitions(ast, "upgrade");
        roles.pauser = findRoleDefinitions(ast, "pause");
        roles.custom = findCustomRoles(ast);

    } catch (error) {
        console.warn(`Warning: Could not extract roles for ${Contract.name}`);
    }

    return roles;
}

/**
 * Extract contract permissions
 * @param {Object} Contract - Contract factory
 * @returns {Object} Contract permissions
 */
async function extractContractPermissions(Contract) {
    const permissions = {
        functions: new Map(),
        variables: new Map(),
        modifiers: []
    };

    try {
        // Get contract artifact
        const artifact = await artifacts.readArtifact(Contract.name);

        // Analyze contract AST
        const buildInfo = await artifacts.getBuildInfo(Contract.name);
        const ast = buildInfo.output.sources[artifact.sourceName].ast;

        // Find function permissions
        permissions.functions = findFunctionPermissions(ast);

        // Find variable permissions
        permissions.variables = findVariablePermissions(ast);

        // Find access modifiers
        permissions.modifiers = findAccessModifiers(ast);

    } catch (error) {
        console.warn(`Warning: Could not extract permissions for ${Contract.name}`);
    }

    return permissions;
}

/**
 * Setup timelock controller
 * @param {Object} manager - Security manager
 * @param {Object} params - Timelock parameters
 */
async function setupTimelock(manager, params = {}) {
    try {
        const TimelockController = await ethers.getContractFactory("TimelockController");
        
        const defaultParams = {
            minDelay: 86400, // 24 hours
            proposers: [],
            executors: [],
            admin: ethers.constants.AddressZero
        };

        const timelockParams = { ...defaultParams, ...params };

        manager.timelock = await TimelockController.deploy(
            timelockParams.minDelay,
            timelockParams.proposers,
            timelockParams.executors,
            timelockParams.admin
        );

        await manager.timelock.deployed();

    } catch (error) {
        throw new Error(`Failed to setup timelock: ${error.message}`);
    }
}

/**
 * Queue upgrade in timelock
 * @param {Object} manager - Security manager
 * @param {Object} upgrade - Upgrade information
 */
async function queueUpgradeInTimelock(manager, upgrade) {
    if (!manager.timelock) {
        throw new Error("Timelock not initialized");
    }

    try {
        const delay = await manager.timelock.getMinDelay();
        const eta = Math.floor(Date.now() / 1000) + delay.toNumber();

        // Encode upgrade call
        const data = upgrade.contract.interface.encodeFunctionData("upgradeTo", [
            upgrade.implementation
        ]);

        // Queue transaction
        await manager.timelock.schedule(
            upgrade.proxy,
            0,
            data,
            ethers.constants.HashZero,
            ethers.utils.id("UPGRADE_ROLE"),
            eta
        );

        return eta;

    } catch (error) {
        throw new Error(`Failed to queue upgrade: ${error.message}`);
    }
}

/**
 * Validate multisig setup
 * @param {Object} manager - Security manager
 * @param {string} address - Multisig address
 */
async function validateMultisigSetup(manager, address) {
    try {
        const code = await ethers.provider.getCode(address);
        if (code === "0x") {
            throw new Error("No code at multisig address");
        }

        // Check if it's a Gnosis Safe
        const isGnosisSafe = code.includes("0x6a761202"); // Gnosis Safe signature
        if (!isGnosisSafe) {
            throw new Error("Address is not a Gnosis Safe multisig");
        }

        // Get multisig details
        const multisig = await ethers.getContractAt("GnosisSafe", address);
        const threshold = await multisig.getThreshold();
        const owners = await multisig.getOwners();

        return {
            valid: true,
            threshold: threshold.toString(),
            owners,
            implementation: await multisig.masterCopy()
        };

    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

/**
 * Validate access permissions
 * @param {Object} manager - Security manager
 * @param {string} address - Caller address
 * @param {string} role - Required role
 */
async function validateAccess(manager, address, role) {
    try {
        // Check timelock
        if (manager.options.requireTimelock && address !== manager.timelock.address) {
            throw new Error("Caller must be timelock");
        }

        // Check multisig
        if (manager.options.requireMultisig) {
            const multisigValidation = await validateMultisigSetup(manager, address);
            if (!multisigValidation.valid) {
                throw new Error("Invalid multisig setup");
            }
        }

        // Check specific role
        if (role) {
            const hasRole = await checkRole(manager, address, role);
            if (!hasRole) {
                throw new Error(`Caller does not have required role: ${role}`);
            }
        }

        return true;

    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

/**
 * Check if address has role
 * @param {Object} manager - Security manager
 * @param {string} address - Address to check
 * @param {string} role - Role to check
 */
async function checkRole(manager, address, role) {
    try {
        // Check if role exists
        let hasRole = false;
        for (const [contract, roles] of manager.roles) {
            if (roles[role]) {
                const instance = await ethers.getContractAt(contract, address);
                hasRole = await instance.hasRole(
                    ethers.utils.id(role),
                    address
                );
                if (hasRole) break;
            }
        }
        return hasRole;

    } catch (error) {
        return false;
    }
}

/**
 * Find role definitions in AST
 * @param {Object} ast - Contract AST
 * @param {string} type - Role type
 * @returns {Array} Role definitions
 */
function findRoleDefinitions(ast, type) {
    const roles = [];
    
    function visit(node) {
        if (node.nodeType === "VariableDeclaration" &&
            node.typeDescriptions?.typeString?.includes("bytes32") &&
            node.name.toLowerCase().includes(type)) {
            roles.push(node.name);
        }
        
        if (node.nodes) {
            node.nodes.forEach(visit);
        }
    }

    visit(ast);
    return roles;
}

/**
 * Find custom roles in AST
 * @param {Object} ast - Contract AST
 * @returns {Array} Custom roles
 */
function findCustomRoles(ast) {
    const roles = [];
    
    function visit(node) {
        if (node.nodeType === "VariableDeclaration" &&
            node.typeDescriptions?.typeString?.includes("bytes32") &&
            node.name.includes("ROLE") &&
            !node.name.includes("ADMIN") &&
            !node.name.includes("UPGRADE") &&
            !node.name.includes("PAUSE")) {
            roles.push(node.name);
        }
        
        if (node.nodes) {
            node.nodes.forEach(visit);
        }
    }

    visit(ast);
    return roles;
}

/**
 * Find function permissions in AST
 * @param {Object} ast - Contract AST
 * @returns {Map} Function permissions
 */
function findFunctionPermissions(ast) {
    const permissions = new Map();
    
    function visit(node) {
        if (node.nodeType === "FunctionDefinition") {
            const modifiers = node.modifiers || [];
            const accessModifiers = modifiers.filter(m => 
                m.modifierName.name.includes("only") ||
                m.modifierName.name.includes("auth") ||
                m.modifierName.name.includes("role")
            );
            
            if (accessModifiers.length > 0) {
                permissions.set(node.name, accessModifiers.map(m => m.modifierName.name));
            }
        }
        
        if (node.nodes) {
            node.nodes.forEach(visit);
        }
    }

    visit(ast);
    return permissions;
}

/**
 * Find variable permissions in AST
 * @param {Object} ast - Contract AST
 * @returns {Map} Variable permissions
 */
function findVariablePermissions(ast) {
    const permissions = new Map();
    
    function visit(node) {
        if (node.nodeType === "VariableDeclaration") {
            const modifiers = node.modifiers || [];
            const accessModifiers = modifiers.filter(m => 
                m.modifierName.name.includes("only") ||
                m.modifierName.name.includes("auth") ||
                m.modifierName.name.includes("role")
            );
            
            if (accessModifiers.length > 0) {
                permissions.set(node.name, accessModifiers.map(m => m.modifierName.name));
            }
        }
        
        if (node.nodes) {
            node.nodes.forEach(visit);
        }
    }

    visit(ast);
    return permissions;
}

/**
 * Find access modifiers in AST
 * @param {Object} ast - Contract AST
 * @returns {Array} Access modifiers
 */
function findAccessModifiers(ast) {
    const modifiers = [];
    
    function visit(node) {
        if (node.nodeType === "ModifierDefinition" &&
            (node.name.includes("only") ||
             node.name.includes("auth") ||
             node.name.includes("role"))) {
            modifiers.push(node.name);
        }
        
        if (node.nodes) {
            node.nodes.forEach(visit);
        }
    }

    visit(ast);
    return modifiers;
}

module.exports = {
    createSecurityManager,
    validateAccess,
    validateMultisigSetup,
    extractContractRoles,
    extractContractPermissions
};
