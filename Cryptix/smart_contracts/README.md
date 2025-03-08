# Cryptix Smart Contracts

Smart contract implementation for the Cryptix Festival Ticketing Platform.

## Overview

The Cryptix smart contracts consist of three main components:
- CryptixTicket: NFT-based ticket management (ERC721)
- CryptixMultiSig: Platform governance and security
- CryptixMarketplace: Secondary market control

## Features

- NFT-based ticket issuance and management
- Multi-signature wallet for platform governance
- Controlled resale marketplace
- Anti-fraud mechanisms
- Automated price optimization
- Role-based access control
- Blacklist system

## Prerequisites

- Node.js v14 or later
- npm v6 or later
- An Ethereum wallet with testnet ETH (for deployment)
- API keys for:
  - Alchemy or Infura (RPC access)
  - Etherscan (contract verification)

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up environment:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Compile contracts:
```bash
npm run compile
```

4. Run tests:
```bash
npm test
```

## Development

### Local Development

1. Start local node:
```bash
npm run node
```

2. Deploy locally:
```bash
npm run deploy:local
```

### Testing

```bash
# Run all tests
npm test

# Run with gas reporting
REPORT_GAS=true npm test

# Generate coverage report
npm run test:coverage
```

## Testnet Deployment

### 1. Configure Environment

Edit `.env` with your credentials:
```env
# Network URLs
SEPOLIA_URL=https://eth-sepolia.alchemyapi.io/v2/your-api-key
GOERLI_URL=https://eth-goerli.alchemyapi.io/v2/your-api-key

# Your wallet's private key
PRIVATE_KEY=your-private-key-here

# API Keys
ETHERSCAN_API_KEY=your-etherscan-api-key

# Deployment Settings
VERIFY_CONTRACTS=true
DEPLOY_NETWORK=sepolia
```

### 2. Get Testnet ETH

Obtain testnet ETH from faucets:
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://infura.io/faucet/sepolia)
- [Chainlink Faucets](https://faucets.chain.link/)

### 3. Deploy to Testnet

Deploy to Sepolia:
```bash
npm run deploy:sepolia
```

Or deploy to Goerli:
```bash
npm run deploy:goerli
```

### 4. Verify Deployment

Run deployment verification:
```bash
# For Sepolia
npm run verify:sepolia

# For Goerli
npm run verify:goerli
```

See [TESTNET_DEPLOYMENT.md](./TESTNET_DEPLOYMENT.md) for detailed deployment instructions.

## Contract Addresses

### Sepolia Testnet
Deployment information is stored in:
- `deployments/sepolia/deployment.json`
- `frontend/src/contracts/deployment-sepolia.json`

### Goerli Testnet
Deployment information is stored in:
- `deployments/goerli/deployment.json`
- `frontend/src/contracts/deployment-goerli.json`

## Scripts

### Development
- `npm run compile` - Compile contracts
- `npm test` - Run tests
- `npm run test:coverage` - Generate coverage report
- `npm run node` - Start local hardhat node
- `npm run clean` - Clean build files

### Deployment
- `npm run deploy:local` - Deploy to local network
- `npm run deploy:sepolia` - Deploy to Sepolia testnet
- `npm run deploy:goerli` - Deploy to Goerli testnet

### Verification
- `npm run verify:sepolia` - Verify Sepolia deployment
- `npm run verify:goerli` - Verify Goerli deployment

### Utilities
- `npm run accounts` - List available accounts
- `npm run flatten` - Flatten contracts
- `npm run size` - Check contract sizes

## Contract Security

### Access Control
- Role-based access control for all sensitive operations
- Multi-signature requirement for critical functions
- Time-locked operations for major updates

### Anti-Fraud Measures
- Price manipulation prevention
- Transaction rate limiting
- Blacklist system for suspicious addresses
- Real-time fraud detection integration

### Best Practices
- OpenZeppelin contracts for standard implementations
- Comprehensive test coverage
- External audit recommendations implemented
- Gas optimization

## Architecture

### CryptixTicket (ERC721)
- NFT-based ticket implementation
- Metadata management
- Transfer restrictions
- Role-based permissions

### CryptixMultiSig
- Multi-signature wallet implementation
- Owner management
- Transaction proposal and execution
- Time-locked operations

### CryptixMarketplace
- Secondary market control
- Price controls
- Fee management
- Transfer validation

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## Testing Guide

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Gas Analysis
```bash
REPORT_GAS=true npm test
```

## Troubleshooting

### Common Issues

1. Deployment Failures
   - Check network connection
   - Verify wallet balance
   - Confirm gas settings

2. Verification Failures
   - Wait for more block confirmations
   - Check Etherscan API key
   - Verify constructor arguments

3. Transaction Errors
   - Check gas price settings
   - Verify network congestion
   - Confirm account permissions

## Support

- [Documentation](./docs)
- [Issue Tracker](https://github.com/your-org/cryptix/issues)
- [Discord Community](https://discord.gg/cryptix)

## License

MIT
