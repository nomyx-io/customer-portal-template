"use client";

import { ethers, parseUnits } from "ethers";

import CarbonCreditFacet from "@/abi/CarbonCreditFacet.json";
import TreasuryRegistry from "@/abi/ITreasury.json";
import MarketplaceRegistry from "@/abi/MarketplaceFacet.json";
import TradeDealRegistry from "@/abi/TradeDealFacet.json";
import USDCRegistry from "@/abi/USDC.json";
import { getProvider, getSigner } from "@/utils/ethereumProvider";

class BlockchainService {
  private static _instance: BlockchainService;

  private treasuryAbi = TreasuryRegistry.abi;
  private usdcAbi = USDCRegistry.abi;
  private marketplaceAbi = MarketplaceRegistry.abi;
  private CarbonCreditFacet = CarbonCreditFacet.abi;
  private tradeDealAbi = TradeDealRegistry.abi;

  private provider: any;
  private dedicatedProvider: any;
  // private signer: ethers.JsonRpcSigner|undefined;
  private signer: any;
  private contractAddress: any;
  private treasuryAddress: any;
  private usdcAddress: any;
  private treasuryService: any;
  private usdcService: any;
  private marketplaceService: any;
  //private tradeDealAddress: any;
  //private tradeDealService: any;

  private constructor() {
    if (process.browser) {
      this.provider = getProvider();
      this.signer = getSigner();

      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
      if (rpcUrl) {
        this.dedicatedProvider = new ethers.JsonRpcProvider(rpcUrl);
        console.log("Using dedicated RPC provider:", rpcUrl);
      }

      this.init();
    }
  }

  private async init() {
    const network = await this.dedicatedProvider.getNetwork();
    const chainId: any = network.chainId;

    const chainConfig = process.env.NEXT_PUBLIC_HARDHAT_CHAIN_ID;

    if (!chainConfig || chainConfig != chainId) {
      throw new Error(`No chain config found for chainId: ${chainId}, chainConfig: ${chainConfig}`);
    }

    this.contractAddress = process.env.NEXT_PUBLIC_HARDHAT_CONTRACT_ADDRESS;
    this.treasuryAddress = process.env.NEXT_PUBLIC_HARDHAT_TREASURY_ADDRESS;
    this.usdcAddress = process.env.NEXT_PUBLIC_HARDHAT_USDC_ADDRESS;
    //this.tradeDealAddress = process.env.NEXT_PUBLIC_HARDHAT_TRADE_DEAL_ADDRESS;

    this.treasuryService = new ethers.Contract(this.treasuryAddress, this.treasuryAbi, this.provider);
    this.usdcService = new ethers.Contract(this.usdcAddress, this.usdcAbi, this.provider);
    this.marketplaceService = new ethers.Contract(this.contractAddress, this.marketplaceAbi, this.provider);
    //this.tradeDealService = new ethers.Contract(this.tradeDealAddress, this.tradeDealAbi, this.provider);
  }

  public static get instance(): BlockchainService {
    if (!BlockchainService._instance) {
      BlockchainService._instance = new BlockchainService();
    }
    return BlockchainService._instance;
  }

