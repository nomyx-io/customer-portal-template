// types.ts
export interface TradeFinancePool {
  objectId: string;
  title: string;
  description: string;
  logo?: Parse.File;
  coverImage?: Parse.File;
  startDate: string;
  maturityDate: string;
  investedAmount?: number;
  allocatedVABB?: number;
  vabiEarned?: number;
  totalVabiYield?: number;
  yieldPercentage: string;
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
  vabbTokenIssued: number;
  vabbTokenLockupPeriod: number;
  vabiTokensIssued: number;
}
