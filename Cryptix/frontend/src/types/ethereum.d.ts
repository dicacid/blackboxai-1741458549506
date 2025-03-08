import { ExternalProvider } from '@ethersproject/providers';

declare global {
  interface Window {
    ethereum?: ExternalProvider & {
      isMetaMask?: boolean;
      on?: (...args: any[]) => void;
      removeListener?: (...args: any[]) => void;
      request?: (args: any) => Promise<any>;
      selectedAddress?: string;
      networkVersion?: string;
      chainId?: string;
    };
  }
}

export {};
