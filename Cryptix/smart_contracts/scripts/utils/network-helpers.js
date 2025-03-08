const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Monitor network conditions and gas prices
 * @param {Object} options - Monitoring options
 * @returns {Object} Network monitor instance
 */
function createNetworkMonitor(options = {}) {
    const monitor = {
        active: false,
        readings: [],
        alerts: [],
        thresholds: {
            maxGasPrice: ethers.utils.parseUnits("100", "gwei"),
            minPeerCount: 3,
            maxBlockTime: 15000, // 15 seconds
            maxPendingTx: 50,
            ...options.thresholds
        },
        logFile: null,
        options: {
            logToFile: true,
            logDirectory: path.join(__dirname, "../../logs/network"),
            pollInterval: 5000, // 5 seconds
            alertOnThreshold: true,
            ...options
        }
    };

    // Initialize monitoring functions
    monitor.start = async () => await startNetworkMonitoring(monitor);
    monitor.stop = async () => await stopNetworkMonitoring(monitor);
    monitor.getReadings = () => monitor.readings;
    monitor.getAlerts = () => monitor.alerts;
    monitor.generateReport = () => generateNetworkReport(monitor);
    monitor.estimateOptimalGas = async () => await estimateOptimalGasPrice(monitor);
    monitor.shouldProceed = async () => await checkNetworkConditions(monitor);

    return monitor;
}

/**
 * Start network monitoring
 * @param {Object} monitor - Monitor instance
 */
async function startNetworkMonitoring(monitor) {
    if (monitor.active) return;

    try {
        // Set up logging
        if (monitor.options.logToFile) {
            const timestamp = Date.now();
            const logPath = path.join(
                monitor.options.logDirectory,
                `network-${timestamp}.log`
            );
            fs.mkdirSync(monitor.options.logDirectory, { recursive: true });
            monitor.logFile = fs.createWriteStream(logPath, { flags: 'a' });
        }

        // Start polling
        monitor.active = true;
        monitor.pollInterval = setInterval(
            async () => await pollNetworkConditions(monitor),
            monitor.options.pollInterval
        );

        logNetworkEvent(monitor, "monitoring", "Network monitoring started");

    } catch (error) {
        throw new Error(`Failed to start network monitoring: ${error.message}`);
    }
}

/**
 * Stop network monitoring
 * @param {Object} monitor - Monitor instance
 */
async function stopNetworkMonitoring(monitor) {
    if (!monitor.active) return;

    try {
        clearInterval(monitor.pollInterval);
        
        if (monitor.logFile) {
            monitor.logFile.end();
        }

        monitor.active = false;
        logNetworkEvent(monitor, "monitoring", "Network monitoring stopped");

    } catch (error) {
        throw new Error(`Failed to stop network monitoring: ${error.message}`);
    }
}

/**
 * Poll network conditions
 * @param {Object} monitor - Monitor instance
 */
async function pollNetworkConditions(monitor) {
    try {
        const reading = await getNetworkReading();
        monitor.readings.push(reading);

        // Keep only last hour of readings
        const oneHourAgo = Date.now() - 3600000;
        monitor.readings = monitor.readings.filter(r => r.timestamp >= oneHourAgo);

        // Check thresholds
        if (monitor.options.alertOnThreshold) {
            checkThresholds(monitor, reading);
        }

        logNetworkEvent(monitor, "reading", "Network conditions updated", reading);

    } catch (error) {
        logNetworkEvent(monitor, "error", "Network polling error", { error: error.message });
    }
}

/**
 * Get current network conditions
 * @returns {Object} Network reading
 */
async function getNetworkReading() {
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const gasPrice = await provider.getGasPrice();

    let peerCount = 0;
    try {
        peerCount = parseInt(await provider.send("net_peerCount", []), 16);
    } catch (error) {
        console.warn("Could not get peer count");
    }

    return {
        timestamp: Date.now(),
        network: network.name,
        chainId: network.chainId,
        blockNumber,
        blockTime: block.timestamp,
        gasPrice: gasPrice.toString(),
        peerCount,
        pendingTransactions: (await provider.send("eth_pendingTransactions", [])).length
    };
}

/**
 * Check network thresholds
 * @param {Object} monitor - Monitor instance
 * @param {Object} reading - Network reading
 */
function checkThresholds(monitor, reading) {
    const alerts = [];

    // Check gas price
    if (ethers.BigNumber.from(reading.gasPrice).gt(monitor.thresholds.maxGasPrice)) {
        alerts.push({
            type: "gas_price",
            message: `Gas price (${ethers.utils.formatUnits(reading.gasPrice, "gwei")} gwei) exceeds threshold`
        });
    }

    // Check peer count
    if (reading.peerCount < monitor.thresholds.minPeerCount) {
        alerts.push({
            type: "peer_count",
            message: `Peer count (${reading.peerCount}) below threshold`
        });
    }

    // Check block time
    const lastReading = monitor.readings[monitor.readings.length - 2];
    if (lastReading) {
        const blockTime = reading.blockTime - lastReading.blockTime;
        if (blockTime > monitor.thresholds.maxBlockTime) {
            alerts.push({
                type: "block_time",
                message: `Block time (${blockTime}ms) exceeds threshold`
            });
        }
    }

    // Check pending transactions
    if (reading.pendingTransactions > monitor.thresholds.maxPendingTx) {
        alerts.push({
            type: "pending_tx",
            message: `Pending transactions (${reading.pendingTransactions}) exceeds threshold`
        });
    }

    // Log alerts
    alerts.forEach(alert => {
        monitor.alerts.push({
            ...alert,
            timestamp: Date.now(),
            reading
        });
        logNetworkEvent(monitor, "alert", alert.message, alert);
    });
}

