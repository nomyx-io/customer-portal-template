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
    const tradeDealPointerMap: Record<number, Parse.Object> = {};

    records.forEach((record) => {
      const tradeDealId = record.get("tradeDealId") as number;
      const amount = (record.get("amount") as number) || 0;
      const tradeDeal = record.get("tradeDeal") as Parse.Object | undefined;
      tradeDealMap[tradeDealId] = (tradeDealMap[tradeDealId] || 0) + Number(amount);
      if (tradeDeal?.id && tradeDealId) {
        tradeDealPointerMap[tradeDealId] = tradeDeal;
      }
    });

    // Step 3: Fetch TokenProject records for unique tradeDealIds
    const uniqueTradeDealIds = Object.keys(tradeDealMap).map((id) => Number(id));

    if (uniqueTradeDealIds.length === 0) return [];
    const tradeDealPointers = Object.values(tradeDealPointerMap);
    if (tradeDealPointers.length === 0) return [];

    // Step 4: Query Transaction table for any of these tradeDeal pointers
    const Transaction = Parse.Object.extend("Transaction");
    const transactionQuery = new Parse.Query(Transaction);
    transactionQuery.containedIn("tradeDeal", tradeDealPointers);
    transactionQuery.equalTo("type", "CollateralRedemption");
    const transactions = await transactionQuery.find();

    // Calculate total USDC amount per tradeDeal from transactions
    const transactionAmounts: Record<number, number> = {};
    transactions.forEach((tx) => {
      const tradeDeal = tx.get("tradeDeal");
      if (!tradeDeal) return;

      const tradeDealId = tradeDeal.get("tradeDealId") as number;
      const usdcAmount = (tx.get("usdcAmount") as number) || 0;
      transactionAmounts[tradeDealId] = (transactionAmounts[tradeDealId] || 0) + Number(usdcAmount);
    });

    const tradeDealsWithTransactions = Array.from(new Set(transactions.map((tx) => tx.get("tradeDeal")?.get("tradeDealId")).filter(Boolean))).map(
      Number
    );

    // let filteredTradeDealIds = uniqueTradeDealIds;

    // if (tradeDealsWithTransactions.length > 0) {
    //   const txSet = new Set(tradeDealsWithTransactions);
    //   filteredTradeDealIds = uniqueTradeDealIds.filter((id) => !txSet.has(id));
    // }

    const tokenProjects = await ParseService.getRecords(
      "TokenProject",
      ["tradeDealId"],
      [uniqueTradeDealIds],
      ["tradeDealId", "title", "logo", "coverImage", "description"]
    );

    // Step 5: Create a final combined result
    const result = uniqueTradeDealIds.flatMap((tradeDealId) => {
      const project = tokenProjects?.find((p) => p.get("tradeDealId") == tradeDealId);
      if (!project) return [];

      const totalInvestedAmount = tradeDealMap[tradeDealId];
      const totalTransactionAmount = transactionAmounts[tradeDealId] / 1_000_000 || 0;
      const amountsMatch = totalInvestedAmount === totalTransactionAmount;

      return {
        tradeDealId,
        title: (project.get("title") as string) || "Unknown",
        description: (project.get("description") as string) || "Unknown",
        totalInvestedAmount,
        isRedemptionCompleted: amountsMatch,
        projectId: project.id ?? "",
        logo: project.get("logo") ?? "",
        coverImage: project.get("coverImage") ?? "",
      };
    });

    return result;
  }

  public async getUserTradePoolsStats(userAddress: string): Promise<TradeFinancePool[]> {
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
    // Step 1: Fetch VABBTokensRedeemed records for the given user address (case-insensitive)
    const Transaction = Parse.Object.extend("Transaction");
    const query = new Parse.Query(Transaction);
    query.equalTo("type", "CollateralRedemption");
    query.matches("sender", new RegExp(`^${userAddress}$`, "i")); // case-insensitive match
    query.include("*");

    const redeemedVABBs = (await query.find()) || [];
    if (redeemedVABBs.length === 0) return [];

    // Step 2: Fetch user details from the User table based on walletAddress
    const userQuery = new Parse.Query("User");
    userQuery.matches("walletAddress", new RegExp(`^${userAddress}$`, "i")); // case-insensitive match
    const userRecords = await userQuery.first();

    // Step 3: Construct the final history data array
    return redeemedVABBs.map((vabb) => ({
      id: vabb.id,
      redeemerName: `${userRecords?.get("firstName") || "Unknown"} ${userRecords?.get("lastName") || ""}`.trim(),
      redeemerId: userRecords?.id || "",
      collateralAmount: vabb.get("collateralAmount") as number,
      usdcAmount: vabb.get("usdcAmount") as number,
      tradeDealId: vabb.get("tradeDeal")?.get("tradeDealId") as number,
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

  public async getTradeDeals(): Promise<any[]> {
    try {
      const tradeDeals = await ParseService.getRecords("TradeDeal", [], [], ["usdcBalance", "fundingTarget"]);

      if (!tradeDeals) return [];

      return tradeDeals.map((deal) => ({
        usdcBalance: Number(deal.get("usdcBalance") || 0),
        fundingTarget: Number(deal.get("fundingTarget") || 0),
      }));
    } catch (error) {
      console.error("Error fetching trade deals:", error);
      return [];
    }
  }

  public async getTradeDealEvents(userAddress: string): Promise<{ event: string; transactionHash: string }[]> {
    try {
      const address = userAddress; // keep as provided

      const usdcDepositQuery = new Parse.Query("USDCDepositedToTradeDeal__e");
      usdcDepositQuery.matches("depositor", new RegExp(`^${address}$`, "i"));
      usdcDepositQuery.select("event", "transactionHash");

      const fundingWithdrawnQuery = new Parse.Query("TradeDealFundingWithdrawn__e");
      fundingWithdrawnQuery.matches("recipient", new RegExp(`^${address}$`, "i"));
      fundingWithdrawnQuery.select("event", "transactionHash");

      const redeemedCollateralQuery = new Parse.Query("CollateralTokensRedeemed__e");
      redeemedCollateralQuery.matches("redeemer", new RegExp(`^${address}$`, "i"));
      redeemedCollateralQuery.select("event", "transactionHash");

      const [usdcDeposit, fundingWithdrawn, redeemedCollateral] = await Promise.all([
        usdcDepositQuery.find(),
        fundingWithdrawnQuery.find(),
        redeemedCollateralQuery.find(),
      ]);

      const allEvents = [...(usdcDeposit || []), ...(fundingWithdrawn || []), ...(redeemedCollateral || [])];

      return allEvents.map((record: any) => ({
        event: record.get("event"),
        transactionHash: record.get("transactionHash"),
      }));
    } catch (error) {
      console.error("Error fetching trade deal events:", error);
      return [];
    }
  }
}

export default TradeFinanceService.instance;
