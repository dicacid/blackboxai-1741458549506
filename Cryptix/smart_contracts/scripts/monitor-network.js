const { ethers } = require("hardhat");
const Table = require("cli-table3");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n🔍 Monitoring network status and deployment health...\n");

    // Load deployment info if exists
    const deploymentPath = path.join(__dirname, "../deployments", network.name, "deployment.json");
    let deploymentInfo = null;
    if (fs.existsSync(deploymentPath)) {
        deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    }

    // Get network info
    const network = await ethers.provider.getNetwork();
    const gasPrice = await ethers.provider.getGasPrice();
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);

    console.log("Network Information:");
    console.log("-------------------");
    console.log(`Name: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}`);
    console.log(`Block Number: ${blockNumber}`);
    console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
    console.log(`Block Time: ${new Date(block.timestamp * 1000).toISOString()}`);
    console.log();

    // Monitor network health
    const healthStatus = await checkNetworkHealth(ethers.provider);
    console.log("Network Health Status:");
    console.log("---------------------");
    Object.entries(healthStatus).forEach(([key, value]) => {
        const status = value.status ? "✓" : "✗";
        const color = value.status ? "\x1b[32m" : "\x1b[31m";
        console.log(`${color}${status}\x1b[0m ${key}: ${value.message}`);
    });
    console.log();

    // Check deployed contracts if available
    if (deploymentInfo) {
        console.log("Deployed Contracts Status:");
        console.log("-------------------------");
        const contractTable = new Table({
            head: ["Contract", "Address", "Status", "Last Activity"],
            style: {
                head: ["cyan"],
                border: ["gray"]
            }
        });

        for (const [name, info] of Object.entries(deploymentInfo.contracts)) {
            try {
                const status = await checkContractStatus(info.address, ethers.provider);
                contractTable.push([
                    name,
                    info.address,
                    status.alive ? "✓ Active" : "✗ Inactive",
                    status.lastActivity || "N/A"
                ]);
            } catch (error) {
                contractTable.push([
                    name,
                    info.address,
                    "✗ Error",
                    "N/A"
                ]);
            }
        }

        console.log(contractTable.toString());
        console.log();
    }

    // Generate report
    const report = {
        timestamp: new Date().toISOString(),
        network: {
            name: network.name,
            chainId: network.chainId,
            blockNumber,
            gasPrice: ethers.utils.formatUnits(gasPrice, "gwei"),
            blockTime: new Date(block.timestamp * 1000).toISOString()
        },
        health: healthStatus,
        contracts: deploymentInfo?.contracts || null,
        recommendations: generateRecommendations(healthStatus, deploymentInfo)
    };

    // Save report
    const reportDir = path.join(__dirname, "../reports");
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `network-status-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print recommendations
    console.log("Recommendations:");
    console.log("---------------");
    report.recommendations.forEach(rec => console.log(`- ${rec}`));
    console.log();

    console.log("Report saved to:", reportPath);
}

async function checkNetworkHealth(provider) {
    const health = {};

    try {
        // Check block production
        const currentBlock = await provider.getBlockNumber();
        const blockTime = await getAverageBlockTime(provider, currentBlock, 10);
        health.blockProduction = {
            status: blockTime < 30, // Warning if blocks take more than 30 seconds
            message: `Average block time: ${blockTime.toFixed(2)} seconds`
        };

        // Check gas price stability
        const gasPrices = await getRecentGasPrices(provider, 5);
        const gasVariance = calculateVariance(gasPrices);
        health.gasPrice = {
            status: gasVariance < 0.3, // Warning if gas price varies more than 30%
            message: `Gas price variance: ${(gasVariance * 100).toFixed(2)}%`
        };

        // Check network congestion
        const pendingBlock = await provider.send("eth_getBlockByNumber", ["pending", false]);
        const congestionLevel = pendingBlock.transactions.length / 500; // Assuming 500 tx/block is high
        health.congestion = {
            status: congestionLevel < 0.8,
            message: `Network congestion: ${(congestionLevel * 100).toFixed(2)}%`
        };

        // Check peer count if available
        try {
            const peerCount = await provider.send("net_peerCount", []);
            health.peers = {
                status: parseInt(peerCount, 16) > 2,
                message: `Connected peers: ${parseInt(peerCount, 16)}`
            };
        } catch {
            health.peers = {
                status: true,
                message: "Peer count not available"
            };
        }

    } catch (error) {
        console.error("Error checking network health:", error);
    }

    return health;
}

async function getAverageBlockTime(provider, currentBlock, blocks) {
    const timestamps = [];
    for (let i = 0; i < blocks; i++) {
        const block = await provider.getBlock(currentBlock - i);
        timestamps.push(block.timestamp);
    }

    let totalTime = 0;
    for (let i = 1; i < timestamps.length; i++) {
        totalTime += timestamps[i - 1] - timestamps[i];
    }

    return totalTime / (timestamps.length - 1);
}

async function getRecentGasPrices(provider, count) {
    const prices = [];
    for (let i = 0; i < count; i++) {
        prices.push(await provider.getGasPrice());
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return prices.map(p => parseFloat(ethers.utils.formatUnits(p, "gwei")));
}

function calculateVariance(numbers) {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance) / mean; // Coefficient of variation
}

async function checkContractStatus(address, provider) {
    const code = await provider.getCode(address);
    if (code === "0x") {
        return { alive: false };
    }

    // Get last activity
    const filter = {
        address,
        fromBlock: 0,
        toBlock: "latest"
    };

    try {
        const events = await provider.getLogs(filter);
        if (events.length > 0) {
            const lastEvent = events[events.length - 1];
            const block = await provider.getBlock(lastEvent.blockNumber);
            return {
                alive: true,
                lastActivity: new Date(block.timestamp * 1000).toISOString()
            };
        }
    } catch (error) {
        console.warn("Error getting contract logs:", error.message);
    }

    return { alive: true, lastActivity: null };
}

function generateRecommendations(health, deploymentInfo) {
    const recommendations = [];

    // Network health recommendations
    if (!health.blockProduction?.status) {
        recommendations.push("Network block production is slow. Consider waiting for network conditions to improve.");
    }

    if (!health.gasPrice?.status) {
        recommendations.push("Gas prices are volatile. Monitor prices and time transactions accordingly.");
    }

    if (!health.congestion?.status) {
        recommendations.push("Network is congested. Consider increasing gas price for faster transactions.");
    }

    if (!health.peers?.status) {
        recommendations.push("Low peer count. Verify network connectivity and node health.");
    }

    // Contract-specific recommendations
    if (deploymentInfo) {
        Object.entries(deploymentInfo.contracts).forEach(([name, info]) => {
            if (!info.verified) {
                recommendations.push(`${name} is not verified on block explorer. Run verification script.`);
            }
        });
    }

    // General recommendations
    recommendations.push(
        "Regularly monitor contract events and transaction history",
        "Keep deployment information and access keys secure",
        "Document any network-specific configurations or issues"
    );

    return recommendations;
}

// Execute monitoring
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
