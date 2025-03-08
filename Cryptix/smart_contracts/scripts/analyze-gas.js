const { ethers } = require("hardhat");
const Table = require("cli-table3");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n⛽ Analyzing gas usage and deployment costs...\n");

    // Get network info
    const network = await ethers.provider.getNetwork();
    const gasPrice = await ethers.provider.getGasPrice();
    const ethPrice = await getEthPrice();

    console.log(`Network: ${network.name}`);
    console.log(`Gas Price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
    if (ethPrice) {
        console.log(`ETH Price: $${ethPrice}`);
    }
    console.log();

    const contracts = [
        "CryptixTicket",
        "CryptixMultiSig",
        "CryptixMarketplace"
    ];

    const table = new Table({
        head: ["Contract", "Deploy Gas", "Deploy Cost (ETH)", "Deploy Cost (USD)", "Avg Tx Gas"],
        style: {
            head: ["cyan"],
            border: ["gray"]
        }
    });

    const results = [];

    // Deploy test accounts for analysis
    const [deployer, account1, account2] = await ethers.getSigners();
    const testAccounts = [
        deployer.address,
        account1.address,
        account2.address
    ];

    for (const contractName of contracts) {
        try {
            console.log(`\nAnalyzing ${contractName}...`);

            // Get contract factory
            const Contract = await ethers.getContractFactory(contractName);

            // Estimate deployment gas
            let deploymentGas;
            let deployedContract;

            try {
                // Estimate based on contract type
                switch (contractName) {
                    case "CryptixTicket":
                        deploymentGas = await Contract.estimateGas.deploy();
                        deployedContract = await Contract.deploy();
                        break;

                    case "CryptixMultiSig":
                        deploymentGas = await Contract.estimateGas.deploy(testAccounts, 2);
                        deployedContract = await Contract.deploy(testAccounts, 2);
                        break;

                    case "CryptixMarketplace":
                        // Need to deploy dependencies first
                        const ticket = await (await ethers.getContractFactory("CryptixTicket")).deploy();
                        const multiSig = await (await ethers.getContractFactory("CryptixMultiSig")).deploy(testAccounts, 2);
                        
                        deploymentGas = await Contract.estimateGas.deploy(
                            ticket.address,
                            multiSig.address
                        );
                        deployedContract = await Contract.deploy(
                            ticket.address,
                            multiSig.address
                        );
                        break;
                }

                await deployedContract.deployed();

                // Calculate costs
                const deploymentCostEth = ethers.utils.formatEther(deploymentGas.mul(gasPrice));
                const deploymentCostUsd = ethPrice ? (parseFloat(deploymentCostEth) * ethPrice).toFixed(2) : "N/A";

                // Estimate average transaction gas
                const avgTxGas = await estimateAverageTransactionGas(deployedContract);

                table.push([
                    contractName,
                    deploymentGas.toString(),
                    deploymentCostEth,
                    deploymentCostUsd === "N/A" ? "N/A" : `$${deploymentCostUsd}`,
                    avgTxGas.toString()
                ]);

                results.push({
                    name: contractName,
                    deploymentGas: deploymentGas.toString(),
                    deploymentCostEth,
                    deploymentCostUsd,
                    averageTransactionGas: avgTxGas.toString()
                });

            } catch (error) {
                console.error(`Error deploying ${contractName}:`, error.message);
                table.push([
                    contractName,
                    "Error",
                    "Error",
                    "Error",
                    "Error"
                ]);
            }

        } catch (error) {
            console.error(`Error analyzing ${contractName}:`, error.message);
        }
    }

    console.log("\nGas Analysis Results:");
    console.log(table.toString());

    // Generate report
    const reportDir = path.join(__dirname, "../reports");
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
        timestamp: new Date().toISOString(),
        network: {
            name: network.name,
            chainId: network.chainId,
            gasPrice: ethers.utils.formatUnits(gasPrice, "gwei"),
            ethPrice: ethPrice || "N/A"
        },
        results,
        recommendations: generateRecommendations(results, gasPrice, ethPrice)
    };

    const reportPath = path.join(reportDir, "gas-analysis.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print recommendations
    console.log("\nRecommendations:");
    for (const rec of report.recommendations) {
        console.log(`- ${rec}`);
    }

    console.log("\nDetailed report saved to:", reportPath);
}

async function getEthPrice() {
    try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        const data = await response.json();
        return data.ethereum.usd;
    } catch (error) {
        console.warn("Could not fetch ETH price");
        return null;
    }
}

async function estimateAverageTransactionGas(contract) {
    try {
        const estimates = [];
        
        // Get all function fragments
        const functions = Object.values(contract.interface.functions);
        
        // Filter out view/pure functions
        const writeFunctions = functions.filter(f => 
            !f.constant && 
            f.stateMutability !== "view" && 
            f.stateMutability !== "pure"
        );

        for (const func of writeFunctions) {
            try {
                // Generate mock parameters based on input types
                const mockParams = func.inputs.map(input => {
                    switch (input.type) {
                        case "address":
                            return ethers.constants.AddressZero;
                        case "uint256":
                            return 1;
                        case "string":
                            return "test";
                        case "bool":
                            return false;
                        default:
                            return undefined;
                    }
                });

                // Estimate gas
                if (mockParams.every(p => p !== undefined)) {
                    const estimate = await contract.estimateGas[func.name](...mockParams);
                    estimates.push(estimate.toNumber());
                }
            } catch (error) {
                // Skip failed estimates
                continue;
            }
        }

        // Calculate average
        return estimates.length > 0
            ? Math.round(estimates.reduce((a, b) => a + b, 0) / estimates.length)
            : 0;
    } catch (error) {
        console.warn("Error estimating average transaction gas:", error.message);
        return 0;
    }
}

function generateRecommendations(results, gasPrice, ethPrice) {
    const recommendations = [];
    const highGasThreshold = 3000000; // 3M gas
    const highCostThreshold = ethPrice ? 0.1 : 0; // $0.1 or 0 if no ETH price

    for (const contract of results) {
        if (parseInt(contract.deploymentGas) > highGasThreshold) {
            recommendations.push(
                `${contract.name}: Consider optimizing deployment gas usage (currently ${contract.deploymentGas} gas)`
            );
        }

        if (ethPrice && parseFloat(contract.deploymentCostUsd) > highCostThreshold) {
            recommendations.push(
                `${contract.name}: High deployment cost ($${contract.deploymentCostUsd}). Consider deploying during low gas periods.`
            );
        }
    }

    recommendations.push(
        "General gas optimization tips:",
        "- Use smaller data types where possible (uint8, uint16, etc.)",
        "- Batch operations to reduce total gas cost",
        "- Consider using libraries for common functionality",
        "- Optimize storage usage and struct packing",
        "- Use events instead of storage for historical data",
        "- Consider implementing gas tokens for high-volume operations"
    );

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
