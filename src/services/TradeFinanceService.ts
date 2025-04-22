import { WebAuthnSigner } from "@dfns/sdk-browser";
import Parse from "parse";

import { HistoryData, RedeemedVABBHistory, TradeFinancePool } from "@/types/poolData";

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

  public async initiateTradeInvestUSDC(tradeDealId: number, amount: string, walletId: string, dfnsToken: string) {
    if (tradeDealId == null || amount == null || walletId == null || dfnsToken == null) {
      throw new Error("Missing required parameters for invest USDC.");
    }

    try {
      const initiateResponse = await Parse.Cloud.run("dfnsInitTdDepositUSDC", {
        tradeDealId,
        amount,
        walletId,
        dfns_token: dfnsToken,
      });
      console.log("tradeDealId: ", tradeDealId);
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

  public async initiateTradeWithdrawUSDC(tradeDealId: number, amount: string, walletId: string, dfnsToken: string) {
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
    userAddress = userAddress.toLowerCase();
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
    const result = uniqueTradeDealIds.flatMap((tradeDealId) => {
      const project = tokenProjects?.find((p) => p.get("tradeDealId") == tradeDealId);
      if (!project) return [];

      return {
        tradeDealId,
        title: (project.get("title") as string) || "Unknown",
        description: (project.get("description") as string) || "Unknown",
        totalInvestedAmount: tradeDealMap[tradeDealId],
        projectId: project.id ?? "",
        logo: project.get("logo") ?? "",
        coverImage: project.get("coverImage") ?? "",
      };
    });

    return result;
  }

  public async getDepositHistory(userAddress: string): Promise<HistoryData[]> {
    // Step 1: Fetch TradeDealUSDCDeposit records for the given user address
    const tradeDealDeposits =
      (await ParseService.getRecords("TradeDealUSDCDeposit", ["ownerAddress"], [userAddress.toLowerCase()], ["tradeDealId", "amount"])) || [];

    if (tradeDealDeposits.length === 0) return [];

    // Step 2: Fetch user details from the User table based on walletAddress
    const userRecords = await ParseService.getFirstRecord("User", ["walletAddress"], [userAddress]);

    // Step 3: Construct the final history data array
    return tradeDealDeposits.map((deposit) => ({
      investorName: `${userRecords?.get("firstName") || "Unknown"} ${userRecords?.get("lastName") || ""}`.trim(),
      investorId: userRecords?.id || "",
      amountDeposited: deposit.get("amount") as number,
      tradeDealId: deposit.get("tradeDealId") as number,
    }));
  }

  public async getRedeemedVABBHistory(userAddress: string): Promise<RedeemedVABBHistory[]> {
    // Step 1: Fetch VABBTokensRedeemed records for the given user address
    const redeemedVABBs =
      (await ParseService.getRecords("VABBTokensRedeemed", ["ownerAddress"], [userAddress], ["tradeDealId", "vabbAmount", "usdcAmount"])) || [];

    if (redeemedVABBs.length === 0) return [];

    // Step 2: Fetch user details from the User table based on walletAddress
    const userRecords = await ParseService.getFirstRecord("User", ["walletAddress"], [userAddress]);

    // Step 3: Construct the final history data array
    return redeemedVABBs.map((vabb) => ({
      redeemerName: `${userRecords?.get("firstName") || "Unknown"} ${userRecords?.get("lastName") || ""}`.trim(),
      redeemerId: userRecords?.id || "",
      vabbAmount: vabb.get("vabbAmount") as number,
      usdcAmount: vabb.get("usdcAmount") as number,
      tradeDealId: vabb.get("tradeDealId") as number,
    }));
  }

  public async initiateRedeemVABBTokens(tradeDealId: number, vabbAmount: string, walletId: string, dfnsToken: string) {
    if (tradeDealId === null || tradeDealId === undefined || !vabbAmount || !walletId || !dfnsToken) {
      throw new Error("Missing required parameters for redeeming VABB tokens.");
    }

    try {
      const initiateResponse = await Parse.Cloud.run("dfnsInitRedeemVABBTokens", {
        tradeDealId,
        vabbAmount,
        walletId,
        dfns_token: dfnsToken,
      });

      console.log("Pending redeem VABB tokens request:", initiateResponse);

      return { initiateResponse, error: null };
    } catch (error: any) {
      console.error("Error initiating redeem VABB tokens:", error);
      return {
        initiateResponse: null,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      };
    }
  }

  public async completeRedeemVABBTokens(walletId: string, dfnsToken: string, challenge: any, requestBody: any) {
    if (!walletId || !dfnsToken || !challenge || !requestBody) {
      throw new Error("Missing required parameters for completing redeem VABB tokens.");
    }

    try {
      const webauthn = new WebAuthnSigner();
      const assertion = await webauthn.sign(challenge);

      const completeResponse = await Parse.Cloud.run("dfnsCompleteRedeemVABBTokens", {
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
      console.error("Error completing redeem VABB tokens:", error);
      return {
        completeResponse: null,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      };
    }
  }
}

export default TradeFinanceService.instance;
