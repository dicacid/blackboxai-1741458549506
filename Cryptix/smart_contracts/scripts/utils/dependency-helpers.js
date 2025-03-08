const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Manage contract dependencies and interfaces
 * @param {Object} options - Manager options
 * @returns {Object} Dependency manager instance
 */
function createDependencyManager(options = {}) {
    const manager = {
        dependencies: new Map(),
        interfaces: new Map(),
        implementations: new Map(),
        graph: new Map(),
        options: {
            validateDependencies: true,
            trackImplementations: true,
            validateInterfaces: true,
            ...options
        }
    };

    // Initialize manager functions
    manager.analyze = async (contracts) => await analyzeDependencies(manager, contracts);
    manager.validate = async () => await validateDependencies(manager);
    manager.getOrder = () => calculateUpgradeOrder(manager);
    manager.checkCompatibility = async (oldVersion, newVersion) => 
        await checkInterfaceCompatibility(manager, oldVersion, newVersion);
    manager.getDependents = (contract) => findDependentContracts(manager, contract);
    manager.getImplementation = (contract) => getLatestImplementation(manager, contract);

    return manager;
}

/**
 * Analyze contract dependencies
 * @param {Object} manager - Dependency manager
 * @param {Object} contracts - Contract information
 */
async function analyzeDependencies(manager, contracts) {
    try {
        for (const [name, info] of Object.entries(contracts)) {
            // Get contract factory
            const Contract = await ethers.getContractFactory(name);
            
            // Analyze bytecode for dependencies
            const dependencies = await findContractDependencies(Contract);
            manager.dependencies.set(name, dependencies);

            // Extract interfaces
            const interfaces = await extractContractInterfaces(Contract);
            manager.interfaces.set(name, interfaces);

            // Track implementation
            if (manager.options.trackImplementations) {
                await trackImplementation(manager, name, info);
            }

            // Build dependency graph
            updateDependencyGraph(manager, name, dependencies);
        }

    } catch (error) {
        throw new Error(`Failed to analyze dependencies: ${error.message}`);
    }
}

/**
 * Find contract dependencies
 * @param {Object} Contract - Contract factory
 * @returns {Array} Contract dependencies
 */
async function findContractDependencies(Contract) {
    const dependencies = new Set();

    try {
        // Get contract artifact
        const artifact = await artifacts.readArtifact(Contract.name);

        // Analyze contract sources
        const buildInfo = await artifacts.getBuildInfo(Contract.name);
        const sources = buildInfo.output.sources;

        // Find import statements and contract references
        for (const [sourcePath, sourceInfo] of Object.entries(sources)) {
            const imports = findImports(sourceInfo.content);
            const references = findContractReferences(sourceInfo.content);

            imports.forEach(imp => dependencies.add(imp));
            references.forEach(ref => dependencies.add(ref));
        }

        // Remove self-reference
        dependencies.delete(Contract.name);

    } catch (error) {
        console.warn(`Warning: Could not analyze dependencies for ${Contract.name}`);
    }

    return Array.from(dependencies);
}

/**
 * Extract contract interfaces
 * @param {Object} Contract - Contract factory
 * @returns {Object} Contract interfaces
 */
async function extractContractInterfaces(Contract) {
    const interfaces = {
        implements: [],
        provides: []
    };

    try {
        // Get contract artifact
        const artifact = await artifacts.readArtifact(Contract.name);

        // Analyze contract AST
        const buildInfo = await artifacts.getBuildInfo(Contract.name);
        const ast = buildInfo.output.sources[artifact.sourceName].ast;

        // Find implemented interfaces
        interfaces.implements = findImplementedInterfaces(ast);

        // Find provided interfaces
        interfaces.provides = findProvidedInterfaces(ast);

    } catch (error) {
        console.warn(`Warning: Could not extract interfaces for ${Contract.name}`);
    }

    return interfaces;
}

/**
 * Track contract implementation
 * @param {Object} manager - Dependency manager
 * @param {string} name - Contract name
 * @param {Object} info - Contract information
 */
