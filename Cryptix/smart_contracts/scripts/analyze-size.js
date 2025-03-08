const { ethers } = require("hardhat");
const Table = require("cli-table3");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n📏 Analyzing contract sizes...\n");

    // Compile contracts if needed
    await hre.run("compile");

    const contractNames = [
        "CryptixTicket",
        "CryptixMultiSig",
        "CryptixMarketplace"
    ];

    const table = new Table({
        head: ["Contract", "Size (bytes)", "% of Limit", "Status"],
        style: {
            head: ["cyan"],
            border: ["gray"]
        }
    });

    const SIZE_LIMIT = 24576; // Ethereum contract size limit in bytes
    const WARNING_THRESHOLD = 0.8; // 80% of limit

    const results = [];

    for (const contractName of contractNames) {
        try {
            // Get contract artifact
            const artifact = await hre.artifacts.readArtifact(contractName);
            const bytecode = artifact.bytecode;
            const deployedBytecode = artifact.deployedBytecode;

            // Calculate sizes
            const initCodeSize = bytecode.length / 2 - 1;
            const deployedSize = deployedBytecode.length / 2 - 1;
            const percentOfLimit = (deployedSize / SIZE_LIMIT) * 100;

            // Determine status
            let status;
            if (percentOfLimit >= 100) {
                status = "❌ Over Limit";
            } else if (percentOfLimit >= WARNING_THRESHOLD * 100) {
                status = "⚠️  Near Limit";
            } else {
                status = "✓ OK";
            }

            table.push([
                contractName,
                deployedSize,
                `${percentOfLimit.toFixed(1)}%`,
                status
            ]);

            results.push({
                name: contractName,
                initCodeSize,
                deployedSize,
                percentOfLimit,
                status
            });

        } catch (error) {
            console.error(`Error analyzing ${contractName}:`, error.message);
            table.push([
                contractName,
                "Error",
                "Error",
                "❌ Failed"
            ]);
        }
    }

    console.log(table.toString());

    // Generate detailed report
    const reportDir = path.join(__dirname, "../reports");
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
        timestamp: new Date().toISOString(),
        contractSizeLimit: SIZE_LIMIT,
        warningThreshold: WARNING_THRESHOLD * 100,
        results,
        recommendations: generateRecommendations(results)
    };

    const reportPath = path.join(reportDir, "size-analysis.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print recommendations
    console.log("\nRecommendations:");
    for (const rec of report.recommendations) {
        console.log(`- ${rec}`);
    }

    console.log("\nDetailed report saved to:", reportPath);

    // Check if any contract is over or near limit
    const hasIssues = results.some(r => r.percentOfLimit >= WARNING_THRESHOLD * 100);
    if (hasIssues) {
        console.log("\n⚠️  Some contracts are approaching or exceeding size limits.");
        console.log("Consider implementing the recommendations above.");
    } else {
        console.log("\n✓ All contracts are within safe size limits.");
    }
}

function generateRecommendations(results) {
    const recommendations = [];

    for (const contract of results) {
        if (contract.percentOfLimit >= 100) {
            recommendations.push(
                `${contract.name}: Must be optimized. Currently exceeds size limit by ${(contract.percentOfLimit - 100).toFixed(1)}%`
            );
        } else if (contract.percentOfLimit >= 80) {
            recommendations.push(
                `${contract.name}: Consider optimization. Using ${contract.percentOfLimit.toFixed(1)}% of size limit`
            );
        }
    }

    if (recommendations.length > 0) {
        recommendations.push(
            "General optimization tips:",
            "- Use libraries for common functionality",
            "- Remove unused functions and variables",
            "- Optimize string usage and error messages",
            "- Consider splitting large contracts into smaller ones",
            "- Use shorter variable names in non-public functions",
            "- Remove redundant checks that OpenZeppelin already provides"
        );
    }

    return recommendations;
}

// Execute analysis
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
