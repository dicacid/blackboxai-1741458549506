const upgradeHelpers = require('./upgrade-helpers');
const reportGenerators = require('./report-generators');
const upgradeValidators = require('./upgrade-validators');
const eventMonitors = require('./event-monitors');
const networkHelpers = require('./network-helpers');
const storageHelpers = require('./storage-helpers');
const dependencyHelpers = require('./dependency-helpers');
const securityHelpers = require('./security-helpers');
const config = require('./upgrade-config');

/**
 * Create an upgrade manager instance
 * @param {Object} options - Manager options
 * @returns {Object} Upgrade manager instance
 */
function createUpgradeManager(options = {}) {
    const manager = {
        options: {
            ...config.upgrade,
            ...options
        },
        validators: {},
        monitors: {},
        storage: {},
        dependencies: null,
        security: null,
        reports: [],
        status: 'initialized',
        config: {
            ...config,
            ...options.config
        }
    };

    // Initialize core functions
    manager.prepare = async (contracts) => await prepareUpgrade(manager, contracts);
    manager.validate = async (contracts) => await validateUpgrade(manager, contracts);
    manager.execute = async (contracts) => await executeUpgrade(manager, contracts);
    manager.verify = async (contracts) => await verifyUpgrade(manager, contracts);
    manager.rollback = async () => await rollbackUpgrade(manager);
    manager.getStatus = () => getUpgradeStatus(manager);
    manager.generateReport = () => generateUpgradeReport(manager);

    // Initialize dependency manager
    manager.dependencies = dependencyHelpers.createDependencyManager({
        validateDependencies: manager.options.validateDependencies,
        trackImplementations: manager.options.trackImplementations
    });

    // Initialize security manager
    manager.security = securityHelpers.createSecurityManager({
        requireTimelock: manager.options.requireTimelock,
        requireMultisig: manager.options.requireMultisig,
        validatePermissions: manager.options.validatePermissions,
        enforceAccessControl: manager.options.enforceAccessControl
    });

    return manager;
}

/**
 * Prepare contracts for upgrade
 * @param {Object} manager - Upgrade manager
 * @param {Object} contracts - Contract information
 */
async function prepareUpgrade(manager, contracts) {
    try {
        manager.status = 'preparing';

        // Initialize security
        await manager.security.initialize(contracts);

        // Analyze dependencies
        await manager.dependencies.analyze(contracts);
        const dependencyValidation = await manager.dependencies.validate();
        if (!dependencyValidation.valid) {
            throw new Error(`Dependency validation failed: ${dependencyValidation.errors[0].message}`);
        }

        // Get upgrade order
        const upgradeOrder = manager.dependencies.getOrder();
        const orderedContracts = {};
        upgradeOrder.forEach(name => {
            if (contracts[name]) {
                orderedContracts[name] = contracts[name];
            }
        });

        // Initialize validators
        if (manager.options.autoValidate) {
            for (const [name, info] of Object.entries(orderedContracts)) {
                manager.validators[name] = upgradeValidators.validateUpgradeSafety(
                    info.proxy,
                    info.current,
                    info.new
                );
            }
        }

        // Initialize monitors
        if (manager.options.autoMonitor) {
            // Network monitor
            manager.monitors.network = networkHelpers.createNetworkMonitor(
                manager.config.monitoring.network
            );
            await manager.monitors.network.start();

            // Event monitors
            manager.monitors.events = {};
            for (const [name, info] of Object.entries(orderedContracts)) {
                manager.monitors.events[name] = eventMonitors.createEventMonitor(
                    info.proxy,
                    info.current,
                    manager.config.monitoring.events
                );
                await manager.monitors.events[name].start();
            }
        }

        // Initialize storage managers
        if (manager.options.autoBackup) {
            for (const [name, info] of Object.entries(orderedContracts)) {
                manager.storage[name] = storageHelpers.createStorageManager(
                    info.proxy,
                    info.current,
                    manager.config.monitoring.storage
                );
                await manager.storage[name].initialize();
            }
        }

        manager.status = 'prepared';
        return orderedContracts;

    } catch (error) {
        manager.status = 'error';
        throw new Error(`Failed to prepare upgrade: ${error.message}`);
    }
}

