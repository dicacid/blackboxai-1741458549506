const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Monitor contract events during upgrade process
 * @param {string} proxyAddress - Proxy contract address
 * @param {Object} Contract - Contract factory
 * @param {Object} options - Monitoring options
 * @returns {Object} Event monitoring instance
 */
function createEventMonitor(proxyAddress, Contract, options = {}) {
    const monitor = {
        events: [],
        filters: new Map(),
        active: false,
        startBlock: 0,
        contract: null,
        logFile: null,
        options: {
            logToFile: true,
            logDirectory: path.join(__dirname, "../../logs/events"),
            includeTransactions: true,
            includeFunctionCalls: true,
            includeStateChanges: true,
            ...options
        }
    };

    // Initialize monitoring functions
    monitor.start = async () => await startMonitoring(monitor, proxyAddress, Contract);
    monitor.stop = async () => await stopMonitoring(monitor);
    monitor.getEvents = () => monitor.events;
    monitor.addFilter = (eventName, filter) => monitor.filters.set(eventName, filter);
    monitor.clearFilters = () => monitor.filters.clear();
    monitor.generateReport = () => generateEventReport(monitor);

    return monitor;
}

/**
 * Start monitoring contract events
 * @param {Object} monitor - Monitor instance
 * @param {string} proxyAddress - Proxy contract address
 * @param {Object} Contract - Contract factory
 */
async function startMonitoring(monitor, proxyAddress, Contract) {
    if (monitor.active) return;

    try {
        // Initialize contract instance
        monitor.contract = new ethers.Contract(
            proxyAddress,
            Contract.interface,
            ethers.provider
        );

        // Set up logging
        if (monitor.options.logToFile) {
            const timestamp = Date.now();
            const logPath = path.join(
                monitor.options.logDirectory,
                `events-${timestamp}.log`
            );
            fs.mkdirSync(monitor.options.logDirectory, { recursive: true });
            monitor.logFile = fs.createWriteStream(logPath, { flags: 'a' });
        }

        // Get current block
        monitor.startBlock = await ethers.provider.getBlockNumber();

        // Set up event listeners
        setupEventListeners(monitor);

        // Set up transaction monitoring if enabled
        if (monitor.options.includeTransactions) {
            setupTransactionMonitoring(monitor);
        }

        // Set up function call monitoring if enabled
        if (monitor.options.includeFunctionCalls) {
            setupFunctionCallMonitoring(monitor);
        }

        // Set up state change monitoring if enabled
        if (monitor.options.includeStateChanges) {
            setupStateChangeMonitoring(monitor);
        }

        monitor.active = true;
        logEvent(monitor, "monitoring", "Event monitoring started");

    } catch (error) {
        throw new Error(`Failed to start monitoring: ${error.message}`);
    }
}

/**
 * Stop monitoring contract events
 * @param {Object} monitor - Monitor instance
 */
async function stopMonitoring(monitor) {
    if (!monitor.active) return;

    try {
        // Remove all listeners
        monitor.contract.removeAllListeners();

        // Close log file if exists
        if (monitor.logFile) {
            monitor.logFile.end();
        }

        monitor.active = false;
        const endBlock = await ethers.provider.getBlockNumber();
        logEvent(monitor, "monitoring", "Event monitoring stopped", { endBlock });

    } catch (error) {
        throw new Error(`Failed to stop monitoring: ${error.message}`);
    }
}

/**
 * Set up event listeners for the contract
 * @param {Object} monitor - Monitor instance
 */
function setupEventListeners(monitor) {
    const contract = monitor.contract;

    // Get all event definitions from the contract interface
    const events = Object.values(contract.interface.events);

    // Set up listeners for each event
    events.forEach(event => {
        contract.on(event.name, async (...args) => {
            const eventObj = args[args.length - 1]; // Last argument is the event object
            const block = await eventObj.getBlock();
            const tx = await eventObj.getTransaction();

            const eventData = {
                name: event.name,
                args: formatEventArgs(event, args.slice(0, -1)),
                blockNumber: eventObj.blockNumber,
                blockTime: new Date(block.timestamp * 1000).toISOString(),
                transactionHash: eventObj.transactionHash,
                logIndex: eventObj.logIndex,
                gasUsed: (await eventObj.getTransactionReceipt()).gasUsed.toString(),
                gasPrice: tx.gasPrice.toString()
            };

            // Apply filters if any
            if (monitor.filters.has(event.name)) {
                const filter = monitor.filters.get(event.name);
                if (!filter(eventData)) return;
            }

            // Store and log event
            monitor.events.push(eventData);
            logEvent(monitor, "event", event.name, eventData);
        });
    });
}

/**
 * Set up transaction monitoring
 * @param {Object} monitor - Monitor instance
 */
