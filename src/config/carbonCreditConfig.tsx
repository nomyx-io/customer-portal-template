import { requiredRule, numberRule } from "@/constants/rules";

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
