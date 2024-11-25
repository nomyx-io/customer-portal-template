import { ReactNode } from "react";

import ProjectInfo from "@/components/marketplace/ProjectInfo";
import { carbonCreditFields } from "@/config/carbonCreditConfig";
import { tokenizedDebtFields } from "@/config/tokenizedDebtConfig";
import { tradeFinanceFields } from "@/config/tradeFinanceConfig";

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
    component: (props: any) => (
      <div>
        {/* Trade Finance-specific details */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Trade Finance Details</h3>
      </div>
    ),
  },
  [Industries.TOKENIZED_DEBT]: {
    fields: tokenizedDebtFields,
    component: (props: any) => (
      <div>
        {/* Tokenized Debt-specific details */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tokenized Debt Details</h3>
      </div>
    ),
  },
} as const;
