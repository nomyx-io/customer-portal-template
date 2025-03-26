// types.ts
export interface TradeFinancePool {
  tradeDealId: number;
  projectId: string;
  totalInvestedAmount: number;
  title: string;
  description: string;
  logo?: Parse.File;
  coverImage?: Parse.File;
}

export interface StockData {
  id: number;
  certificateId: string;
  tokenId: string;
  issuanceDate: string;
  heldBy: string;
  maturityDate: string;
  companyName: string;
  shareholderName: string;
  numberOfShares: number;
  classOfShares: string;
  parValue: number;
  isinNumber: string;
  transferRestrictions: number;
}

export interface HistoryData {
  investorName: string;
  investorId: string;
  amountDeposited: number;
  tradeDealId: number;
  // vabbTokenIssued: number;
  // vabbTokenLockupPeriod: number;
  // vabiTokensIssued: number;
}
