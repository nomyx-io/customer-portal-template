// wip with older functionality to be used in updated styles, replacing dummy data
import { Button, Card, Tabs } from "antd/es";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Popover, Input, Select, DatePicker, Button as AntButton } from "antd";
import { FilterOutlined, CloseCircleOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import ItemActivity from "@/components/ItemActivitySection";
import InterestClaimHistory from "@/components/InterestClaimHistory";
import BlockchainService from "@/services/BlockchainService";
import { useGemforceApp } from "@/context/GemforceAppContext";
import Parse from "parse";
import { toast } from "react-toastify";
import { hashToColor } from "@/utils/colorUtils";
import ListingRedemptionHistory from "@/components/ListingRedemptionHistory";
import { useRouter } from "next/navigation";
import KronosCustomerService from "@/services/KronosCustomerService";
import { WalletPreference } from "@/utils/Constants";
import { formatPrice } from "@/utils/currencyFormater";

dayjs.extend(isBetween);


export default function TokenDetail({ token, next, prev, onSuccess }: any) {
  const { appState }: any = useGemforceApp();
  const walletPreference = appState?.session?.user?.walletPreference;
  const walletAddress = appState?.session?.user?.walletAddress;
  const [claimDisabled, setClaimDisabled] = React.useState(true);
  const [tokenBalance, setTokenBalance] = React.useState(0);
  const [claimError, setClaimError] = React.useState();
  const [claimClicked, setClaimClicked] = React.useState(false);
  const [yieldGenerated, setYieldGenerated] = React.useState(0);
  const contentStyle: React.CSSProperties = {
    margin: 0,
    // color: '#fff',
  };
  const router = useRouter();

  const generateSvgIcon = (color: string) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 560 560"
      >
        <defs>
          <linearGradient
            id={`gradient-${color}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor="#003366" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect
          width="560"
          height="560"
          rx="15"
          fill={`url(#gradient-${color})`}
        />
        <text
          x="50%"
          y="50%" // Adjusted to bring text to vertical center
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize="300" // Increased font size to make "KC" bigger
          fill="white"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          KC
        </text>
      </svg>
    );
  };

  const fetchCarbonCreditBalance = async (tokenId: number) => {
    try {
      const balance = await BlockchainService.getCarbonCreditBalance(tokenId);
      setCarbonCreditBalance(balance);
    } catch (error) {
      console.error("Failed to fetch carbon credit balance:", error);
    }
  };

  useEffect(() => {
    if (token?.tokenId) {
      fetchCarbonCreditBalance(token.tokenId);
    }
  }, [token?.tokenId]);

  const calculateYieldGenerated = async () => {
    // Check if the token has withdrawals and calculate the sum
    const totalYield =
      token.withdrawals?.reduce(
        (acc: any, withdrawal: any) => acc + parseFloat(withdrawal.amount),
        0
      ) || 0;
    setYieldGenerated(totalYield);
  };

  useEffect(() => {
    setClaimDisabled(claimError || token.balance <= 0);
    setTokenBalance(token.balance);
    calculateYieldGenerated();
  }, [token, claimError, tokenBalance]);

  const retireAllCredits = async (token: any) => {
    if (!token?.tokenId) {
      console.error("Token Id is missing");
      return;
    }

    try {
      const user = appState?.session?.user;
      const walletId = user?.walletId;
      const dfnsToken = user?.dfns_token;

      // Fetch the current carbon credit balance
      const tokenId = token.tokenId;
      const balance = await BlockchainService.getCarbonCreditBalance(tokenId);

      // Check if the balance is valid
      if (balance !== null && balance > 0) {
        toast.promise(
          async () => {
            if (walletPreference === WalletPreference.PRIVATE) {
              // Handle PRIVATE wallet retire process
              await BlockchainService.retireCarbonCredits(tokenId, balance);
              setCarbonCreditBalance(0); // Update the UI to reflect balance changes
              onSuccess({ ...token });
            } else if (walletPreference === WalletPreference.MANAGED) {
              // Handle MANAGED wallet retire process using DFNS
              if (!walletId || !dfnsToken) {
                throw "No wallet or DFNS token available for retirement.";
              }

              // Step 1: Initiate the retirement process for MANAGED wallet
              const {
                initiateResponse: retireResponse,
                error: retireInitiateError,
              } = await KronosCustomerService.initiateRetire(
                walletId,
                tokenId,
                balance.toString(), // Passing the amount to retire
                dfnsToken
              );

              if (retireInitiateError) {
                throw "RetireInitiateError: " + retireInitiateError;
              }

              // Step 2: Complete the retirement process for MANAGED wallet
              const {
                completeResponse: retireCompleteResponse,
                error: completeRetireError,
              } = await KronosCustomerService.completeRetire(
                walletId,
                dfnsToken,
                retireResponse.challenge,
                retireResponse.requestBody
              );

              if (completeRetireError) {
                throw "CompleteRetireError: " + completeRetireError;
              }

              setCarbonCreditBalance(0); // Update the UI to reflect balance changes
              onSuccess({ ...token });
            } else {
              throw "Invalid wallet preference";
            }
          },
          {
            pending: "Retiring carbon credits...",
            success: `${balance} carbon credits retired successfully`,
            error: {
              render({ data }: { data: any }) {
                return (
                  <div>
                    {data?.reason ||
                      data ||
                      "An error occurred during the retirement process."}
                  </div>
                );
              },
            },
          }
        );
      } else {
        console.log("No carbon credits available to retire.");
      }
    } catch (error) {
      console.error("Failed to retire carbon credits:", error);
    }
  };

  // State to hold filter values
  const [carbonCreditBalance, setCarbonCreditBalance] = useState<number | null>(
    null
  );

  // Filtered Redemption History Data
  // const filteredRedemptionData = redemptionHistory.filter((item) => {
  //   const matchesRecord = recordFilter
  //     ? item.objectId.includes(recordFilter)
  //     : true;
  //   const matchesDate =
  //     redemptionDateRange[0] && redemptionDateRange[1]
  //       ? dayjs(item.createdAt).isBetween(
  //           redemptionDateRange[0],
  //           redemptionDateRange[1],
  //           null,
  //           "[]"
  //         )
  //       : true;
  //   const matchesAmount =
  //     minAmount !== null && maxAmount !== null
  //       ? item.amount >= minAmount && item.amount <= maxAmount
  //       : true;

  //   return matchesRecord && matchesDate && matchesAmount;
  // });

  const tabItems = [
    {
      key: "1",
      label: "Activity",
      children: (
        <div>
          {/* Use the dynamic ItemActivity component */}
          <ItemActivity token={token} shouldApplyActivityFilter={true} />
        </div>
      ),
    },
  ];

  const color = hashToColor(token?.tokenId || "default");

  return (
    <div className="p-4 dark:bg-nomyx-dark1-dark dark:text-white bg-white text-gray-900">
      {/* Header Section with Token Title, Navigation Buttons, and Redeem Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between", // Space between title and buttons
          alignItems: "center",
        }}
        className="mb-6"
      >
        {/* Title and Description */}
        <div className="flex items-center overflow-hidden"></div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button type="text" className="px-2 py-0" onClick={prev}>
            <LeftOutlined style={{ fontSize: "20px", color: "black" }} />
          </Button>
          <Button type="text" className="px-2 py-0" onClick={next}>
            <RightOutlined style={{ fontSize: "20px", color: "black" }} />
          </Button>
        </div>
      </div>

      {/* Rest of the Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Token Image Section */}
        <div className="flex items-center justify-center">
          {generateSvgIcon(color)}
        </div>

        {/* Title and Description Section */}
        <div className="flex flex-col justify-start">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {token?.nftTitle || "Token"}
          </h2>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Project: {token?.projectName || "Project 1"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {token?.description || "Description text..."}
          </p>
        </div>

        {/* Pricing Info Section */}
        <div className="flex flex-col justify-start mt-10 md:mt-0">
          <Card className="border dark:border-gray-700 border-gray-300 bg-gray-100 dark:bg-nomyx-dark2-dark p-6 rounded-lg shadow-md">
            <div className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pricing Info
              </h3>
              <div className="text-gray-800 dark:text-gray-200 space-y-4">
                {[
                  {
                    label: "Price Per Credits:",
                    value: `${formatPrice(token.price, "USD")}`,
                  },
                  {
                    label: "Existing Credits:",
                    value: `${formatPrice(token.existingCredits, "USD")}`,
                  },
                  // { label: "Subtotal:", value: "$105,000" },
                  // { label: "Discount:", value: "5%" },
                  {
                    label: "Total:",
                    value: `${formatPrice(
                      parseInt(token.price) * parseInt(token.existingCredits),
                      "USD"
                    )}`,
                  },
                ].map((item, index) => (
                  <div key={index} className="flex flex-wrap items-center">
                    <span className="font-semibold w-full md:w-1/2">
                      {item.label}
                    </span>
                    <span className="bg-white dark:bg-nomyx-dark2-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 shadow-md px-4 py-2 rounded-md w-full md:w-1/2 mt-1 md:mt-0 overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <div className="mt-6">
                <div className="text-gray-900 dark:text-white font-bold text-lg mb-2">
                  Carbon Credits:
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {carbonCreditBalance !== null
                    ?  Intl.NumberFormat("en-US").format(carbonCreditBalance)
                    : "Loading..."}
                </div>
                <button
                  className="w-full mt-4 bg-blue-500 text-white font-bold py-3 px-6 rounded-md transition hover:bg-blue-700 hover:brightness-110 flex items-center justify-center border-none"
                  onClick={() => retireAllCredits(token)} // Pass the token object
                >
                  Retire Now
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Project Info Section */}
      <div className="mt-10">
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-6 bg-white dark:bg-nomyx-dark2-dark">
          <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
            Project Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {[
              { label: "Auditor", value: token?.auditor || "Auditor Name" },
              { label: "Registry ID", value: token?.registerId || "526654649" },
              {
                label: "Project Start Date",
                value:
                  dayjs(token?.projectStartDate).format("MM-DD-YYYY") ||
                  "09-03-2024",
              },
              {
                label: "Registry Link",
                value: token?.registryURL || "url/link/address",
              },
              {
                label: "Issuance Date",
                value:
                  dayjs(token?.issuanceDate).format("MM-DD-YYYY") ||
                  "09-03-2024",
              },
              {
                label: "GHG Reduction Type",
                value: token?.ghgReduction || "Type",
              },
            ].map((field, index) => (
              <div key={index} className="flex items-center gap-4">
                <label className="w-1/3 text-gray-600 dark:text-gray-300 font-semibold">
                  {field.label}:
                </label>
                <span className="w-full bg-white dark:bg-nomyx-dark2-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 shadow-md rounded-md px-4 py-2 hover:bg-white dark:hover:bg-gray-800">
                  {field.value}
                </span>
              </div>
            ))}
            <div className="col-span-2 mt-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Geography
              </h4>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-1/3 text-gray-600 dark:text-gray-300 font-semibold">
                Country:
              </label>
              <span className="w-full bg-white dark:bg-nomyx-dark2-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 shadow-md rounded-md px-4 py-2 hover:bg-white dark:hover:bg-gray-800">
                {token?.country || "USA"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-1/3 text-gray-600 dark:text-gray-300 font-semibold">
                State:
              </label>
              <span className="w-full bg-white dark:bg-nomyx-dark2-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 shadow-md rounded-md px-4 py-2 hover:bg-white dark:hover:bg-gray-800">
                {token?.state || "New Mexico"}
              </span>
            </div>
          </div>
        </div>

        {/* Credit Info Section */}
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-nomyx-dark2-dark">
          <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
            Credit Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {[
              {
                label: "Pre 2020 Credits",
                value: token?.creditsPre2020 || "256",
              },
              { label: "2021 Credits", value: token?.credits2021 || "95" },
              { label: "2022 Credits", value: token?.credits2022 || "90" },
              { label: "2023 Credits", value: token?.credits2023 || "100" },
              { label: "2024 Credits", value: token?.credits2024 || "102" },
              {
                label: "Estimated Annual Emissions Reduction",
                value: token?.estimatedEmissionsReduction || "102",
              },
            ].map((field, index) => (
              <div key={index} className="flex items-center gap-4">
                <label className="w-1/3 text-gray-600 dark:text-gray-300 font-semibold">
                  {field.label}:
                </label>
                <span className="w-full bg-white dark:bg-nomyx-dark2-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 shadow-md rounded-md px-4 py-2 hover:bg-white dark:hover:bg-gray-800">
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs className="nftTabs mt-10" items={tabItems} />
    </div>
  );
}
