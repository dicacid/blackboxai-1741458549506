import { ethers } from 'ethers';
import type {
  Transaction,
  NetworkInfo,
  ApiError,
  SmartContractInteraction,
  Web3State
} from '../types';

/**
 * Custom error class for Web3 related errors
 */
export class Web3Error extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'Web3Error';
    this.code = code;
    this.details = details;
  }
}

/**
 * Shortens an Ethereum address to a more readable format
 * @param address The full Ethereum address
 * @param chars Number of characters to show at start and end
 * @returns Shortened address with ellipsis
 * @throws {Web3Error} If the address is invalid
 */
export const shortenAddress = (address: string, chars = 4): string => {
  try {
    if (!address) {
      throw new Web3Error('Address is required', 'INVALID_ADDRESS');
    }
    if (!ethers.utils.isAddress(address)) {
      throw new Web3Error('Invalid Ethereum address', 'INVALID_ADDRESS', { address });
    }
    return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
  } catch (error) {
    if (error instanceof Web3Error) throw error;
    throw new Web3Error('Error shortening address', 'ADDRESS_ERROR', { error });
  }
};

/**
 * Formats an amount of wei to a human-readable format
 * @param amount Amount in wei
 * @param decimals Number of decimals
 * @param displayDecimals Number of decimals to display
 * @returns Formatted amount
 */
export const formatAmount = (
  amount: string | number,
  decimals = 18,
  displayDecimals = 4
): string => {
  try {
    const formatted = ethers.utils.formatUnits(amount.toString(), decimals);
    return parseFloat(formatted).toFixed(displayDecimals);
  } catch (error) {
    console.error('Error formatting amount:', error);
    throw new Web3Error('Error formatting amount', 'FORMAT_ERROR', {
      amount,
      decimals,
      error
    });
  }
};

/**
 * Parses a human-readable amount to wei
 * @param amount Amount in ETH
 * @param decimals Number of decimals
 * @returns Amount in wei
 */
export const parseAmount = (amount: string, decimals = 18): string => {
  try {
    return ethers.utils.parseUnits(amount, decimals).toString();
  } catch (error) {
    console.error('Error parsing amount:', error);
    throw new Web3Error('Error parsing amount', 'PARSE_ERROR', {
      amount,
      decimals,
      error
    });
  }
};

/**
 * Checks if a string is a valid Ethereum address
 * @param address Address to validate
 * @returns Boolean indicating if address is valid
 */
export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
};

/**
 * Gets the network information from chainId
 * @param chainId Chain ID
 * @returns Network information
 */
export const getNetworkInfo = (chainId: number): NetworkInfo => {
  const networks: Record<number, NetworkInfo> = {
    1: {
      name: 'Ethereum Mainnet',
      chainId: 1,
      explorer: 'https://etherscan.io',
      ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
    },
    3: {
      name: 'Ropsten',
      chainId: 3,
      explorer: 'https://ropsten.etherscan.io'
    },
    4: {
      name: 'Rinkeby',
      chainId: 4,
      explorer: 'https://rinkeby.etherscan.io'
    },
    5: {
      name: 'Goerli',
      chainId: 5,
      explorer: 'https://goerli.etherscan.io'
    },
    42: {
      name: 'Kovan',
      chainId: 42,
      explorer: 'https://kovan.etherscan.io'
    },
    56: {
      name: 'BSC Mainnet',
      chainId: 56,
      explorer: 'https://bscscan.com'
    },
    137: {
      name: 'Polygon Mainnet',
      chainId: 137,
      explorer: 'https://polygonscan.com'
    },
    80001: {
      name: 'Polygon Mumbai',
      chainId: 80001,
      explorer: 'https://mumbai.polygonscan.com'
    }
  };

  const network = networks[chainId];
  if (!network) {
    throw new Web3Error('Unknown network', 'UNKNOWN_NETWORK', { chainId });
  }
  return network;
};

/**
 * Checks if MetaMask is installed
 * @returns Boolean indicating if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  const { ethereum } = window as any;
  return Boolean(ethereum && ethereum.isMetaMask);
};

/**
 * Gets the current gas price
 * @param provider Ethers provider
 * @returns Gas price in gwei
 */
export const getGasPrice = async (
  provider: ethers.providers.Provider
): Promise<string> => {
  try {
    const gasPrice = await provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  } catch (error) {
    console.error('Error getting gas price:', error);
    throw new Web3Error('Error getting gas price', 'GAS_PRICE_ERROR', { error });
  }
};

/**
 * Estimates gas for a transaction
 * @param transaction Transaction object
 * @param provider Ethers provider
 * @returns Estimated gas limit
 */
export const estimateGas = async (
  transaction: ethers.providers.TransactionRequest,
  provider: ethers.providers.Provider
): Promise<string> => {
  try {
    const estimate = await provider.estimateGas(transaction);
    return estimate.toString();
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw new Web3Error('Error estimating gas', 'GAS_ESTIMATE_ERROR', {
      transaction,
      error
    });
  }
};

/**
 * Signs a message using personal_sign
 * @param message Message to sign
 * @param signer Ethers signer
 * @returns Signature
 */
export const signMessage = async (
  message: string,
  signer: ethers.Signer
): Promise<string> => {
  try {
    return await signer.signMessage(message);
  } catch (error) {
    console.error('Error signing message:', error);
    throw new Web3Error('Error signing message', 'SIGN_ERROR', {
      message,
      error
    });
  }
};

/**
 * Verifies a signed message
 * @param message Original message
 * @param signature Signature
 * @param address Signer's address
 * @returns Boolean indicating if signature is valid
 */
export const verifyMessage = (
  message: string,
  signature: string,
  address: string
): boolean => {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying message:', error);
    throw new Web3Error('Error verifying message', 'VERIFY_ERROR', {
      message,
      signature,
      address,
      error
    });
  }
};

/**
 * Formats a transaction for display
 * @param tx Transaction object
 * @returns Formatted transaction
 */
export const formatTransaction = (tx: Transaction): Transaction => {
  return {
    ...tx,
    value: formatAmount(tx.value),
    gasPrice: tx.gasPrice ? formatAmount(tx.gasPrice, 9) : undefined // Convert from wei to gwei
  };
};

/**
 * Prepares a smart contract interaction
 * @param interaction Smart contract interaction details
 * @param signer Ethers signer
 * @returns Prepared transaction
 */
export const prepareContractInteraction = async (
  interaction: SmartContractInteraction,
  signer: ethers.Signer
): Promise<ethers.providers.TransactionRequest> => {
  try {
    const contract = new ethers.Contract(
      interaction.contract,
      ['function ' + interaction.method],
      signer
    );

    const tx = await contract.populateTransaction[interaction.method](
      ...interaction.params
    );

    return {
      ...tx,
      value: interaction.value ? ethers.utils.parseEther(interaction.value) : undefined,
      gasLimit: interaction.gasLimit
    };
  } catch (error) {
    console.error('Error preparing contract interaction:', error);
    throw new Web3Error('Error preparing contract interaction', 'CONTRACT_ERROR', {
      interaction,
      error
    });
  }
};

/**
 * Converts an error to an ApiError
 * @param error Error object
 * @returns ApiError
 */
export const toApiError = (error: any): ApiError => {
  if (error instanceof Web3Error) {
    return {
      code: error.code,
      message: error.message,
      details: error.details
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    details: error
  };
};