function setupTransactionMonitoring(monitor) {
    ethers.provider.on("pending", async (txHash) => {
        try {
            const tx = await ethers.provider.getTransaction(txHash);
            if (tx && tx.to && tx.to.toLowerCase() === monitor.contract.address.toLowerCase()) {
                const txData = {
                    hash: txHash,
                    from: tx.from,
                    value: tx.value.toString(),
                    gasPrice: tx.gasPrice.toString(),
                    gasLimit: tx.gasLimit.toString(),
                    nonce: tx.nonce,
                    data: tx.data
                };

                logEvent(monitor, "transaction", "Pending Transaction", txData);
            }
        } catch (error) {
            logEvent(monitor, "error", "Transaction monitoring error", { error: error.message });
        }
    });
}

/**
 * Set up function call monitoring
 * @param {Object} monitor - Monitor instance
 */
function setupFunctionCallMonitoring(monitor) {
    const contract = monitor.contract;

    // Get all function definitions
    const functions = Object.values(contract.interface.functions);

    // Monitor each non-view function
    functions.forEach(func => {
        if (func.stateMutability !== "view" && func.stateMutability !== "pure") {
            const originalFunc = contract[func.name];
            contract[func.name] = async (...args) => {
                const callData = {
                    function: func.name,
                    arguments: args,
                    caller: await ethers.provider.getSigner().getAddress()
                };

                logEvent(monitor, "functionCall", "Function Called", callData);
                return originalFunc.apply(contract, args);
            };
        }
    });
}

/**
 * Set up state change monitoring
 * @param {Object} monitor - Monitor instance
 */
function setupStateChangeMonitoring(monitor) {
    const contract = monitor.contract;

    // Get all public state variables
    const stateVars = Object.values(contract.interface.functions)
        .filter(f => f.stateMutability === "view" && f.inputs.length === 0);

    // Monitor state changes after each transaction
    ethers.provider.on("block", async () => {
        try {
            const stateChanges = {};
            let hasChanges = false;

            for (const stateVar of stateVars) {
                const newValue = await contract[stateVar.name]();
                const oldValue = monitor.lastState?.[stateVar.name];

                if (!monitor.lastState || !ethers.BigNumber.from(oldValue || 0).eq(newValue)) {
                    stateChanges[stateVar.name] = {
                        from: oldValue?.toString() || "unknown",
                        to: newValue.toString()
                    };
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                logEvent(monitor, "stateChange", "State Variables Changed", stateChanges);
            }

            // Update last known state
            monitor.lastState = Object.fromEntries(
                await Promise.all(stateVars.map(async v => [
                    v.name,
                    (await contract[v.name]()).toString()
                ]))
            );

        } catch (error) {
            logEvent(monitor, "error", "State monitoring error", { error: error.message });
        }
    });
}

/**
 * Format event arguments
 * @param {Object} event - Event definition
 * @param {Array} args - Event arguments
 * @returns {Object} Formatted arguments
 */
function formatEventArgs(event, args) {
    const formatted = {};
    event.inputs.forEach((input, index) => {
        let value = args[index];
        if (value && value._isBigNumber) {
            value = value.toString();
        }
        formatted[input.name] = value;
    });
    return formatted;
}

/**
 * Log event to file and/or console
 * @param {Object} monitor - Monitor instance
 * @param {string} type - Event type
 * @param {string} name - Event name
 * @param {Object} data - Event data
 */
function logEvent(monitor, type, name, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        type,
        name,
        ...data
    };

    // Log to file if enabled
    if (monitor.logFile) {
        monitor.logFile.write(JSON.stringify(logEntry) + '\n');
    }

    // Log to console
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${name}`);
    if (Object.keys(data).length > 0) {
        console.log(JSON.stringify(data, null, 2));
    }
}

/**
 * Generate event monitoring report
 * @param {Object} monitor - Monitor instance
 * @returns {Object} Event report
 */
function generateEventReport(monitor) {
    const report = {
        startTime: new Date(monitor.startBlock * 1000).toISOString(),
        endTime: new Date().toISOString(),
        totalEvents: monitor.events.length,
        eventTypes: {},
        significantEvents: [],
        errors: []
    };

    // Analyze events
    monitor.events.forEach(event => {
        // Count event types
        report.eventTypes[event.name] = (report.eventTypes[event.name] || 0) + 1;

        // Identify significant events
        if (isSignificantEvent(event)) {
            report.significantEvents.push(event);
        }

        // Collect errors
        if (event.type === "error") {
            report.errors.push(event);
        }
    });

    return report;
}

/**
 * Check if an event is significant
 * @param {Object} event - Event data
 * @returns {boolean} Whether event is significant
 */
function isSignificantEvent(event) {
    // Define criteria for significant events
    const significantPatterns = [
        /upgrade/i,
        /admin/i,
        /owner/i,
        /pause/i,
        /unpause/i,
        /emergency/i
    ];

    return significantPatterns.some(pattern => pattern.test(event.name));
}

module.exports = {
    createEventMonitor,
    generateEventReport
};
