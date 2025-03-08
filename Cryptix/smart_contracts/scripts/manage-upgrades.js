const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const command = process.argv[2] || "status";
    
    switch (command) {
        case "status":
            await showUpgradeStatus();
            break;
        case "list":
            await listUpgrades();
            break;
        case "track":
            await trackUpgrade();
            break;
        case "verify":
            await verifyUpgradeHistory();
            break;
        case "compare":
            await compareVersions();
            break;
        default:
            console.log("\nAvailable commands:");
            console.log("- status: Show current upgrade status");
            console.log("- list: List all upgrades");
            console.log("- track: Track new upgrade");
            console.log("- verify: Verify upgrade history");
            console.log("- compare: Compare contract versions");
    }
}

async function showUpgradeStatus() {
    console.log("\n📊 Contract Upgrade Status\n");

    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}\n`);

    // Load upgrade history
    const history = loadUpgradeHistory(network.name);
    
    // Get deployment info
    const deploymentPath = path.join(__dirname, "../deployments", network.name, "deployment.json");
    if (!fs.existsSync(deploymentPath)) {
        console.log("No deployment found for this network");
        return;
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    console.log("Contract Status:");
    console.log("---------------");
    
    for (const [name, info] of Object.entries(deployment.contracts)) {
        const upgrades = history.contracts[name] || [];
        const currentVersion = info.version || "1.0.0";
        const lastUpgrade = upgrades[upgrades.length - 1];

        console.log(`\n${name}:`);
        console.log(`- Current Version: ${currentVersion}`);
        console.log(`- Address: ${info.address}`);
        console.log(`- Implementation: ${info.implementationAddress || "N/A"}`);
        console.log(`- Upgrades: ${upgrades.length}`);
        
        if (lastUpgrade) {
            console.log(`- Last Upgrade: ${new Date(lastUpgrade.timestamp).toLocaleDateString()}`);
            console.log(`- Last Version: ${lastUpgrade.version}`);
        }

        // Check implementation code
        const code = await ethers.provider.getCode(info.address);
        console.log(`- Status: ${code !== "0x" ? "✓ Active" : "❌ Not Deployed"}`);
    }
}

async function listUpgrades() {
    console.log("\n📜 Upgrade History\n");

    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}\n`);

    const history = loadUpgradeHistory(network.name);

    for (const [name, upgrades] of Object.entries(history.contracts)) {
        console.log(`\n${name}:`);
        console.log("---------------");
        
        upgrades.forEach((upgrade, index) => {
            console.log(`\nUpgrade ${index + 1}:`);
            console.log(`- Date: ${new Date(upgrade.timestamp).toLocaleString()}`);
            console.log(`- Version: ${upgrade.version}`);
            console.log(`- Implementation: ${upgrade.implementationAddress}`);
            console.log(`- Transaction: ${upgrade.transaction}`);
            
            if (upgrade.changes && upgrade.changes.length > 0) {
                console.log("- Changes:");
                upgrade.changes.forEach(change => console.log(`  • ${change}`));
            }
        });
    }
}

async function trackUpgrade() {
    console.log("\n📝 Track New Upgrade\n");

    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}\n`);

    // Load current history
    const history = loadUpgradeHistory(network.name);

    // Get deployment info
    const deploymentPath = path.join(__dirname, "../deployments", network.name, "deployment.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("No deployment found for this network");
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    // Track upgrade for each contract
    for (const [name, info] of Object.entries(deployment.contracts)) {
        if (!info.upgradeable) continue;

        console.log(`\nTracking upgrade for ${name}...`);

        const upgrade = {
            timestamp: Date.now(),
            version: info.version,
            implementationAddress: info.implementationAddress,
            transaction: info.upgradeTransaction,
            changes: info.changes || [],
            verified: info.verified || false
        };

        // Add to history
        if (!history.contracts[name]) {
            history.contracts[name] = [];
        }
        history.contracts[name].push(upgrade);

        console.log("✓ Upgrade tracked");
    }

    // Save updated history
    saveUpgradeHistory(network.name, history);
    console.log("\n✓ Upgrade history updated");
}

async function verifyUpgradeHistory() {
    console.log("\n🔍 Verifying Upgrade History\n");

    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}\n`);

    const history = loadUpgradeHistory(network.name);
    const issues = [];

    for (const [name, upgrades] of Object.entries(history.contracts)) {
        console.log(`\nVerifying ${name}...`);

        // Verify version sequence
        let previousVersion = "1.0.0";
        upgrades.forEach((upgrade, index) => {
            if (!isValidVersionSequence(previousVersion, upgrade.version)) {
                issues.push(`Invalid version sequence in ${name}: ${previousVersion} -> ${upgrade.version}`);
            }
            previousVersion = upgrade.version;
        });

        // Verify implementation addresses
        for (const upgrade of upgrades) {
            const code = await ethers.provider.getCode(upgrade.implementationAddress);
            if (code === "0x") {
                issues.push(`Implementation not found for ${name} v${upgrade.version}`);
            }
        }
    }

    if (issues.length > 0) {
        console.log("\n⚠️  Issues Found:");
        issues.forEach(issue => console.log(`- ${issue}`));
    } else {
        console.log("\n✓ All upgrades verified successfully");
    }
}

