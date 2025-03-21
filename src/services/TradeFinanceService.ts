import { WebAuthnSigner } from "@dfns/sdk-browser";

import BlockchainService from "./BlockchainService";
import ParseClient from "./ParseService";

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
}

export default TradeFinanceService.instance;