  async getTokenBalances(tokenIds: number[]) {
    try {
      if (this.dedicatedProvider) {
        const treasuryContract = new ethers.Contract(this.treasuryAddress, this.treasuryAbi, this.dedicatedProvider);
        const balance = await treasuryContract.getTokenPaymentBalance(tokenIds);
        return balance;
      }
      return null;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async withdraw(tokenIds: number[]) {
    try {
      const ethObject = (window as any).ethereum;
      this.provider = new ethers.BrowserProvider(ethObject);
      this.signer = await this.provider.getSigner();
      const contractWithSigner: any = this.treasuryService?.connect(this.signer);
      return await contractWithSigner.withdraw(tokenIds);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async approve(price: bigint) {
    // contract address
    try {
      if (this.signer) {
        const contractWithSigner: any = this.usdcService?.connect(this.signer);
        return await contractWithSigner.approve(this.contractAddress, price);
      }
    } catch (e: any) {
      console.log(e);
      if (e.reason != "rejected") throw e;
      else return "rejected";
    }
  }

  async purchase(tokenId: string) {
    try {
      if (this.signer) {
        const contractWithSigner: any = this.marketplaceService?.connect(this.signer);
        return await contractWithSigner.purchaseItem(this.contractAddress, tokenId);
      }
    } catch (e: any) {
      console.log(e);
      if (e.reason != "rejected") throw e;
      else return "rejected";
    }
  }

  public async purchaseTokens(listings: any) {
    for (let listing of listings) {
      const usdcPrice = parseUnits(listing.price, 6);
      const response = await this.approve(usdcPrice);
      console.log("response", response);
      if (response == "rejected") {
        return "rejected";
      }
      return await this.purchase(listing.tokenId);
    }
  }

  async retireCarbonCredits(tokenId: number, amount: number): Promise<any> {
    try {
      // Check if the signer is available
      if (this.signer) {
        // Create a contract instance for CarbonCreditFacet with the signer
        const carbonCreditContract = new ethers.Contract(
          this.contractAddress, // Diamond contract address
          this.CarbonCreditFacet, // ABI of CarbonCreditFacet
          this.signer // Signer to interact with the blockchain
        );

        // Call the retireCarbonCredits function with the tokenId and amount
        const tx = await carbonCreditContract.retireCarbonCredits(tokenId, amount);
        // Wait for the transaction to be confirmed
        await tx.wait();

        return tx; // Return the transaction object for reference
      }

      throw new Error("Signer is not available.");
    } catch (e) {
      console.error("Error retiring carbon credits:", e);
      throw e; // Re-throw error to be handled by calling function
    }
  }

  async getCarbonCreditBalance(tokenId: number): Promise<number | null> {
    try {
      // Check if the signer is available
      if (this.dedicatedProvider) {
        // Create a contract instance for CarbonCreditFacet with the signer
        const carbonCreditContract = new ethers.Contract(this.contractAddress, this.CarbonCreditFacet, this.dedicatedProvider);

        // Call the getCarbonCreditBalance method with the tokenId
        const balance = await carbonCreditContract.getCarbonCreditBalance(tokenId);
        return balance;
      }

      return null;
    } catch (e) {
      console.error("Error fetching carbon credit balance:", e);
      throw e; // Re-throw error to be handled by calling function
    }
  }

  async fetchItems() {
    try {
      if (!this.dedicatedProvider) {
        throw new Error("Signer is not available.");
      }

      const contractWithSigner: any = this.marketplaceService?.connect(this.dedicatedProvider);
      const items = await contractWithSigner?.fetchItems();
      return items;
    } catch (e) {
      console.log("Error in fetchItems:", e);
      throw e;
    }
  }

  async tradeInvest(tradeDealId: number, amount: number): Promise<any> {
    try {
      if (this.signer) {
        const tradeDealContract = new ethers.Contract(this.contractAddress, this.tradeDealAbi, this.signer);

        const tx = await tradeDealContract.tdDepositUSDC(tradeDealId, amount);
        await tx.wait();

        return tx;
      }

      throw new Error("Signer is not available.");
    } catch (e: any) {
      console.error("Error depositing USDC to Trade Deal:", e);
      if (e.reason !== "rejected") throw e;
      return "rejected";
    }
  }

  public async tradeInvestUSDC(tradeDealId: number, amount: number) {
    const usdcPrice = parseUnits(amount.toString(), 6);
    const response = await this.approve(usdcPrice);
    console.log("response", response);
    if (response == "rejected") {
      return "rejected";
    }
    return await this.tradeInvest(tradeDealId, amount);
  }

  async tradeWithdraw(tradeDealId: number, amount: number): Promise<any> {
    try {
      if (this.signer) {
        const tradeDealContract = new ethers.Contract(this.contractAddress, this.tradeDealAbi, this.signer);

        const tx = await tradeDealContract.tdWithdrawUSDC(tradeDealId, amount);
        await tx.wait();

        return tx;
      }

      throw new Error("Signer is not available.");
    } catch (e: any) {
      console.error("Error withdrawing USDC from Trade Deal:", e);
      if (e.reason !== "rejected") throw e;
      return "rejected";
    }
  }

  public async tradeWithdrawUSDC(tradeDealId: number, amount: number): Promise<any> {
    const usdcPrice = parseUnits(amount.toString(), 6);
    const response = await this.approve(usdcPrice);
    console.log("response", response);

    if (response === "rejected") {
      return "rejected";
    }

    return await this.tradeWithdraw(tradeDealId, amount);
  }

  async redeemVABBTokens(tradeDealId: number, vabbAmount: bigint): Promise<any> {
    try {
      if (this.signer) {
        const tradeDealContract = new ethers.Contract(this.contractAddress, this.tradeDealAbi, this.signer);

        const tx = await tradeDealContract.redeemVABBTokens(tradeDealId, vabbAmount);
        await tx.wait();

        return tx;
      }
      return null;
    } catch (e: any) {
      console.error("Error redeeming VABB from Trade Deal:", e);
      if (e.reason !== "rejected") throw e;
      return "rejected";
    }
  }
}

export default BlockchainService.instance;
