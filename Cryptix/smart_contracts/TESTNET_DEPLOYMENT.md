# Testnet Deployment Guide

This guide will help you deploy the Cryptix smart contracts to a testnet.

## Prerequisites

1. Node.js (v14 or higher)
2. An Ethereum wallet with testnet ETH (Sepolia or Goerli)
3. Environment variables set in a `.env` file:
   - `SEPOLIA_URL`: RPC URL for Sepolia testnet
   - `GOERLI_URL`: RPC URL for Goerli testnet
   - `PRIVATE_KEY`: Private key of the wallet
   - `ETHERSCAN_API_KEY`: API key for Etherscan (optional for verification)

## Steps to Deploy

1. **Install Dependencies**
   ```bash
   cd smart_contracts
   npm install
   ```

2. **Set Up Environment Variables**
   Create a `.env` file in the `smart_contracts` directory and add the following:
   ```plaintext
   SEPOLIA_URL=<your_sepolia_rpc_url>
   GOERLI_URL=<your_goerli_rpc_url>
   PRIVATE_KEY=<your_private_key>
   ETHERSCAN_API_KEY=<your_etherscan_api_key>
   ```

3. **Verify Testnet Setup**
   Run the setup script to verify your environment:
   ```bash
   npx hardhat run scripts/setup-testnet.js --network sepolia
   ```

4. **Deploy to Testnet**
   Deploy the contracts to the testnet:
   ```bash
   npx hardhat run scripts/deploy-testnet.js --network sepolia
   ```

5. **Verify Deployment**
   After deployment, run the verification script:
   ```bash
   npx hardhat run scripts/test-testnet-deployment.js --network sepolia
   ```

## Additional Resources
- You can get testnet ETH from these faucets:
  - Alchemy Sepolia Faucet: [https://sepoliafaucet.com/](https://sepoliafaucet.com/)
  - Infura Sepolia Faucet: [https://infura.io/faucet/sepolia](https://infura.io/faucet/sepolia)
  - Goerli Faucet: [https://goerlifaucet.com/](https://goerlifaucet.com/)
  
## Troubleshooting
- Ensure that your wallet has sufficient testnet ETH for deployment.
- Check that all required environment variables are set correctly.
- If you encounter issues, refer to the logs for detailed error messages.
