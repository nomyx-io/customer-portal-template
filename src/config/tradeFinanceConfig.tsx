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
    name: "ppm",
    key: "ppm",
    type: "text",
    placeHolder: "ppm Document",
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
