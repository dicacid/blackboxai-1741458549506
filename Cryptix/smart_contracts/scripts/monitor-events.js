const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n📡 Starting contract event monitoring...\n");

    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployments", network.name, "deployment.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployment info not found. Please deploy contracts first.");
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const network = await ethers.provider.getNetwork();
    
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}\n`);

    // Create event log directory
    const logDir = path.join(__dirname, "../logs/events");
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // Initialize contract instances
    const contracts = {};
    for (const [name, info] of Object.entries(deploymentInfo.contracts)) {
        try {
            const artifact = await artifacts.readArtifact(name);
            contracts[name] = new ethers.Contract(
                info.address,
                artifact.abi,
                ethers.provider
            );
            console.log(`✓ Loaded ${name} at ${info.address}`);
        } catch (error) {
            console.error(`❌ Failed to load ${name}:`, error.message);
        }
    }

    console.log("\nStarting event listeners...\n");

    // Start monitoring events
    const startBlock = await ethers.provider.getBlockNumber();
    const eventLogPath = path.join(logDir, `events-${network.name}-${Date.now()}.json`);
    const eventLog = {
        network: network.name,
        chainId: network.chainId,
        startBlock,
        startTime: new Date().toISOString(),
        contracts: deploymentInfo.contracts,
        events: []
    };

    // Save initial log
    fs.writeFileSync(eventLogPath, JSON.stringify(eventLog, null, 2));

    // Setup event handlers for each contract
    for (const [name, contract] of Object.entries(contracts)) {
        try {
            // Get all event names from ABI
            const events = contract.interface.events;
            
            console.log(`Monitoring ${name} events:`);
            for (const [eventName, eventInfo] of Object.entries(events)) {
                console.log(`- ${eventName}`);
                
                // Create event listener
                contract.on(eventName, async (...args) => {
                    const event = args[args.length - 1]; // Last argument is the event object
                    const block = await event.getBlock();
                    const tx = await event.getTransaction();

                    const eventData = {
                        timestamp: new Date().toISOString(),
                        contract: name,
                        event: eventName,
                        blockNumber: event.blockNumber,
                        blockTime: new Date(block.timestamp * 1000).toISOString(),
                        transactionHash: event.transactionHash,
                        args: formatEventArgs(eventInfo, args.slice(0, -1)),
                        gasUsed: (await event.getTransactionReceipt()).gasUsed.toString(),
                        gasPrice: tx.gasPrice.toString()
                    };

                    // Log to console
                    console.log("\nNew event detected:");
                    console.log("----------------");
                    console.log(`Contract: ${name}`);
                    console.log(`Event: ${eventName}`);
                    console.log(`Block: ${event.blockNumber}`);
                    console.log(`Transaction: ${event.transactionHash}`);
                    console.log("Arguments:", eventData.args);
                    console.log("Gas Used:", eventData.gasUsed);
                    console.log("Gas Price:", ethers.utils.formatUnits(eventData.gasPrice, "gwei"), "gwei");
                    console.log("----------------\n");

                    // Update log file
                    const currentLog = JSON.parse(fs.readFileSync(eventLogPath, "utf8"));
                    currentLog.events.push(eventData);
                    fs.writeFileSync(eventLogPath, JSON.stringify(currentLog, null, 2));

                    // Generate event analysis
                    await analyzeEvent(eventData, currentLog);
                });
            }
        } catch (error) {
            console.error(`Error setting up listeners for ${name}:`, error.message);
        }
    }

    console.log("\n✓ Event monitoring started");
    console.log("Event logs will be saved to:", eventLogPath);
    console.log("\nPress Ctrl+C to stop monitoring\n");

    // Keep script running
    await new Promise(() => {});
}

function formatEventArgs(eventInfo, args) {
    const formatted = {};
    eventInfo.inputs.forEach((input, index) => {
        let value = args[index];
        // Format BigNumber values
        if (value && value._isBigNumber) {
            value = value.toString();
        }
        formatted[input.name] = value;
    });
    return formatted;
}

async function analyzeEvent(eventData, currentLog) {
    try {
        const analysis = {
            timestamp: new Date().toISOString(),
            event: eventData.event,
            findings: []
        };

        // Analyze gas usage
        const averageGas = calculateAverageGas(currentLog.events, eventData.event);
        const gasDeviation = (parseInt(eventData.gasUsed) - averageGas) / averageGas;
        
        if (Math.abs(gasDeviation) > 0.2) {
            analysis.findings.push({
                type: "gas",
                severity: "warning",
                message: `Unusual gas usage: ${gasDeviation > 0 ? "higher" : "lower"} than average by ${Math.abs(gasDeviation * 100).toFixed(1)}%`
            });
        }

        // Analyze event frequency
        const eventCount = currentLog.events.filter(e => e.event === eventData.event).length;
        const timeWindow = 3600; // 1 hour in seconds
        const recentEvents = currentLog.events.filter(e => {
            const eventTime = new Date(e.timestamp).getTime();
            const now = Date.now();
            return e.event === eventData.event && (now - eventTime) / 1000 <= timeWindow;
        });

        if (recentEvents.length > 10) { // More than 10 events per hour
            analysis.findings.push({
                type: "frequency",
                severity: "info",
                message: `High event frequency: ${recentEvents.length} events in the last hour`
            });
        }

        // Log analysis if there are findings
        if (analysis.findings.length > 0) {
            console.log("\nEvent Analysis:");
            console.log("---------------");
            analysis.findings.forEach(finding => {
                const severity = finding.severity === "warning" ? "\x1b[33m" : "\x1b[36m";
                console.log(`${severity}${finding.severity.toUpperCase()}\x1b[0m: ${finding.message}`);
            });
            console.log("---------------\n");

            // Save analysis to file
            const analysisDir = path.join(__dirname, "../reports/event-analysis");
            if (!fs.existsSync(analysisDir)) {
                fs.mkdirSync(analysisDir, { recursive: true });
            }
            
            const analysisPath = path.join(analysisDir, `analysis-${Date.now()}.json`);
            fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
        }

    } catch (error) {
        console.error("Error analyzing event:", error.message);
    }
}

function calculateAverageGas(events, eventName) {
    const relevantEvents = events.filter(e => e.event === eventName);
    if (relevantEvents.length === 0) return 0;
    
    const totalGas = relevantEvents.reduce((sum, event) => sum + parseInt(event.gasUsed), 0);
    return totalGas / relevantEvents.length;
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
