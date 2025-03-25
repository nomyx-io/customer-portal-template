// import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";

// import { Input, DatePicker, Select } from "antd";
// import { parseUnits } from "ethers";
// import { Category, RowVertical, SearchNormal1 } from "iconsax-react";
// import { toast } from "react-toastify";

// import { useGemforceApp } from "@/context/GemforceAppContext";
// import BlockchainService from "@/services/BlockchainService";
// import KronosCustomerService from "@/services/KronosCustomerService";
// import TradeFinanceService from "@/services/TradeFinanceService";
// import { NomyxEvent, WalletPreference } from "@/utils/Constants";

// import StockCardView from "./StocksCardView";
// import StockTableView from "./StocksTableView";
// import { StockData } from "../../../../types/poolData";

// const mockStockData: StockData[] = [
//   {
//     id: 1,
//     certificateId: "Certificate 001247",
//     tokenId: "5326589516",
//     issuanceDate: "2024-09-05",
//     maturityDate: "2025-09-05",
//     heldBy: "Equity Trust Partners",
//     companyName: "Space X",
//     shareholderName: "SGH Capital",
//     numberOfShares: 24000,
//     classOfShares: "Class A",
//     parValue: 100000,
//     isinNumber: "53286",
//     transferRestrictions: 100000,
//   },
//   // Add more mock data as needed
// ];

// interface StockListPageProps {
//   type: string;
// }

// const StockListPage: React.FC<StockListPageProps> = ({ type }) => {
//   const { appState }: any = useGemforceApp();
//   const [searchText, setSearchText] = useState("");
//   const [dateRange, setDateRange] = useState<any>(null);
//   const [viewMode, setViewMode] = useState("table");
//   const walletPreference = appState?.session?.user?.walletPreference;

//   // Handle search bar input change
//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchText(e.target.value);
//   };

//   const filteredData = mockStockData.filter((stock) => stock.certificateId.toLowerCase().includes(searchText.toLowerCase()));

//   const handleDepositUSDC = useCallback(
//     async (tradeDealId: any) => {
//       try {
//         const user = appState?.session?.user;
//         const walletId = user?.walletId;
//         const dfnsToken = user?.dfns_token;
//         const tradeDealId = 10;
//         const amount = 10;

//         // Convert amount to USDC format early
//         const usdcPrice = parseUnits(amount.toString(), 6);

//         await toast.promise(
//           async () => {
//             if (walletPreference === WalletPreference.PRIVATE) {
//               // Step 1: Approve USDC
//               const approvalTx = await BlockchainService.approve(usdcPrice);
//               if (approvalTx === "rejected") throw new Error("User rejected USDC approval");

//               // Step 2: Deposit USDC into trade deal
//               await BlockchainService.tradeInvest(tradeDealId, amount);

//               const [updatedTokens, updatedWithdrawals] = await Promise.all([
//                 KronosCustomerService.getTokensForUser(user.walletAddress),
//                 KronosCustomerService.getWithdrawalsForUser(user.walletAddress),
//               ]);
//               // Optional UI state update
//               // setTokens(updatedTokens);
//               // setWithdrawals(updatedWithdrawals);
//             } else if (walletPreference === WalletPreference.MANAGED) {
//               if (!walletId || !dfnsToken) {
//                 throw "No wallet or DFNS token available for Deposit.";
//               }

//               // Step 1: Initiate approval/invest (backend will do approval on user's behalf)
//               const { initiateResponse: depositResponse, error: depositInitiateError } = await TradeFinanceService.initiateTradeInvestUSDC(
//                 tradeDealId,
//                 amount,
//                 walletId,
//                 dfnsToken
//               );

//               if (depositInitiateError) throw "DepositInitiateError: " + depositInitiateError;

//               // Step 2: Complete invest
//               const { completeResponse: depositCompleteResponse, error: completeDepositError } = await TradeFinanceService.completeTradeInvestUSDC(
//                 walletId,
//                 dfnsToken,
//                 depositResponse.challenge,
//                 depositResponse.requestBody
//               );

//               if (completeDepositError) throw "CompleteDepositError: " + completeDepositError;

//               const [updatedTokens, updatedWithdrawals] = await Promise.all([
//                 KronosCustomerService.getTokensForUser(user.walletAddress),
//                 KronosCustomerService.getWithdrawalsForUser(user.walletAddress),
//               ]);
//               // Optional UI state update
//               // setTokens(updatedTokens);
//               // setWithdrawals(updatedWithdrawals);
//             } else {
//               throw "Invalid wallet preference.";
//             }
//           },
//           {
//             pending: "Processing deposit...",
//             success: "Trade deal deposited successfully.",
//             error: {
//               render({ data }: { data: any }) {
//                 return <div>{data?.reason || data || "An error occurred during deposit."}</div>;
//               },
//             },
//           }
//         );
//       } catch (error: any) {
//         console.error("Failed to deposit trade deal:", error);
//       }
//     },
//     [appState, walletPreference]
//   );

//   const handleWithdrawUSDC = useCallback(
//     async (tradeDealId: any) => {
//       // if (!tradeDealId?.tokenId) {
//       //   console.error("Trade Deal Id is missing");
//       //   return;
//       // }
//       try {
//         const user = appState?.session?.user;
//         const walletId = user?.walletId;
//         const dfnsToken = user?.dfns_token;
//         const tradeDealId = 10;
//         const amount = 10;
//         const usdcPrice = parseUnits(amount.toString(), 6);