/**
 * Validate upgrade safety
 * @param {Object} manager - Upgrade manager
 * @param {Object} contracts - Contract information
 */
async function validateUpgrade(manager, contracts) {
    try {
        manager.status = 'validating';

        const results = {
            safe: true,
            contracts: {}
        };

        // Validate security
        const securityValidation = await manager.security.validateAccess(
            await ethers.provider.getSigner().getAddress(),
            'UPGRADER_ROLE'
        );
        if (!securityValidation.valid) {
            throw new Error(`Security validation failed: ${securityValidation.error}`);
        }

        for (const [name, info] of Object.entries(contracts)) {
            // Check interface compatibility
            const compatibility = await manager.dependencies.checkCompatibility(
                info.current,
                info.new
            );
            if (!compatibility.compatible) {
                results.safe = false;
                results.contracts[name] = {
                    safe: false,
                    errors: [`Interface incompatibility: ${compatibility.changes.removed.join(', ')}`]
                };
                continue;
            }

            // Validate contract safety
            const validation = await upgradeValidators.validateUpgradeSafety(
                info.proxy,
                info.current,
                info.new
            );

            results.contracts[name] = validation;
            if (!validation.safe) {
                results.safe = false;
            }
        }

        // Check network conditions
        if (manager.monitors.network) {
            const networkConditions = await manager.monitors.network.shouldProceed();
            results.network = networkConditions;
            if (!networkConditions.safe) {
                results.safe = false;
            }
        }

        if (manager.options.generateReports) {
            const report = reportGenerators.generateValidationReport(results);
            manager.reports.push(report);
        }

        manager.status = results.safe ? 'validated' : 'validation_failed';
        return results;

    } catch (error) {
        manager.status = 'error';
        throw new Error(`Validation failed: ${error.message}`);
    }
}

/**
 * Execute contract upgrades
 * @param {Object} manager - Upgrade manager
 * @param {Object} contracts - Contract information
 */
async function executeUpgrade(manager, contracts) {
    try {
        // Pre-upgrade checks
        if (manager.options.validateBeforeUpgrade) {
            const validation = await validateUpgrade(manager, contracts);
            if (!validation.safe) {
                throw new Error("Pre-upgrade validation failed");
            }
        }

        // Queue in timelock if required
        if (manager.options.requireTimelock) {
            for (const [name, info] of Object.entries(contracts)) {
                await manager.security.queueUpgrade({
                    contract: info.current,
                    proxy: info.proxy,
                    implementation: info.new.address
                });
            }
            return { queued: true };
        }

        // Backup if enabled
        if (manager.options.backupBeforeUpgrade) {
            for (const [name, storage] of Object.entries(manager.storage)) {
                await storage.backup();
            }
        }

        manager.status = 'upgrading';

        // Execute upgrades
        const results = {
            success: true,
            contracts: {}
        };

        for (const [name, info] of Object.entries(contracts)) {
            try {
                // Perform upgrade
                const upgraded = await upgradeHelpers.upgradeContract(
                    info.proxy,
                    info.new
                );

                results.contracts[name] = {
                    success: true,
                    address: upgraded.address,
                    transaction: upgraded.deployTransaction.hash
                };

            } catch (error) {
                results.success = false;
                results.contracts[name] = {
                    success: false,
                    error: error.message
                };
            }
        }

        // Generate report if enabled
        if (manager.options.generateReports) {
            const report = reportGenerators.generateUpgradeReport(results);
            manager.reports.push(report);
        }

        manager.status = results.success ? 'upgraded' : 'upgrade_failed';
        return results;

    } catch (error) {
        manager.status = 'error';
        throw new Error(`Upgrade failed: ${error.message}`);
    }
}

/**
 * Verify upgrade success
 * @param {Object} manager - Upgrade manager
 * @param {Object} contracts - Contract information
 */
