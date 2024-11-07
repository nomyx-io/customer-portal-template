// EthereumProvider.ts
import { ethers } from "ethers";

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;

// Function to set the provider
export const setProvider = (_provider: ethers.BrowserProvider | null) => {
  provider = _provider;
};

// Function to get the provider
export const getProvider = () => provider;

// Function to set the signer
export const setSigner = (_signer: ethers.Signer | null) => {
  signer = _signer;
};

// Function to get the signer
export const getSigner = () => signer;

// Function to get the provider and signer, initializing them if necessary
export const getEthereumProviderAndSigner = async () => {
  if (!provider) {
    const ethObject = (window as any).ethereum;
    if (!ethObject) {
      throw new Error("Ethereum wallet not found");
    }
    provider = new ethers.BrowserProvider(ethObject);
    setProvider(provider); // Update the module-level variable
  }
  if (!signer) {
    signer = await provider.getSigner();
    setSigner(signer); // Update the module-level variable
  }
  return { provider, signer };
};