//         await toast.promise(
//           async () => {
//             if (walletPreference === WalletPreference.PRIVATE) {
//               // Handle PRIVATE wallet invest
//               if (tradeDealId < 0) throw new Error("Invalid Trade Deal Id for Withdraw.");
//               const approvalTx = await BlockchainService.approve(usdcPrice);
//               if (approvalTx === "rejected") throw new Error("User rejected USDC approval");
//               await BlockchainService.tradeWithdraw(tradeDealId, amount);

//               const [updatedTokens, updatedWithdrawals] = await Promise.all([
//                 KronosCustomerService.getTokensForUser(user.walletAddress),
//                 KronosCustomerService.getWithdrawalsForUser(user.walletAddress),
//               ]);
//               // setTokens(updatedTokens);
//               // setWithdrawals(updatedWithdrawals);
//               // setSelectedToken(filteredTokens.some((t) => t.tokenId == token.tokenId) ? token : filteredTokens[0]);
//             } else if (walletPreference === WalletPreference.MANAGED) {
//               // Handle MANAGED wallet withdrawal
//               if (!walletId || !dfnsToken) {
//                 throw "No wallet or DFNS token available for Withdraw.";
//               }

//               // Step 1: Initiate the invest process
//               const { initiateResponse: withdrawResponse, error: withdrawInitiateError } = await TradeFinanceService.initiateTradeWithdrawUSDC(
//                 tradeDealId,
//                 amount,
//                 walletId,
//                 dfnsToken
//               );

//               if (withdrawInitiateError) {
//                 throw "WithdrawInitiateError: " + withdrawInitiateError;
//               }

//               // Step 2: Complete the invest process
//               const { completeResponse: withdrawCompleteResponse, error: completeWithdrawError } =
//                 await TradeFinanceService.completeTradeWithdrawUSDC(walletId, dfnsToken, withdrawResponse.challenge, withdrawResponse.requestBody);

//               if (completeWithdrawError) {
//                 throw "CompleteWithdrawError: " + completeWithdrawError;
//               }
//               const [updatedTokens, updatedWithdrawals] = await Promise.all([
//                 KronosCustomerService.getTokensForUser(user.walletAddress),
//                 KronosCustomerService.getWithdrawalsForUser(user.walletAddress),
//               ]);

//               // setTokens(updatedTokens);
//               // setWithdrawals(updatedWithdrawals);
//               // setSelectedToken(filteredTokens.some((t) => t.tokenId == token.tokenId) ? token : filteredTokens[0]);
//             } else {
//               throw "Invalid wallet preference.";
//             }
//           },
//           {
//             pending: "Processing Withdraw...",
//             success: "Trade deal withdrawn successfully.",
//             error: {
//               render({ data }: { data: any }) {
//                 return <div>{data?.reason || data || "An error occurred during withdraw."}</div>;
//               },
//             },
//           }
//         );
//       } catch (error: any) {
//         console.error("Failed to withdraw trade deal:", error);
//       }
//     },
//     //[appState, walletPreference, setTokens, setWithdrawals, setSelectedToken, filteredTokens]
//     [appState, walletPreference]
//   );

//   return (
//     <div className="p-4 rounded-lg">
//       <div className="flex justify-between items-center p-3 rounded-lg border border-gray-300 bg-white shadow-sm mb-3">
//         {/* Left Section: Search & Filters */}
//         <div className="flex items-center gap-3">
//           {/* Search Bar */}
//           <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
//             <SearchNormal1 size="20" className="text-gray-500" />
//             <input
//               type="text"
//               placeholder="Search by Stock ID"
//               className="bg-transparent ml-2 w-40 focus:outline-none text-gray-900"
//               onChange={handleSearchChange}
//               value={searchText}
//             />
//           </div>

//           {/* Dropdown Filters */}
//           <Select
//             placeholder="Issuance Date"
//             className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500"
//           />
//           <Select placeholder="Held By" className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500" />
//           <Select
//             placeholder="Maturity Date"
//             className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500"
//           />
//           <Select placeholder="Company" className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500" />
//           {/* <Select placeholder="Shareholder" className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500" /> */}

//           {/* Item Count */}
//           <span className="font-medium text-gray-700">4 Items</span>
//         </div>

//         {/* Right Section: Action Buttons & View Toggle */}

//         {type.toLowerCase() === "swap" && (
//           <div className="flex items-center gap-3">
//             <div>
//               <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium" onClick={handleWithdrawUSDC}>
//                 Swap Collateral Token to USDC
//               </button>
//               {/* <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium ml-2">Swap Dividend Token to USDC</button> */}
//             </div>
//           </div>
//         )}

//         {type.toLowerCase() === "invest" && (
//           <div className="flex items-center justify-end w-full mr-4">
//             <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium" onClick={handleDepositUSDC}>
//               Invest in Pool
//             </button>
//           </div>
//         )}

//         <div className="flex items-center gap-1">
//           {/* View Toggle Icons */}
//           <button
//             onClick={() => setViewMode("table")}
//             className={`p-2 rounded-md ${viewMode === "table" ? "bg-gray-200 text-blue-600" : "text-gray-500"}`}
//           >
//             <RowVertical size="20" variant={viewMode === "table" ? "Bold" : "Linear"} />
//           </button>
//           <button
//             onClick={() => setViewMode("card")}
//             className={`p-2 rounded-md ${viewMode === "card" ? "bg-gray-200 text-blue-600" : "text-gray-500"}`}
//           >
//             <Category size="20" variant={viewMode === "card" ? "Bold" : "Linear"} />
//           </button>
//         </div>
//       </div>

//       {viewMode === "table" ? <StockTableView stocks={filteredData} /> : <StockCardView stocks={filteredData} />}
//     </div>
//   );
// };

// export default StockListPage;