async function trackImplementation(manager, name, info) {
    try {
        const implementation = {
            address: info.address,
            version: info.version,
            timestamp: Date.now()
        };

        if (!manager.implementations.has(name)) {
            manager.implementations.set(name, []);
        }

        manager.implementations.get(name).push(implementation);

    } catch (error) {
        console.warn(`Warning: Could not track implementation for ${name}`);
    }
}

/**
 * Update dependency graph
 * @param {Object} manager - Dependency manager
 * @param {string} name - Contract name
 * @param {Array} dependencies - Contract dependencies
 */
function updateDependencyGraph(manager, name, dependencies) {
    if (!manager.graph.has(name)) {
        manager.graph.set(name, { dependsOn: new Set(), dependedBy: new Set() });
    }

    // Add dependencies
    dependencies.forEach(dep => {
        manager.graph.get(name).dependsOn.add(dep);

        if (!manager.graph.has(dep)) {
            manager.graph.set(dep, { dependsOn: new Set(), dependedBy: new Set() });
        }
        manager.graph.get(dep).dependedBy.add(name);
    });
}

/**
 * Validate dependencies
 * @param {Object} manager - Dependency manager
 * @returns {Object} Validation results
 */
async function validateDependencies(manager) {
    const results = {
        valid: true,
        errors: [],
        warnings: []
    };

    try {
        // Check for circular dependencies
        const circular = findCircularDependencies(manager.graph);
        if (circular.length > 0) {
            results.valid = false;
            results.errors.push({
                type: "circular_dependency",
                message: "Circular dependencies detected",
                details: circular
            });
        }

        // Validate interface implementations
        if (manager.options.validateInterfaces) {
            const interfaceErrors = await validateInterfaceImplementations(manager);
            if (interfaceErrors.length > 0) {
                results.valid = false;
                results.errors.push(...interfaceErrors);
            }
        }

        // Check dependency versions
        const versionIssues = checkDependencyVersions(manager);
        results.warnings.push(...versionIssues);

    } catch (error) {
        results.valid = false;
        results.errors.push({
            type: "validation_error",
            message: error.message
        });
    }

    return results;
}

/**
 * Calculate upgrade order
 * @param {Object} manager - Dependency manager
 * @returns {Array} Ordered list of contracts
 */
function calculateUpgradeOrder(manager) {
    const visited = new Set();
    const order = [];

    function visit(node) {
        if (visited.has(node)) return;
        visited.add(node);

        const deps = manager.graph.get(node)?.dependsOn || new Set();
        for (const dep of deps) {
            visit(dep);
        }

        order.push(node);
    }

    // Visit all nodes
    for (const node of manager.graph.keys()) {
        visit(node);
    }

    return order;
}

/**
 * Check interface compatibility
 * @param {Object} manager - Dependency manager
 * @param {Object} oldVersion - Old contract version
 * @param {Object} newVersion - New contract version
 * @returns {Object} Compatibility check results
 */
async function checkInterfaceCompatibility(manager, oldVersion, newVersion) {
    const results = {
        compatible: true,
        changes: {
            added: [],
            removed: [],
            modified: []
        }
    };

    try {
        const oldInterfaces = await extractContractInterfaces(oldVersion);
        const newInterfaces = await extractContractInterfaces(newVersion);

        // Check implemented interfaces
        compareInterfaces(
            oldInterfaces.implements,
            newInterfaces.implements,
            results.changes,
            "implemented interface"
        );

        // Check provided interfaces
        compareInterfaces(
            oldInterfaces.provides,
            newInterfaces.provides,
            results.changes,
            "provided interface"
        );

        // Update compatibility flag
        results.compatible = results.changes.removed.length === 0 &&
                           results.changes.modified.length === 0;

    } catch (error) {
        results.compatible = false;
        results.error = error.message;
    }

    return results;
}

