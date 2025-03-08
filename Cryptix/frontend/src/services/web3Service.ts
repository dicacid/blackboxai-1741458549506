import { ethers } from 'ethers';
import type { Web3Provider, Network } from '@ethersproject/providers';

interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: 18;
  };
}

export class Web3Service {
  private static instance: Web3Service;
  private provider: Web3Provider | null = null;
  private contracts: Map<string, ethers.Contract> = new Map();

  private networks: { [key: string]: NetworkConfig } = {
    sepolia: {
      chainId: 11155111,
      name: 'Sepolia',
      rpcUrl: process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      explorerUrl: 'https://sepolia.etherscan.io',
      nativeCurrency: {
        name: 'Sepolia Ether',
        symbol: 'ETH',
        decimals: 18
      }
    },
    goerli: {
      chainId: 5,
      name: 'Goerli',
      rpcUrl: process.env.REACT_APP_GOERLI_RPC_URL || 'https://rpc.goerli.mudit.blog',
      explorerUrl: 'https://goerli.etherscan.io',
      nativeCurrency: {
        name: 'Goerli Ether',
        symbol: 'ETH',
        decimals: 18
      }
    }
  };

  private constructor() {}

  public static getInstance(): Web3Service {
    if (!Web3Service.instance) {
      Web3Service.instance = new Web3Service();
    }
    return Web3Service.instance;
  }

  public setProvider(provider: Web3Provider) {
    this.provider = provider;
  }

  public async initializeProvider(): Promise<void> {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        this.provider = provider;
      } catch (error) {
        console.error('Failed to initialize provider:', error);
        throw new Error('Failed to connect to wallet');
      }
    } else {
      throw new Error('No Web3 provider found. Please install MetaMask.');
    }
  }

  public async loadContracts(deploymentInfo: any): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const signer = this.provider.getSigner();
      
      // Load each contract from deployment info
      for (const [name, info] of Object.entries(deploymentInfo.contracts)) {
        const contractInfo = info as { address: string; abi: any };
        const contract = new ethers.Contract(
          contractInfo.address,
          contractInfo.abi,
          signer
        );
        this.contracts.set(name, contract);
      }
    } catch (error) {
      console.error('Failed to load contracts:', error);
      throw new Error('Failed to initialize contracts');
    }
  }

  public getContract(name: string): ethers.Contract {
    const contract = this.contracts.get(name);
    if (!contract) {
      throw new Error(`Contract ${name} not found`);
    }
    return contract;
  }

  public async ensureCorrectNetwork(targetNetwork: string): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const network = await this.provider.getNetwork();
    const targetConfig = this.networks[targetNetwork];

    if (!targetConfig) {
      throw new Error(`Network configuration for ${targetNetwork} not found`);
    }

    if (network.chainId !== targetConfig.chainId) {
      try {
        await this.switchNetwork(targetConfig);
      } catch (error: any) {
        if (error.code === 4902) {
          await this.addNetwork(targetConfig);
        } else {
          throw error;
        }
      }
    }
  }

  private async switchNetwork(networkConfig: NetworkConfig): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    await this.provider.send('wallet_switchEthereumChain', [
      { chainId: `0x${networkConfig.chainId.toString(16)}` }
    ]);
  }

  private async addNetwork(networkConfig: NetworkConfig): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    await this.provider.send('wallet_addEthereumChain', [{
      chainId: `0x${networkConfig.chainId.toString(16)}`,
      chainName: networkConfig.name,
      nativeCurrency: networkConfig.nativeCurrency,
      rpcUrls: [networkConfig.rpcUrl],
      blockExplorerUrls: [networkConfig.explorerUrl]
    }]);
  }

  public async deposit(amount: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const signer = this.provider.getSigner();
      const tx = await signer.sendTransaction({
        to: process.env.REACT_APP_PLATFORM_ADDRESS,
        value: ethers.utils.parseEther(amount),
      });

      return tx.hash;
    } catch (error) {
      console.error('Deposit error:', error);
      throw new Error('Failed to deposit ETH');
    }
  }

  public async transfer(to: string, amount: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const signer = this.provider.getSigner();
      const tx = await signer.sendTransaction({
        to,
        value: ethers.utils.parseEther(amount),
      });

      return tx.hash;
    } catch (error) {
      console.error('Transfer error:', error);
      throw new Error('Failed to transfer ETH');
    }
  }

  public async getGasPrice(): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const gasPrice = await this.provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  }

  public async estimateGas(to: string, amount: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const signer = this.provider.getSigner();
    const from = await signer.getAddress();
    
    const estimate = await this.provider.estimateGas({
      from,
      to,
      value: ethers.utils.parseEther(amount),
    });

    return estimate.toString();
  }

  public async waitForTransaction(hash: string, confirmations: number = 1): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    await this.provider.waitForTransaction(hash, confirmations);
  }

  public async getTransactionReceipt(hash: string) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    return await this.provider.getTransactionReceipt(hash);
  }

  public async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const balance = await this.provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  }

  public async getNetwork(): Promise<Network> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    return await this.provider.getNetwork();
  }

  public getExplorerUrl(hash: string, type: 'address' | 'tx'): string {
    const network = this.networks[process.env.REACT_APP_NETWORK || 'sepolia'];
    return `${network.explorerUrl}/${type}/${hash}`;
  }

  public isValidAddress(address: string): boolean {
    try {
      return ethers.utils.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  public shortenAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  public async signMessage(message: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const signer = this.provider.getSigner();
    return await signer.signMessage(message);
  }

  public verifyMessage(message: string, signature: string): string {
    return ethers.utils.verifyMessage(message, signature);
  }

  public formatEther(value: string): string {
    return ethers.utils.formatEther(value);
  }

  public parseEther(value: string): string {
    return ethers.utils.parseEther(value).toString();
  }

  public async getChainId(): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const network = await this.provider.getNetwork();
    return network.chainId;
  }

  public async addToken(
    address: string,
    symbol: string,
    decimals: number,
    image?: string
  ): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    await this.provider.send('wallet_watchAsset', [{
      type: 'ERC20',
      options: {
        address,
        symbol,
        decimals,
        image,
      },
    }]);
  }

  public async requestAccounts(): Promise<string[]> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    return await this.provider.send('eth_requestAccounts', []);
  }

  public async getCode(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    return await this.provider.getCode(address);
  }

  public async isContract(address: string): Promise<boolean> {
    const code = await this.getCode(address);
    return code !== '0x';
  }

  public async listenToEvents(
    contractName: string,
    eventName: string,
    callback: (...args: any[]) => void
  ): Promise<void> {
    const contract = this.getContract(contractName);
    contract.on(eventName, callback);
  }

  public async stopListeningToEvents(
    contractName: string,
    eventName: string,
    callback: (...args: any[]) => void
  ): Promise<void> {
    const contract = this.getContract(contractName);
    contract.off(eventName, callback);
  }
}

export default Web3Service.getInstance();