/**
 * Estimate optimal gas price
 * @param {Object} monitor - Monitor instance
 * @returns {Object} Gas price estimation
 */
async function estimateOptimalGasPrice(monitor) {
    const readings = monitor.readings.slice(-12); // Last minute of readings
    if (readings.length === 0) {
        return await ethers.provider.getGasPrice();
    }

    // Calculate average and trend
    const prices = readings.map(r => ethers.BigNumber.from(r.gasPrice));
    const average = prices.reduce((a, b) => a.add(b)).div(prices.length);
    const trend = prices[prices.length - 1].sub(prices[0]).div(prices.length);

    // Adjust based on trend
    let optimal = average;
    if (trend.gt(0)) {
        // Rising prices, add buffer
        optimal = optimal.add(trend.mul(3)); // Project 3 intervals ahead
    }

    // Ensure within reasonable bounds
    const minGas = ethers.utils.parseUnits("1", "gwei");
    const maxGas = monitor.thresholds.maxGasPrice;
    
    if (optimal.lt(minGas)) optimal = minGas;
    if (optimal.gt(maxGas)) optimal = maxGas;

    return optimal;
}

/**
 * Check if network conditions are suitable for operations
 * @param {Object} monitor - Monitor instance
 * @returns {Object} Network conditions check result
 */
async function checkNetworkConditions(monitor) {
    const reading = await getNetworkReading();
    const gasPrice = ethers.BigNumber.from(reading.gasPrice);
    
    const result = {
        safe: true,
        warnings: [],
        reading
    };

    // Check gas price
    if (gasPrice.gt(monitor.thresholds.maxGasPrice)) {
        result.safe = false;
        result.warnings.push("Gas price too high");
    }

    // Check peer count
    if (reading.peerCount < monitor.thresholds.minPeerCount) {
        result.safe = false;
        result.warnings.push("Insufficient peers");
    }

    // Check pending transactions
    if (reading.pendingTransactions > monitor.thresholds.maxPendingTx) {
        result.warnings.push("High pending transaction count");
    }

    // Check recent alerts
    const recentAlerts = monitor.alerts.filter(
        a => a.timestamp > Date.now() - 300000 // Last 5 minutes
    );
    if (recentAlerts.length > 0) {
        result.warnings.push(`${recentAlerts.length} recent network alerts`);
    }

    return result;
}

/**
 * Log network event
 * @param {Object} monitor - Monitor instance
 * @param {string} type - Event type
 * @param {string} message - Event message
 * @param {Object} data - Event data
 */
function logNetworkEvent(monitor, type, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        type,
        message,
        ...data
    };

    if (monitor.logFile) {
        monitor.logFile.write(JSON.stringify(logEntry) + '\n');
    }

    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    if (Object.keys(data).length > 0) {
        console.log(JSON.stringify(data, null, 2));
    }
}

/**
 * Generate network monitoring report
 * @param {Object} monitor - Monitor instance
 * @returns {Object} Network report
 */
function generateNetworkReport(monitor) {
    const readings = monitor.readings;
    if (readings.length === 0) {
        return {
            status: "No readings available"
        };
    }

    const latest = readings[readings.length - 1];
    const gasPrices = readings.map(r => ethers.BigNumber.from(r.gasPrice));
    const avgGasPrice = gasPrices.reduce((a, b) => a.add(b)).div(gasPrices.length);

    return {
        timestamp: new Date().toISOString(),
        duration: readings[readings.length - 1].timestamp - readings[0].timestamp,
        readings: readings.length,
        network: {
            name: latest.network,
            chainId: latest.chainId,
            currentBlock: latest.blockNumber,
            peerCount: latest.peerCount
        },
        gasPrice: {
            current: ethers.utils.formatUnits(latest.gasPrice, "gwei"),
            average: ethers.utils.formatUnits(avgGasPrice, "gwei"),
            trend: calculateTrend(gasPrices)
        },
        alerts: monitor.alerts,
        recommendations: generateRecommendations(monitor)
    };
}

/**
 * Calculate trend from series of values
 * @param {Array} values - Array of values
 * @returns {string} Trend description
 */
function calculateTrend(values) {
    if (values.length < 2) return "insufficient data";
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = last.sub(first);
    
    if (change.eq(0)) return "stable";
    const percentage = change.mul(100).div(first);
    
    if (percentage.gt(10)) return "strongly rising";
    if (percentage.gt(0)) return "slightly rising";
    if (percentage.lt(-10)) return "strongly falling";
    return "slightly falling";
}

/**
 * Generate network recommendations
 * @param {Object} monitor - Monitor instance
 * @returns {Array} Recommendations
 */
function generateRecommendations(monitor) {
    const recommendations = [];
    const latest = monitor.readings[monitor.readings.length - 1];

    if (!latest) return ["Insufficient monitoring data"];

    // Gas price recommendations
    const gasPrice = ethers.BigNumber.from(latest.gasPrice);
    if (gasPrice.gt(monitor.thresholds.maxGasPrice)) {
        recommendations.push("Wait for lower gas prices before proceeding");
    }

    // Network health recommendations
    if (latest.peerCount < monitor.thresholds.minPeerCount) {
        recommendations.push("Network connection may be unstable");
    }

    if (latest.pendingTransactions > monitor.thresholds.maxPendingTx) {
        recommendations.push("Network is congested, consider waiting");
    }

    // Recent alert recommendations
    const recentAlerts = monitor.alerts.filter(
        a => a.timestamp > Date.now() - 300000
    );
    if (recentAlerts.length > 0) {
        recommendations.push("Address recent network alerts before proceeding");
    }

    return recommendations;
}

module.exports = {
    createNetworkMonitor,
    estimateOptimalGasPrice,
    checkNetworkConditions,
    generateNetworkReport
};
