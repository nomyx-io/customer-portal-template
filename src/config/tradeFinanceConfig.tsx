import { requiredRule, numberRule } from "@/constants/rules";

export const tradeFinanceFields = [
  // {
  //   name: "Trade Amount",
  //   key: "tradeAmount",
  //   type: "text",
  //   placeHolder: "Enter Trade Amount",
  //   rules: [requiredRule, numberRule],
  // },
  {
    name: "Private Placement Memorandum",
    key: "privatePlacementMemorandum",
    type: "text",
    placeHolder: "Private Placement Memorandum Document",
  },
  {
    name: "Stock Certificate",
    key: "stockCertificate",
    type: "text",
    placeHolder: "Stock Certificate Document",
  },
  {
    name: "Custodian Contract",
    key: "custodianContract",
    type: "text",
    placeHolder: "Custodian Contract Document",
  },
];
