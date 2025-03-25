import { WebAuthnSigner } from "@dfns/sdk-browser";

import { TradeFinancePool } from "@/types/poolData";

import BlockchainService from "./BlockchainService";
import ParseClient from "./ParseService";
import ParseService from "./ParseService";

class TradeFinanceService {
  private static _instance: TradeFinanceService;

  public static get instance(): TradeFinanceService {
    if (!TradeFinanceService._instance) {
      TradeFinanceService._instance = new TradeFinanceService();
    }
    return TradeFinanceService._instance;
  }

  public async initiateTradeInvestUSDC(tradeDealId: number, amount: number, walletId: string, dfnsToken: string) {
    if (!tradeDealId || !amount || !walletId || !dfnsToken) {
      throw new Error("Missing required parameters for invest USDC.");
    }

    try {
      const initiateResponse = await Parse.Cloud.run("dfnsInitTdDepositUSDC", {
        tradeDealId,
        amount,
        walletId,
        dfns_token: dfnsToken,
      });
      console.log("Pending invest USDC request:", initiateResponse);

      return { initiateResponse, error: null };
    } catch (error: any) {
      console.error("Error initiating invest USDC:", error);
      return { initiateResponse: null, error: error.message };
    }
  }

  public async completeTradeInvestUSDC(walletId: string, dfnsToken: string, challenge: any, requestBody: any) {
    if (!walletId || !dfnsToken || !challenge || !requestBody) {
      throw new Error("Missing required parameters for completing inevest USDC.");
    }

    try {
      const webauthn = new WebAuthnSigner();
      const assertion = await webauthn.sign(challenge);

      const completeResponse = await Parse.Cloud.run("dfnsCompleteTdDepositUSDC", {
        walletId,
        dfns_token: dfnsToken,
        signedChallenge: {
          challengeIdentifier: challenge.challengeIdentifier,
          firstFactor: assertion,
        },
        requestBody,
      });

      return { completeResponse, error: null };
    } catch (error: any) {
      console.error("Error completing invest USDC:", error);
      return { completeResponse: null, error: error.message };
    }
  }

  public async initiateTradeWithdrawUSDC(tradeDealId: number, amount: number, walletId: string, dfnsToken: string) {
    if (!tradeDealId || !amount || !walletId || !dfnsToken) {
      throw new Error("Missing required parameters for withdraw.");
    }

    try {
      const initiateResponse = await Parse.Cloud.run("dfnsInitTdWithdrawUSDC", {
        tradeDealId,
        amount,
        walletId,
        dfns_token: dfnsToken,
      });
      console.log("Pending withdraw request:", initiateResponse);

      return { initiateResponse, error: null };
    } catch (error: any) {
      console.error("Error initiating withdraw:", error);
      return { initiateResponse: null, error: error.message };
    }
  }

  public async completeTradeWithdrawUSDC(walletId: string, dfnsToken: string, challenge: any, requestBody: any) {
    if (!walletId || !dfnsToken || !challenge || !requestBody) {
      throw new Error("Missing required parameters for completing withdraw.");
    }

    try {
      const webauthn = new WebAuthnSigner();
      const assertion = await webauthn.sign(challenge);

      const completeResponse = await Parse.Cloud.run("dfnsCompleteTdWithdrawUSDC", {
        walletId,
        dfns_token: dfnsToken,
        signedChallenge: {
          challengeIdentifier: challenge.challengeIdentifier,
          firstFactor: assertion,
        },
        requestBody,
      });

      return { completeResponse, error: null };
    } catch (error: any) {
      console.error("Error completing withdraw:", error);
      return { completeResponse: null, error: error.message };
    }
  }

  public async getUserTradePools(userAddress: string): Promise<TradeFinancePool[]> {
    // Step 1: Fetch TradeDealUSDCDeposit records for the ownerAddress
    const records = await ParseService.getRecords("TradeDealUSDCDeposit", ["ownerAddress"], [userAddress], ["tradeDealId", "amount"]);

    if (!records || records.length === 0) return [];

    // Step 2: Aggregate total amount for each unique tradeDealId
    const tradeDealMap: Record<number, number> = {};

    records.forEach((record) => {
      const tradeDealId = record.get("tradeDealId") as number;
      const amount = (record.get("amount") as number) || 0;
      tradeDealMap[tradeDealId] = (tradeDealMap[tradeDealId] || 0) + Number(amount);
    });

    // Step 3: Fetch TokenProject records for unique tradeDealIds
    const uniqueTradeDealIds = Object.keys(tradeDealMap).map((id) => Number(id));

    if (uniqueTradeDealIds.length === 0) return [];

    const tokenProjects = await ParseService.getRecords(
      "TokenProject",
      ["tradeDealId"],
      [uniqueTradeDealIds], // Ensure Parse query supports arrays
      ["tradeDealId", "title", "logo", "coverImage"]
    );

    // Step 4: Create a final combined result
    const result = uniqueTradeDealIds.map((tradeDealId) => {
      const project = tokenProjects?.find((p) => p.get("tradeDealId") == tradeDealId);
      debugger;
      return {
        tradeDealId: tradeDealId,
        title: (project?.get("title") as string) || "Unknown",
        description: (project?.get("description") as string) || "Unknown",
        totalInvestedAmount: tradeDealMap[tradeDealId],
        projectId: project?.id ?? "", // Ensure it's always a string
        logo: project?.get("logo") ?? "", // Provide a default if required
        coverImage: project?.get("coverImage") ?? "", // Provide a default if required
      };
    });

    return result;
  }
}

export default TradeFinanceService.instance;
