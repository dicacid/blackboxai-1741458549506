const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk"); // You may need to install this: npm install chalk

async function main() {
  console.log(chalk.blue("\n🔍 Starting testnet deployment verification...\n"));

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments", network.name, "deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment info not found at ${deploymentPath}. Please run deploy-testnet.js first.`);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log(chalk.gray("Loaded deployment info for network:"), chalk.yellow(deploymentInfo.network));

  // Get contract factories
  const CryptixTicket = await ethers.getContractFactory("CryptixTicket");
  const CryptixMultiSig = await ethers.getContractFactory("CryptixMultiSig");
  const CryptixMarketplace = await ethers.getContractFactory("CryptixMarketplace");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(chalk.gray("Testing with account:"), chalk.yellow(deployer.address));

  try {
    console.log(chalk.blue("\n📋 Verifying Contract Deployments...\n"));

    // Attach to deployed contracts
    const ticket = CryptixTicket.attach(deploymentInfo.contracts.CryptixTicket.address);
    const multiSig = CryptixMultiSig.attach(deploymentInfo.contracts.CryptixMultiSig.address);
    const marketplace = CryptixMarketplace.attach(deploymentInfo.contracts.CryptixMarketplace.address);

    // Test CryptixTicket
    console.log(chalk.cyan("Testing CryptixTicket..."));
    const ticketOwner = await ticket.owner();
    console.log("- Owner:", ticketOwner);
    if (ticketOwner !== multiSig.address) {
      throw new Error("CryptixTicket owner should be the MultiSig contract");
    }
    console.log(chalk.green("✓ CryptixTicket ownership verified"));

    // Test CryptixMultiSig
    console.log(chalk.cyan("\nTesting CryptixMultiSig..."));
    const requiredConfirmations = await multiSig.requiredConfirmations();
    console.log("- Required confirmations:", requiredConfirmations.toString());
    const owners = await multiSig.getOwners();
    console.log("- Owners:", owners);
    if (requiredConfirmations.toString() !== "2") {
      throw new Error("MultiSig should require 2 confirmations");
    }
    console.log(chalk.green("✓ CryptixMultiSig configuration verified"));

    // Test CryptixMarketplace
    console.log(chalk.cyan("\nTesting CryptixMarketplace..."));
    const marketplaceTicketContract = await marketplace.ticketContract();
    const marketplaceMultiSigContract = await marketplace.multiSigContract();
    console.log("- Ticket contract:", marketplaceTicketContract);
    console.log("- MultiSig contract:", marketplaceMultiSigContract);
    if (marketplaceTicketContract !== ticket.address) {
      throw new Error("Marketplace ticket contract address mismatch");
    }
    if (marketplaceMultiSigContract !== multiSig.address) {
      throw new Error("Marketplace multisig contract address mismatch");
    }
    console.log(chalk.green("✓ CryptixMarketplace configuration verified"));

    // Test permissions
    console.log(chalk.cyan("\nTesting Permissions..."));
    const MARKETPLACE_ROLE = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("MARKETPLACE_ROLE")
    );
    const hasRole = await ticket.hasRole(MARKETPLACE_ROLE, marketplace.address);
    console.log("- Marketplace has MARKETPLACE_ROLE:", hasRole);
    if (!hasRole) {
      throw new Error("Marketplace should have MARKETPLACE_ROLE");
    }
    console.log(chalk.green("✓ Permissions verified"));

    // Test basic functionality
    console.log(chalk.cyan("\nTesting Basic Functionality..."));

    // Create a test event
    console.log("- Creating test event...");
    const eventPrice = ethers.utils.parseEther("0.1");
    const eventCapacity = 100;
    const createEventTx = await marketplace.createEvent(
      "Test Event",
      "TEST",
      eventPrice,
      eventCapacity,
      Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
    );
    await createEventTx.wait();
    console.log(chalk.green("✓ Test event created"));

    // Get event details
    const eventId = 1; // First event should have ID 1
    const event = await marketplace.getEvent(eventId);
    console.log("- Event details:", {
      name: event.name,
      symbol: event.symbol,
      price: ethers.utils.formatEther(event.price),
      capacity: event.capacity.toString(),
      timestamp: new Date(event.timestamp.toNumber() * 1000).toISOString()
    });

    // Test event query
    const totalEvents = await marketplace.getTotalEvents();
    console.log("- Total events:", totalEvents.toString());
    if (totalEvents.toString() !== "1") {
      throw new Error("Should have exactly one event");
    }
    console.log(chalk.green("✓ Event queries working"));

    console.log(chalk.blue("\n🎉 All tests passed! Deployment verified successfully!\n"));

    // Print deployment summary
    console.log(chalk.cyan("Deployment Summary:"));
    console.log(chalk.gray("Network:"), chalk.yellow(deploymentInfo.network));
    console.log(chalk.gray("Chain ID:"), chalk.yellow(deploymentInfo.chainId));
    console.log(chalk.gray("Contracts:"));
    console.log("- CryptixTicket:", chalk.yellow(ticket.address));
    console.log("- CryptixMultiSig:", chalk.yellow(multiSig.address));
    console.log("- CryptixMarketplace:", chalk.yellow(marketplace.address));
    
    const blockExplorer = network.config.blockExplorerUrls?.[0] || "";
    if (blockExplorer) {
      console.log(chalk.cyan("\nBlock Explorer Links:"));
      console.log("- CryptixTicket:", chalk.blue(`${blockExplorer}/address/${ticket.address}`));
      console.log("- CryptixMultiSig:", chalk.blue(`${blockExplorer}/address/${multiSig.address}`));
      console.log("- CryptixMarketplace:", chalk.blue(`${blockExplorer}/address/${marketplace.address}`));
    }

  } catch (error) {
    console.error(chalk.red("\n❌ Test failed:"), error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
