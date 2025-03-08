/**
 * Configuration for contract upgrades
 */
module.exports = {
    // Validation settings
    validation: {
        // Storage validation
        storage: {
            requireGaps: true,
            minGapSize: 50,
            validateTypes: true,
            allowNewVariables: true,
            allowReorder: false
        },

        // Function validation
        functions: {
            allowRemoval: false,
            allowVisibilityChange: false,
            requireUpgradeability: true,
            validateSelectors: true,
            validateModifiers: true
        },

        // Security validation
        security: {
            requireAccessControl: true,
            validateInitializers: true,
            checkReentrancy: true,
            validateProxies: true,
            requireTimelock: true
        }
    },

    // Monitoring settings
    monitoring: {
        // Network monitoring
        network: {
            pollInterval: 5000, // 5 seconds
            thresholds: {
                maxGasPrice: "100", // in gwei
                minPeerCount: 3,
                maxBlockTime: 15000, // 15 seconds
                maxPendingTx: 50
            }
        },

        // Event monitoring
        events: {
            logToFile: true,
            includeTransactions: true,
            includeFunctionCalls: true,
            includeStateChanges: true,
            significantEvents: [
                "Upgraded",
                "AdminChanged",
                "OwnershipTransferred",
                "Paused",
                "Unpaused"
            ]
        },

        // Storage monitoring
        storage: {
            trackHistory: true,
            validateAccess: true,
            backupBeforeWrite: true,
            protectedSlots: [
                "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc", // Implementation slot
                "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"  // Admin slot
            ]
        }
    },

    // Upgrade settings
    upgrade: {
        // Pre-upgrade checks
        preUpgrade: {
            validateStorage: true,
            validateFunctions: true,
            validateSecurity: true,
            checkNetworkConditions: true,
            requireBackup: true
        },

        // Upgrade process
        process: {
            timeout: 600000, // 10 minutes
            confirmations: 5,
            retries: 3,
            backoff: 1000 // 1 second
        },

        // Post-upgrade checks
        postUpgrade: {
            verifyImplementation: true,
            validateState: true,
            checkEvents: true,
            monitorTransactions: true
        }
    },

    // Backup settings
    backup: {
        // Storage backup
        storage: {
            enabled: true,
            keepHistory: true,
            compressionEnabled: true,
            maxBackups: 10
        },

        // State backup
        state: {
            enabled: true,
            includePrivateVars: false,
            validateRestore: true,
            backupMetadata: true
        }
    },

    // Report settings
    reporting: {
        // Report generation
        generate: {
            markdown: true,
            json: true,
            console: true
        },

        // Report content
        include: {
            validation: true,
            monitoring: true,
            storage: true,
            events: true,
            network: true
        },

        // Report storage
        storage: {
            enabled: true,
            directory: "reports",
            keepDays: 30
        }
    },

    // Network-specific settings
    networks: {
        // Sepolia settings
        sepolia: {
            validation: {
                requireTimelock: true,
                minConfirmations: 5
            },
            monitoring: {
                pollInterval: 10000,
                maxGasPrice: "50"
            },
            upgrade: {
                confirmations: 3,
                timeout: 300000
            }
        },

        // Goerli settings
        goerli: {
            validation: {
                requireTimelock: true,
                minConfirmations: 5
            },
            monitoring: {
                pollInterval: 10000,
                maxGasPrice: "50"
            },
            upgrade: {
                confirmations: 3,
                timeout: 300000
            }
        },

        // Local network settings
        localhost: {
            validation: {
                requireTimelock: false,
                minConfirmations: 1
            },
            monitoring: {
                pollInterval: 1000,
                maxGasPrice: "1000"
            },
            upgrade: {
                confirmations: 1,
                timeout: 60000
            }
        }
    },

    // Error messages
    errors: {
        validation: {
            STORAGE_GAP_MISSING: "Storage gap not found in contract",
            STORAGE_GAP_TOO_SMALL: "Storage gap size is too small",
            FUNCTION_REMOVED: "Function removal is not allowed",
            VISIBILITY_CHANGED: "Function visibility change is not allowed",
            UPGRADEABILITY_MISSING: "Contract must be upgradeable",
            ACCESS_CONTROL_MISSING: "Access control not implemented",
            INITIALIZER_INVALID: "Invalid initializer implementation",
            REENTRANCY_RISK: "Potential reentrancy risk detected",
            PROXY_INVALID: "Invalid proxy implementation",
            TIMELOCK_MISSING: "Timelock mechanism not found"
        },
        upgrade: {
            NETWORK_CONDITIONS: "Network conditions not suitable for upgrade",
            BACKUP_FAILED: "Failed to create backup before upgrade",
            UPGRADE_TIMEOUT: "Upgrade transaction timeout",
            VERIFICATION_FAILED: "Post-upgrade verification failed",
            STATE_INVALID: "Contract state invalid after upgrade"
        }
    },

    // Recommendations
    recommendations: {
        storage: [
            "Include storage gaps in all upgradeable contracts",
            "Keep storage layout backwards compatible",
            "Document all storage changes"
        ],
        security: [
            "Implement access control mechanisms",
            "Use timelock for critical upgrades",
            "Monitor events during upgrade"
        ],
        upgrade: [
            "Test upgrade in forked environment",
            "Monitor gas prices before upgrade",
            "Have rollback plan ready"
        ]
    }
};
