import { ENS_CACHE, ENS_CACHE_TTL, MAINNET_RPC_URLS } from "../constants.js";
import { Identity } from "../identity";
import { ethers } from 'ethers';

  


export interface DelegationInfo {
    signature: string;
    externalAddress: string;
    qakuIdentity: string;
    expiresAt: number;
}
  
export class ExternalWallet {
    private walletProvider: ethers.BrowserProvider | undefined;
    private _mainnetProvider: ethers.JsonRpcProvider | null = null;
    private qakuIdentity: Identity;
    private delegationInfo: DelegationInfo | null;
    private storageKey: string;
    private defaultTtl: number; // in seconds

    public externalAddress: string | null;

  
    /**
     * @param walletProvider - The external wallet provider instance (e.g., Metamask).
     * @param qakuIdentity - The internal wallet address associated with Qaku.
     * @param defaultTtl - The default time-to-live for the delegation in seconds.
     */
    constructor(walletProvider: ethers.BrowserProvider | undefined, qakuIdentity: Identity, defaultTtl = 1000*60*60*24*7) {
      this.walletProvider = walletProvider;
      this.qakuIdentity = qakuIdentity;
      this.externalAddress = null;
      this.delegationInfo = null;
      this.storageKey = `delegation-info-${qakuIdentity.address()}`;
      this.defaultTtl = defaultTtl;
  
      // Load delegation info from localStorage
      this.loadDelegationInfo();
    }
  
    /**
     * Initializes the external wallet address by retrieving it from the wallet provider.
     */
    public async initExternalAddress(): Promise<void> {
      if (!this.walletProvider) throw new Error("Wallet provider not initialized")
      try {
        const accounts = await this.walletProvider.send('eth_accounts', []);
        if (accounts.length > 0) {
          this.externalAddress = accounts[0];
        } else {
          throw new Error('No accounts found in the wallet provider.');
        }
      } catch (error) {
        console.error('Failed to initialize external wallet address:', error);
        throw error;
      }
    }

    private getMessage(qakuIdentity: string, externalAddress: string, expiresAt: number) {
        const message = `Signing for Qaku identity: ${qakuIdentity} with external address: ${externalAddress} until ${new Date(expiresAt).toUTCString()}`;
        return message
    }
  
    /**
     * Requests a signature for a predefined message containing the external wallet address and the Qaku identity.
     * @param ttl - The time-to-live for the delegation in seconds. Defaults to the class defaultTtl.
     */
    public async requestSignature(ttl = this.defaultTtl): Promise<void> {
      if (!this.walletProvider) throw new Error("Wallet provider not initialized")

      if (!this.externalAddress) {
        throw new Error('External wallet address is not initialized.');
      }
  
      const expiresAt = Date.now() + ttl;

      const message = this.getMessage(this.qakuIdentity.address(), this.externalAddress, expiresAt)
      try {
        
        const signer = await this.walletProvider.getSigner()
        const signature = await signer.signMessage(message)
  
        this.delegationInfo = {
          signature,
          externalAddress: this.externalAddress,
          qakuIdentity: this.qakuIdentity.address(),
          expiresAt,
        };
  
        // Store delegation info in localStorage
        this.saveDelegationInfo();
      } catch (error) {
        console.error('Failed to request signature:', error);
        throw error;
      }
    }

    public async verifyDelegationInfo(delegationInfo: DelegationInfo): Promise<string | null> {
    try {
        const message = this.getMessage(delegationInfo.qakuIdentity, delegationInfo.externalAddress, delegationInfo.expiresAt)
          const recoveredAddress = ethers.verifyMessage(message, delegationInfo.signature);
        if (recoveredAddress.toLowerCase() === delegationInfo.externalAddress.toLowerCase()) {
            return recoveredAddress;
        } else {
            console.error('Recovered address does not match the external address');
        return null;
        }
    } catch (error) {
        console.error('Error verifying delegation info:', error);
        return null;
    }
    }
  
    /**
     * Retrieves the delegation information, including the signature and the data used for signing.
     * @returns The delegation information or null if not available or expired.
     */
    public getDelegationInfo(): DelegationInfo | null {
      if (this.delegationInfo && this.delegationInfo.expiresAt > Date.now()) {
        return this.delegationInfo;
      } else {
        this.delegationInfo = null;
        this.clearDelegationInfo();
        return null;
      }
    }

      /**
   * Get a dedicated Ethereum mainnet provider for ENS resolution
   * This provider always connects to mainnet regardless of wallet network
   * @returns ethers.JsonRpcProvider connected to Ethereum mainnet
   */
    public getMainnetProvider(): ethers.JsonRpcProvider {
        if (!this._mainnetProvider) {
        for (let i = 0; i < MAINNET_RPC_URLS.length; i++) {
            try {
            this._mainnetProvider = new ethers.JsonRpcProvider(MAINNET_RPC_URLS[i]);
            console.log(`Connected to mainnet using provider ${i+1}`);
            break;
            } catch (error) {
            console.error(`Failed to connect to mainnet provider ${i+1}:`, error);
            }
        }
        
        if (!this._mainnetProvider) {
            console.warn("All mainnet providers failed, using first provider anyway");
            this._mainnetProvider = new ethers.JsonRpcProvider(MAINNET_RPC_URLS[0]);
        }
        }
        return this._mainnetProvider;
    }

    public async getName(addr?: string): Promise<string | null> {
        if (!this.walletProvider) throw new Error("Wallet provider not initialized")

        if (!addr) addr = this.externalAddress || undefined
        if (!addr) return null


        const normalizedAddress = addr.toLowerCase();
        let ensResult = addr
      
        // Check cache first
        const cached = ENS_CACHE.get(normalizedAddress);
        if (cached && (Date.now() - cached.timestamp < ENS_CACHE_TTL)) {
            console.log(`Using cached ENS for ${normalizedAddress}: ${cached.name || "No ENS found"}`);
            return cached.name;
        }

        // Use dedicated mainnet provider for ENS resolution
        try {
            const provider = this.getMainnetProvider();
            const ensName = await provider.lookupAddress(normalizedAddress);
            if (ensName) {
                ensResult = ensName
                ENS_CACHE.set(normalizedAddress, { 
                name: ensName, 
                timestamp: Date.now() 
                });

            }
        } catch (providerError) {
            console.error("Error with primary provider:", providerError);
        }

        return ensResult
    }
  
    /**
     * Loads delegation info from localStorage.
     */
    private loadDelegationInfo(): void {
      try {
        const storedInfo = localStorage.getItem(this.storageKey);
        if (storedInfo) {
          this.delegationInfo = JSON.parse(storedInfo);
          if (this.delegationInfo && this.delegationInfo.expiresAt <= Date.now()) {
            this.delegationInfo = null;
            this.clearDelegationInfo();
          }
        }
      } catch (error) {
        console.error('Failed to load delegation info from localStorage:', error);
      }
    }
  
    /**
     * Saves delegation info to localStorage.
     */
    private saveDelegationInfo(): void {
      try {
        if (this.delegationInfo) {
          localStorage.setItem(this.storageKey, JSON.stringify(this.delegationInfo));
        }
      } catch (error) {
        console.error('Failed to save delegation info to localStorage:', error);
      }
    }
  
    /**
     * Clears delegation info from localStorage.
     */
    public clearDelegationInfo(): void {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (error) {
        console.error('Failed to clear delegation info from localStorage:', error);
      }
    }
  }
