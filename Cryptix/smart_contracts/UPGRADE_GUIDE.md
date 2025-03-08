# Cryptix Smart Contract Upgrade Guide

This guide provides detailed instructions for upgrading the Cryptix smart contracts safely and effectively.

## Overview

The Cryptix platform uses the OpenZeppelin Upgrades plugin to manage upgradeable smart contracts. This allows us to:
- Fix bugs and security issues
- Add new features
- Optimize gas usage
- Improve contract functionality

## Prerequisites

1. Environment setup:
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables
nano .env
```

Required environment variables for upgrades:
```env
# Network URLs
SEPOLIA_URL=https://eth-sepolia.alchemyapi.io/v2/your-api-key
GOERLI_URL=https://eth-goerli.alchemyapi.io/v2/your-api-key

# Deployment Account
PRIVATE_KEY=your-private-key-here

# API Keys
ETHERSCAN_API_KEY=your-etherscan-api-key

# Contract Verification
VERIFY_CONTRACTS=true
```

## Upgrade Process

### 1. Preparation

Before upgrading:

```bash
# Run all tests
npm test

# Check contract sizes
npm run analyze:size

# Analyze gas usage
npm run analyze:gas

# Validate upgrade compatibility
npm run validate:upgrade
```

### 2. Simulation

Test the upgrade in a forked environment:

```bash
# Run upgrade simulation
npm run simulate:upgrade

# Monitor network conditions
npm run monitor:network

# Clean pending transactions if needed
npm run clean:transactions
```

### 3. Validation

Verify upgrade safety:

```bash
# Validate storage layout
npm run validate:upgrade

# Check implementation compatibility
npm run upgrade:prepare
```

### 4. Deployment

Deploy the upgrade:

```bash
# Deploy to Sepolia testnet
npm run upgrade:sepolia

# OR deploy to Goerli testnet
npm run upgrade:goerli
```

### 5. Verification

After upgrade:

```bash
# Verify contract implementation
npm run upgrade:verify

# Monitor contract events
npm run monitor:events

# Test deployment
npm run test:deployment
```

## Storage Layout

When upgrading contracts, follow these rules:

1. Never remove storage variables
2. Never change variable types
3. Never change the order of storage variables
4. Always append new variables at the end
5. Use storage gaps for future-proofing

Example:
```solidity
contract CryptixTicketV1 {
    uint256 private _value;
    address private _owner;
    uint256[49] private __gap; // Storage gap for future variables
}

contract CryptixTicketV2 is CryptixTicketV1 {
    uint256 private _newValue; // Append new variables here
}
```

## Safety Checks

Before upgrading:

1. Review storage layout compatibility
2. Validate all existing functionality
3. Test new features thoroughly
4. Check gas costs implications
5. Verify upgrade safety with OpenZeppelin tools

## Monitoring

During upgrade:

1. Watch contract events
2. Monitor network status
3. Track gas prices
4. Observe user interactions
5. Check transaction confirmations

## Rollback Plan

In case of issues:

1. Stop user interactions
2. Assess the problem
3. Roll back to previous implementation
4. Notify stakeholders
5. Review and fix issues

## Scripts

### Upgrade Scripts

- `upgrade:prepare`: Prepare contracts for upgrade
- `upgrade:sepolia`: Deploy upgrade to Sepolia
- `upgrade:goerli`: Deploy upgrade to Goerli
- `upgrade:verify`: Verify upgraded contracts
- `upgrade:full`: Complete upgrade process

### Validation Scripts

- `validate:upgrade`: Check upgrade compatibility
- `simulate:upgrade`: Test upgrade in fork
- `analyze:size`: Check contract sizes
- `analyze:gas`: Analyze gas usage

### Monitoring Scripts

- `monitor:events`: Watch contract events
- `monitor:network`: Check network status
- `monitor:all`: Run all monitoring

## Common Issues

### 1. Storage Collision
```solidity
// Wrong
contract V2 {
    uint256 private _newValue; // Don't insert here
    uint256 private _value;
}

// Right
contract V2 {
    uint256 private _value;
    uint256 private _newValue; // Append here
}
```

### 2. Initialization
```solidity
// Wrong
function initialize() public {
    // Missing super call
}

// Right
function initialize() public reinitializer(2) {
    super.initialize();
    // New initialization
}
```

### 3. Implementation Contract
```solidity
// Wrong
contract Implementation {
    constructor() {
        initialize(); // Don't initialize in constructor
    }
}

// Right
contract Implementation {
    constructor() {
        _disableInitializers(); // Disable initialization
    }
}
```

## Best Practices

1. Always use the UUPS proxy pattern
2. Include storage gaps in contracts
3. Use initializer functions properly
4. Keep thorough upgrade documentation
5. Test extensively before upgrading
6. Monitor closely after upgrading
7. Have a rollback plan ready
8. Use timelock for critical upgrades
9. Maintain comprehensive test coverage
10. Document all changes clearly

## Documentation

Keep records of:
1. All upgrades performed
2. Changes in each version
3. Security considerations
4. Gas optimizations
5. New features added

## Support

If you encounter issues:
1. Check the logs in `reports/`
2. Review error messages
3. Consult deployment history
4. Examine contract state
5. Contact the development team

## References

- [OpenZeppelin Upgrades](https://docs.openzeppelin.com/upgrades)
- [Hardhat Upgrades](https://hardhat.org/plugins/hardhat-upgrades)
- [UUPS vs Transparent Proxy](https://docs.openzeppelin.com/contracts/4.x/api/proxy#transparent-vs-uups)
- [Proxy Upgrade Pattern](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies)