async function verifyUpgrade(manager, contracts) {
    try {
        manager.status = 'verifying';

        const results = {
            verified: true,
            contracts: {}
        };

        for (const [name, info] of Object.entries(contracts)) {
            // Verify implementation
            const verification = await upgradeHelpers.verifyImplementation(
                info.proxy,
                info.new
            );

            // Compare states if storage manager exists
            if (manager.storage[name]) {
                const currentState = await manager.storage[name].getState();
                verification.stateValid = await verifyState(
                    manager.storage[name],
                    currentState
                );
            }

            results.contracts[name] = verification;
            if (!verification.verified) {
                results.verified = false;
            }
        }

        if (manager.options.generateReports) {
            const report = reportGenerators.generateVerificationReport(results);
            manager.reports.push(report);
        }

        manager.status = results.verified ? 'verified' : 'verification_failed';
        return results;

    } catch (error) {
        manager.status = 'error';
        throw new Error(`Verification failed: ${error.message}`);
    }
}

/**
 * Rollback upgrade
 * @param {Object} manager - Upgrade manager
 */
async function rollbackUpgrade(manager) {
    try {
        // Validate rollback permissions
        const securityValidation = await manager.security.validateAccess(
            await ethers.provider.getSigner().getAddress(),
            'ADMIN_ROLE'
        );
        if (!securityValidation.valid) {
            throw new Error(`Security validation failed: ${securityValidation.error}`);
        }

        manager.status = 'rolling_back';

        const results = {
            success: true,
            contracts: {}
        };

        // Restore from backups
        for (const [name, storage] of Object.entries(manager.storage)) {
            try {
                const backup = storage.getHistory()
                    .filter(h => h.action === 'backup')
                    .pop();

                if (backup) {
                    await storage.restore(backup);
                    results.contracts[name] = {
                        success: true,
                        restored: true
                    };
                } else {
                    results.contracts[name] = {
                        success: false,
                        error: 'No backup found'
                    };
                }
            } catch (error) {
                results.success = false;
                results.contracts[name] = {
                    success: false,
                    error: error.message
                };
            }
        }

        if (manager.options.generateReports) {
            const report = reportGenerators.generateRollbackReport(results);
            manager.reports.push(report);
        }

        manager.status = results.success ? 'rolled_back' : 'rollback_failed';
        return results;

    } catch (error) {
        manager.status = 'error';
        throw new Error(`Rollback failed: ${error.message}`);
    }
}

/**
 * Get upgrade status
 * @param {Object} manager - Upgrade manager
 * @returns {Object} Status information
 */
function getUpgradeStatus(manager) {
    return {
        status: manager.status,
        options: manager.options,
        reports: manager.reports.length,
        security: {
            timelock: manager.security?.timelock?.address || null,
            multisig: manager.security?.multisig?.address || null
        },
        monitors: {
            network: manager.monitors.network?.active || false,
            events: Object.fromEntries(
                Object.entries(manager.monitors.events || {})
                    .map(([name, monitor]) => [name, monitor.active])
            )
        },
        storage: Object.fromEntries(
            Object.entries(manager.storage)
                .map(([name, storage]) => [name, storage.getHistory().length])
        )
    };
}

/**
 * Generate comprehensive upgrade report
 * @param {Object} manager - Upgrade manager
 * @returns {string} Report content
 */
function generateUpgradeReport(manager) {
    return reportGenerators.generateMarkdownReport(
        {
            status: getUpgradeStatus(manager),
            reports: manager.reports,
            security: {
                timelock: manager.security?.timelock?.address,
                multisig: manager.security?.multisig?.address,
                roles: Array.from(manager.security?.roles.entries() || []),
                permissions: Array.from(manager.security?.permissions.entries() || [])
            },
            network: manager.monitors.network?.generateReport(),
            events: Object.fromEntries(
                Object.entries(manager.monitors.events || {})
                    .map(([name, monitor]) => [name, monitor.generateReport()])
            ),
            storage: Object.fromEntries(
                Object.entries(manager.storage)
                    .map(([name, storage]) => [name, storage.getHistory()])
            )
        },
        'upgrade'
    );
}

module.exports = {
    createUpgradeManager,
    ...upgradeHelpers,
    ...reportGenerators,
    ...upgradeValidators,
    ...eventMonitors,
    ...networkHelpers,
    ...storageHelpers,
    ...dependencyHelpers,
    ...securityHelpers,
    config
};
