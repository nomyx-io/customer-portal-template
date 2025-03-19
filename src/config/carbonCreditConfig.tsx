import React from "react";

import { toast } from "react-toastify";

import { requiredRule, numberRule } from "@/constants/rules";
import BlockchainService from "@/services/BlockchainService";
import { WalletPreference } from "@/utils/Constants";

// Field definitions
export const carbonCreditFields = [
  {
    name: "Existing Credits",
    key: "existingCredits",
    type: "text",
    placeholder: "Enter Existing Carbon Credits Amount", // Fixed typo
    rules: [requiredRule, numberRule],
  },
];

// Actions
export const actions = {
  handleIndividualPurchase: async (
    token: any,
    walletPreference: WalletPreference,
    handleApprovalAndPurchase: (tokenId: number, price: string) => Promise<void>
  ) => {
    const processPurchase = async (onComplete: () => Promise<void>) => {
      if (walletPreference === WalletPreference.PRIVATE) {
        const response = await BlockchainService.purchaseTokens([token]);
        if (response === "rejected") {
          throw new Error("The purchase was rejected.");
        }
      } else if (walletPreference === WalletPreference.MANAGED) {
        const totalCost = (Number(token.price) * Number(token.existingCredits)).toString();
        console.log("totalCost: ", totalCost);
        await handleApprovalAndPurchase(token.tokenId, totalCost);
      } else {
        throw new Error("Invalid wallet preference");
      }
      await onComplete();
    };

    return processPurchase;
  },
};
