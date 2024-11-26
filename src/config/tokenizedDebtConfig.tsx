import { requiredRule, numberRule } from "@/constants/rules";

export const tokenizedDebtFields = [
  {
    name: "Debt Amount",
    key: "debtAmount",
    type: "text",
    placeHolder: "Enter Debt Amount",
    rules: [requiredRule, numberRule],
  },
];
