import { useCallback, useEffect, useState } from "react";

import { DatePicker, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { parseUnits } from "ethers";
import { Category, RowVertical, SearchNormal1 } from "iconsax-react";
import { toast } from "react-toastify";

import { useGemforceApp } from "@/context/GemforceAppContext";
import BlockchainService from "@/services/BlockchainService";
import KronosCustomerService from "@/services/KronosCustomerService";
import { WalletPreference } from "@/utils/Constants";

import PoolCardView from "./PoolCardView";
import PoolTableView from "./PoolTableView";
import TradeFinanceService from "../../services/TradeFinanceService"; // Import service
import { TradeFinancePool } from "../../types/poolData";

const PoolListPage = () => {
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [pools, setPools] = useState<TradeFinancePool[]>([]); // State for fetched pools
  const { appState }: any = useGemforceApp();
  const walletPreference = appState?.session?.user?.walletPreference;

  // Fetch pools on component mount
  useEffect(() => {
    const fetchPools = async () => {
      try {
        const user = appState?.session?.user;
        if (user?.walletAddress) {
          const fetchedPools = await TradeFinanceService.getUserTradePools(user.walletAddress); // Call service method
          setPools(fetchedPools);
        }
      } catch (error) {
        console.error("Error fetching pools:", error);
      }
    };

    fetchPools();
  }, []);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Handle date range change
  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
  };

  // Filter pools based on search text and date range
  const filteredData = pools.filter((pool) => {
    const matchesSearch = pool.title.toLowerCase().includes(searchText.toLowerCase());

    if (dateRange && dateRange[0] && dateRange[1]) {
      // const startDate = dayjs(pool.startDate);
      // const maturityDate = dayjs(pool.maturityDate);
      // return matchesSearch && startDate.isAfter(dateRange[0]) && maturityDate.isBefore(dateRange[1]);
    }

    return matchesSearch;
  });

  const handleRedeemVABB = useCallback(
    async (tradeDealId: any, vabbAmount: any) => {
      // if (!tradeDealId?.tokenId) {
      //   console.error("Trade Deal Id is missing");
      //   return;
      // }
      try {
        const user = appState?.session?.user;
        const walletId = user?.walletId;
        const dfnsToken = user?.dfns_token;
        const amount = parseUnits(vabbAmount.toString(), 6);
        const collateralAmount = parseUnits(vabbAmount.toString(), 18);
        await toast.promise(
          async () => {
            if (walletPreference === WalletPreference.PRIVATE) {
              // Handle PRIVATE wallet invest
              if (tradeDealId < 0) throw new Error("Invalid Trade Deal Id for Redeem.");

              // const approvalTx = await BlockchainService.approve(amount);
              // if (approvalTx === "rejected") throw new Error("User rejected USDC approval");
              const response = await BlockchainService.redeemVABBTokens(tradeDealId, amount);
              if (!response) {
                throw "Signer is not available.";
              }

              const [updatedTokens, updatedWithdrawals] = await Promise.all([
                KronosCustomerService.getTokensForUser(user.walletAddress),
                KronosCustomerService.getWithdrawalsForUser(user.walletAddress),
              ]);
              // setTokens(updatedTokens);
              // setWithdrawals(updatedWithdrawals);
              // setSelectedToken(filteredTokens.some((t) => t.tokenId == token.tokenId) ? token : filteredTokens[0]);
            } else if (walletPreference === WalletPreference.MANAGED) {
              // Handle MANAGED wallet redemption
              if (!walletId || !dfnsToken) {
                throw "No wallet or DFNS token available for Redeem.";
              }
              // Step 1: Initiate the VABB redemption process
              const { initiateResponse: redeemResponse, error: redeemInitiateError } = await TradeFinanceService.initiateRedeemVABBTokens(
                tradeDealId,
                collateralAmount.toString(),
                walletId,
                dfnsToken
              );

              if (redeemInitiateError) {
                throw "RedeemInitiateError: " + redeemInitiateError;
              }
              // Step 2: Complete the VABB redemption process
              const { completeResponse: redeemCompleteResponse, error: completeRedeemError } = await TradeFinanceService.completeRedeemVABBTokens(
                walletId,
                dfnsToken,
                redeemResponse.challenge,
                redeemResponse.requestBody
              );

              if (completeRedeemError) {
                throw "CompleteRedeemError: " + completeRedeemError;
              }

              console.log("VABB tokens redeemed successfully:", redeemCompleteResponse);
              const [updatedTokens, updatedWithdrawals] = await Promise.all([
                KronosCustomerService.getTokensForUser(user.walletAddress),
                KronosCustomerService.getWithdrawalsForUser(user.walletAddress),
              ]);

              // setTokens(updatedTokens);
              // setWithdrawals(updatedWithdrawals);
              // setSelectedToken(filteredTokens.some((t) => t.tokenId == token.tokenId) ? token : filteredTokens[0]);
            } else {
              throw "Invalid wallet preference.";
            }
          },
          {
            pending: "Processing Redeem...",
            success: "Trade deal redeemed successfully.",
            error: {
              render({ data }: { data: any }) {
                return <div>{data?.reason || data || "An error occurred during redeem."}</div>;
              },
            },
          }
        );
      } catch (error: any) {
        console.error("Failed to redeem trade deal:", error);
      }
    },
    //[appState, walletPreference, setTokens, setWithdrawals, setSelectedToken, filteredTokens]
    [appState, walletPreference]
  );

  return (
    <div className="p-4 rounded-lg">
      {/* Search and Filter Section */}
      <div className="flex justify-between items-center p-2 rounded-lg bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark mb-4">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark flex-shrink-0 w-64 flex items-center rounded-sm h-8 py-1 px-2">
            <SearchNormal1 size="24" />
            <input
              type="text"
              placeholder="Search"
              className="bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark ml-2 w-full focus:outline-none"
              onChange={handleSearchChange}
              value={searchText}
            />
          </div>

          <Select placeholder="Start Date" className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500" />
          <Select
            placeholder="Maturity Date"
            className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500"
          />
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("table")}
            className={`p-0.5 rounded-sm ${viewMode === "table" ? "bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-blue-light" : ""}`}
          >
            <RowVertical size="20" variant={viewMode === "table" ? "Bold" : "Linear"} />
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={`p-0.5 rounded-sm ${viewMode === "card" ? "bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-blue-light" : ""}`}
          >
            <Category size="20" variant={viewMode === "card" ? "Bold" : "Linear"} />
          </button>
        </div>
      </div>
      {/* Pool List View (Table or Card) */}
      {filteredData ? (
        viewMode === "table" ? (
          <PoolTableView pools={filteredData} handleRedeemVABB={handleRedeemVABB} />
        ) : (
          <PoolCardView pools={filteredData} handleRedeemVABB={handleRedeemVABB} />
        )
      ) : (
        <p>No data found</p>
      )}
    </div>
  );
};

export default PoolListPage;
