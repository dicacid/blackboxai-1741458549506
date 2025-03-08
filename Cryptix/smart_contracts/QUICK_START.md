# Cryptix Testnet Quick Start Guide

This guide will help you quickly set up and deploy the Cryptix smart contracts to a testnet.

## 1. Install Dependencies

```bash
cd smart_contracts
npm install
```

## 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Required environment variables:
```env
# Get from Alchemy/Infura
SEPOLIA_URL=https://eth-sepolia.alchemyapi.io/v2/your-api-key

# Your wallet's private key (from MetaMask)
PRIVATE_KEY=your-private-key-here

# Get from Etherscan
ETHERSCAN_API_KEY=your-etherscan-api-key

# Enable contract verification
VERIFY_CONTRACTS=true
```

## 3. Verify Setup

Run the setup verification script:
```bash
npm run setup:testnet
```

This will check:
- Environment variables
- Network connection
- Wallet balance
- Gas prices
- Deployment costs

## 4. Get Testnet ETH

If you need testnet ETH, use these faucets:

### Sepolia Testnet
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://infura.io/faucet/sepolia)
- [Chainlink Faucets](https://faucets.chain.link/)

### Goerli Testnet
- [Goerli Faucet](https://goerlifaucet.com/)
- [Chainlink Faucets](https://faucets.chain.link/goerli)

## 5. Deploy Contracts

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# OR deploy to Goerli
npm run deploy:goerli
```

## 6. Verify Deployment

```bash
# Verify Sepolia deployment
npm run verify:sepolia

# OR verify Goerli deployment
npm run verify:goerli
```

## 7. View Deployment Info

After successful deployment, you can find deployment information in:
- `deployments/[network]/deployment.json`
- `frontend/src/contracts/deployment-[network].json`

## Troubleshooting

### Common Issues

1. "Invalid nonce" or "Transaction underpriced"
   ```bash
   # Clear transaction queue
   npm run clean:transactions
   ```

2. "Insufficient funds"
   - Request more testnet ETH from faucets
   - Wait for faucet cooldown to expire

3. "Contract verification failed"
   - Wait a few more blocks
   - Try manual verification:
     ```bash
     npx hardhat verify --network sepolia CONTRACT_ADDRESS CONSTRUCTOR_ARGS
     ```

### Getting Help

1. Check the detailed [TESTNET_DEPLOYMENT.md](./TESTNET_DEPLOYMENT.md) guide
2. Review deployment logs in `logs/deployment-[timestamp].log`
3. Check contract status on [Sepolia Explorer](https://sepolia.etherscan.io)

## Next Steps

1. Test deployed contracts using the frontend
2. Monitor contract events
3. Test all contract functions
4. Share deployment addresses with team

For detailed information, see [TESTNET_DEPLOYMENT.md](./TESTNET_DEPLOYMENT.md).