/**
 * Find dependent contracts
 * @param {Object} manager - Dependency manager
 * @param {string} contract - Contract name
 * @returns {Array} Dependent contracts
 */
function findDependentContracts(manager, contract) {
    const dependents = new Set();
    const queue = [contract];

    while (queue.length > 0) {
        const current = queue.pop();
        const node = manager.graph.get(current);

        if (node?.dependedBy) {
            for (const dep of node.dependedBy) {
                if (!dependents.has(dep)) {
                    dependents.add(dep);
                    queue.push(dep);
                }
            }
        }
    }

    return Array.from(dependents);
}

/**
 * Get latest implementation
 * @param {Object} manager - Dependency manager
 * @param {string} contract - Contract name
 * @returns {Object} Latest implementation
 */
function getLatestImplementation(manager, contract) {
    const implementations = manager.implementations.get(contract) || [];
    return implementations.sort((a, b) => b.timestamp - a.timestamp)[0];
}

/**
 * Find circular dependencies
 * @param {Map} graph - Dependency graph
 * @returns {Array} Circular dependencies
 */
function findCircularDependencies(graph) {
    const circular = [];
    const visited = new Set();
    const stack = new Set();

    function visit(node, path = []) {
        if (stack.has(node)) {
            const cycle = path.slice(path.indexOf(node));
            circular.push(cycle);
            return;
        }
        if (visited.has(node)) return;

        visited.add(node);
        stack.add(node);
        path.push(node);

        const deps = graph.get(node)?.dependsOn || new Set();
        for (const dep of deps) {
            visit(dep, [...path]);
        }

        stack.delete(node);
    }

    for (const node of graph.keys()) {
        visit(node);
    }

    return circular;
}

/**
 * Find imports in source code
 * @param {string} source - Source code
 * @returns {Set} Import statements
 */
function findImports(source) {
    const imports = new Set();
    const importRegex = /import\s+{([^}]+)}\s+from\s+["']([^"']+)["']/g;
    let match;

    while ((match = importRegex.exec(source)) !== null) {
        const symbols = match[1].split(",").map(s => s.trim());
        symbols.forEach(symbol => imports.add(symbol));
    }

    return imports;
}

/**
 * Find contract references in source code
 * @param {string} source - Source code
 * @returns {Set} Contract references
 */
function findContractReferences(source) {
    const references = new Set();
    const contractRegex = /contract\s+\w+\s+is\s+([^{]+)/g;
    let match;

    while ((match = contractRegex.exec(source)) !== null) {
        const refs = match[1].split(",").map(s => s.trim());
        refs.forEach(ref => references.add(ref));
    }

    return references;
}

/**
 * Compare interfaces
 * @param {Array} oldInterfaces - Old interfaces
 * @param {Array} newInterfaces - New interfaces
 * @param {Object} changes - Change tracking object
 * @param {string} type - Change type description
 */
function compareInterfaces(oldInterfaces, newInterfaces, changes, type) {
    // Find removed interfaces
    oldInterfaces.forEach(iface => {
        if (!newInterfaces.includes(iface)) {
            changes.removed.push(`Removed ${type}: ${iface}`);
        }
    });

    // Find added interfaces
    newInterfaces.forEach(iface => {
        if (!oldInterfaces.includes(iface)) {
            changes.added.push(`Added ${type}: ${iface}`);
        }
    });
}

/**
 * Check dependency versions
 * @param {Object} manager - Dependency manager
 * @returns {Array} Version issues
 */
function checkDependencyVersions(manager) {
    const issues = [];

    for (const [name, implementations] of manager.implementations) {
        if (implementations.length > 1) {
            const versions = implementations.map(i => i.version);
            if (new Set(versions).size > 1) {
                issues.push({
                    type: "multiple_versions",
                    message: `Multiple versions of ${name} in use`,
                    versions
                });
            }
        }
    }

    return issues;
}

module.exports = {
    createDependencyManager,
    findContractDependencies,
    extractContractInterfaces,
    calculateUpgradeOrder,
    checkInterfaceCompatibility
};
