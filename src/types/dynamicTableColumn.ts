export interface ColumnConfig {
  title: string;
  key: string;
}

export interface ColumnData {
  label: string;
  value: any;
}

export const EXCLUDED_COLUMNS = new Set([
  "address",
  "createdAt",
  "updatedAt",
  "objectId",
  "token",
  "owner",
  "transactionHash",
  "networkId",
  "type",
  "logIndex",
  "nftTitle",
  "description",
  "projectId",
  "price",
  "projectStartDate",
  "__type",
  "className",
  "claimTopics",
  "projectName",
]);