async function compareVersions() {
    console.log("\n🔄 Comparing Contract Versions\n");

    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}\n`);

    const history = loadUpgradeHistory(network.name);

    for (const [name, upgrades] of Object.entries(history.contracts)) {
        if (upgrades.length < 2) continue;

        console.log(`\n${name}:`);
        console.log("---------------");

        for (let i = 1; i < upgrades.length; i++) {
            const previous = upgrades[i - 1];
            const current = upgrades[i];

            console.log(`\nv${previous.version} -> v${current.version}:`);
            
            // Compare implementation code
            const differences = await compareImplementations(
                previous.implementationAddress,
                current.implementationAddress
            );

            if (differences.length > 0) {
                console.log("Changes:");
                differences.forEach(diff => console.log(`- ${diff}`));
            } else {
                console.log("No significant changes detected");
            }
        }
    }
}

function loadUpgradeHistory(network) {
    const historyPath = path.join(__dirname, "../upgrades", network, "history.json");
    
    if (!fs.existsSync(historyPath)) {
        return { network, contracts: {} };
    }

    return JSON.parse(fs.readFileSync(historyPath, "utf8"));
}

function saveUpgradeHistory(network, history) {
    const historyPath = path.join(__dirname, "../upgrades", network, "history.json");
    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

function isValidVersionSequence(v1, v2) {
    const [major1, minor1, patch1] = v1.split(".").map(Number);
    const [major2, minor2, patch2] = v2.split(".").map(Number);

    if (major2 < major1) return false;
    if (major2 === major1 && minor2 < minor1) return false;
    if (major2 === major1 && minor2 === minor1 && patch2 < patch1) return false;

    return true;
}

async function compareImplementations(addr1, addr2) {
    const differences = [];
    
    try {
        const code1 = await ethers.provider.getCode(addr1);
        const code2 = await ethers.provider.getCode(addr2);

        // Compare bytecode size
        const size1 = (code1.length - 2) / 2;
        const size2 = (code2.length - 2) / 2;
        differences.push(`Size changed: ${size1} -> ${size2} bytes`);

        // Compare function selectors
        const selectors1 = extractSelectors(code1);
        const selectors2 = extractSelectors(code2);

        const added = selectors2.filter(s => !selectors1.includes(s));
        const removed = selectors1.filter(s => !selectors2.includes(s));

        if (added.length > 0) {
            differences.push(`Added functions: ${added.join(", ")}`);
        }
        if (removed.length > 0) {
            differences.push(`Removed functions: ${removed.join(", ")}`);
        }

    } catch (error) {
        differences.push(`Error comparing implementations: ${error.message}`);
    }

    return differences;
}

function extractSelectors(bytecode) {
    const selectors = [];
    // Basic selector extraction - could be improved
    for (let i = 2; i < bytecode.length - 8; i += 2) {
        if (bytecode.slice(i, i + 8).match(/^63[0-9a-f]{6}/i)) {
            selectors.push(bytecode.slice(i + 2, i + 10));
        }
    }
    return selectors;
}

// Execute command
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    showUpgradeStatus,
    listUpgrades,
    trackUpgrade,
    verifyUpgradeHistory,
    compareVersions
};
