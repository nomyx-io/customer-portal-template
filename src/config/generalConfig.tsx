import { ReactNode } from "react";

import ProjectInfo from "@/components/marketplace/ProjectInfo";
import { carbonCreditFields } from "@/config/carbonCreditConfig";
import { tokenizedDebtFields } from "@/config/tokenizedDebtConfig";
import { tradeFinanceFields } from "@/config/tradeFinanceConfig";
import BlockchainService from "@/services/BlockchainService";
import { WalletPreference } from "@/utils/Constants";

export enum Industries {
  CARBON_CREDIT = "carbon_credit",
  TOKENIZED_DEBT = "tokenized_debt",
  TRADE_FINANCE = "trade_finance",
}

export const industryOptions = [
  { label: "Carbon Credit", value: Industries.CARBON_CREDIT },
  { label: "Tokenized Debt", value: Industries.TOKENIZED_DEBT },
  { label: "Trade Finance", value: Industries.TRADE_FINANCE },
];

// Industry-specific configurations and components
export const projectInfoComponents = {
  [Industries.CARBON_CREDIT]: {
    fields: carbonCreditFields,
    component: (props: any) => (
      <ProjectInfo
        {...props}
        carbonCreditBalance={props.carbonCreditBalance}
        onTokenAction={props.onTokenAction}
        tokenActionLabel={props.tokenActionLabel}
      />
    ),
  },
  [Industries.TRADE_FINANCE]: {
    fields: tradeFinanceFields,
    component: ({ tokenBalance, ...props }: any) => (
      <ProjectInfo {...props} onTokenAction={props.onTokenAction} tokenActionLabel={props.tokenActionLabel} />
    ),
  },
  [Industries.TOKENIZED_DEBT]: {
    fields: tokenizedDebtFields,
    component: (props: any) => (
      <ProjectInfo {...props} tokenBalance={props.tokenBalance} onTokenAction={props.onTokenAction} tokenActionLabel={props.tokenActionLabel} />
    ),
  },
} as const;

// Actions
export const actions = {
  handleIndividualPurchase: async (
    token: any,
    walletPreference: WalletPreference,
    handleApprovalAndPurchase: (tokenId: number, price: string) => Promise<void>
  ) => {
    const processPurchase = async (onComplete: () => Promise<void>) => {
      try {
        // Check if the token has an industryTemplate property or use it from the project
        const industryTemplate = token.industryTemplate || token.project?.attributes?.industryTemplate;
        console.log("Processing token with industry template:", industryTemplate);
        console.log("Token data:", {
          tokenId: token.tokenId,
          price: token.price,
          existingCredits: token.existingCredits,
          industryTemplate,
        });

        if (walletPreference === WalletPreference.PRIVATE) {
          // Private wallet flow remains the same for all templates
          const response = await BlockchainService.purchaseTokens([token]);
          if (Array.isArray(response) && response.some((item) => item.status === "rejected")) {
            throw new Error("The purchase was rejected.");
          }
        } else if (walletPreference === WalletPreference.MANAGED) {
          // Different price calculation based on the industry template
          let totalCost;

          if (industryTemplate === Industries.TOKENIZED_DEBT) {
            // For TOKENIZED_DEBT, get the price directly from the token
            // Ensure price is a valid number before conversion
            const tokenPrice = parseFloat(token.price);
            if (isNaN(tokenPrice)) {
              console.error("Invalid price value for TOKENIZED_DEBT:", token.price);
              throw new Error("Invalid token price");
            }

            // Format to fixed number of decimals to avoid floating point issues
            totalCost = tokenPrice.toFixed(6);
            console.log("TOKENIZED_DEBT totalCost:", totalCost);
          } else {
            // For other templates (like carbon credits), calculate based on existing credits
            const price = parseFloat(token.price);
            const credits = parseFloat(token.existingCredits || "1"); // Default to 1 if existingCredits is missing

            if (isNaN(price)) {
              console.error("Invalid price value:", token.price);
              throw new Error("Invalid token price");
            }

            // Format to fixed number of decimals to avoid floating point issues
            totalCost = (price * credits).toFixed(6);
            console.log("Default totalCost:", totalCost);
          }

          await handleApprovalAndPurchase(token.tokenId, totalCost);
        } else {
          throw new Error("Invalid wallet preference");
        }

        await onComplete();
      } catch (error) {
        console.error("Error in processPurchase:", error);
        throw error;
      }
    };

    return processPurchase;
  },
};
