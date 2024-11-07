import { Button, Card, Tabs, Carousel } from "antd/es";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import ItemActivity from "@/components/ItemActivitySection";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useGemforceApp } from "@/context/GemforceAppContext";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { hashToColor } from "@/utils/colorUtils";
import BlockchainService from "@/services/BlockchainService";
import { formatPrice } from "@/utils/currencyFormater";

dayjs.extend(isBetween);

export default function MarketPlaceTokenDetail({
  token,
  tokens,
  currentIndex,
  next,
  prev,
  onBack,
  onPurchaseToken,
}: any) {
  const carouselRef: any = useRef(null);
  const color = hashToColor(token?.tokenId || "default");
  const { appState }: any = useGemforceApp();
  const walletPreference = appState?.session?.user?.walletPreference;
  const [claimDisabled, setClaimDisabled] = React.useState(true);
  const [tokenBalance, setTokenBalance] = React.useState(0);
  const [claimError, setClaimError] = React.useState();
  const [yieldGenerated, setYieldGenerated] = React.useState(0);
  const tokenData = token?.token || {};
  const [carbonCreditBalance, setCarbonCreditBalance] = useState<number | null>(
    null
  );
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [activeSlide, setActiveSlide] = useState<number>(currentIndex);

  const contentStyle: React.CSSProperties = {
    margin: 0,
    // color: '#fff',
  };

  useEffect(() => {
    setClaimDisabled(claimError || token.balance <= 0);
    setTokenBalance(token.balance);
  }, [token, claimError, tokenBalance]);

  const calculateMonthsRemaining = () => {
    const originationDate = new Date(token.originationDate);
    const currentDate = new Date();
    const termMonths = parseInt(token.term, 10); // Assuming term is provided in months

    const monthsElapsed =
      (currentDate.getFullYear() - originationDate.getFullYear()) * 12 +
      (currentDate.getMonth() - originationDate.getMonth());
    return termMonths - monthsElapsed;
  };

  const monthsRemaining = calculateMonthsRemaining();

  const fetchCarbonCreditBalance = useCallback(async (tokenId: number) => {
    try {
      const balance = await BlockchainService.getCarbonCreditBalance(tokenId);
      setCarbonCreditBalance(balance);
    } catch (error) {
      console.error("Failed to fetch carbon credit balance:", error);
    }
  }, []);

  useEffect(() => {
    const fetchInitialCarbonCredits = async () => {
      // Check if token exists
      if (tokens[currentIndex] && tokens[currentIndex].token) {
        setLoadingCredits(true); // Set loading to true before fetching

        await fetchCarbonCreditBalance(tokens[currentIndex].token.tokenId);

        setLoadingCredits(false); // Set loading to false after fetching
      }
    };

    fetchInitialCarbonCredits();
  }, [tokens, currentIndex, fetchCarbonCreditBalance]);

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

  const handleNext = () => {
    carouselRef?.current?.next();
  };

  const handlePrev = () => {
    carouselRef?.current?.prev();
  };

  const handleAfterChange = useCallback((current: number) => {
    setActiveSlide(current);
    if(tokens[current] && tokens[current].token) {
      fetchCarbonCreditBalance(tokens[current].token.tokenId);
    }
  }, [fetchCarbonCreditBalance, tokens]);

  return (
    <div className="p-4 dark:bg-nomyx-dark1-dark dark:text-white bg-white text-gray-900">
      {/* Header Section with Token Title, Navigation Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        className="mb-6"
      >
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center px-4 py-2 shadow-md rounded-md transition 
                    bg-white dark:bg-nomyx-dark2-dark text-gray-900 dark:text-white border 
                    dark:border-gray-700
                    !hover:bg-white !dark:hover:bg-gray-800 !hover:text-gray-900 !dark:hover:text-white"
        >
          <ArrowLeftOutlined className="mr-2" />
          Back
        </button>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button type="text" className="px-2 py-0" onClick={handlePrev}>
            <LeftOutlined style={{ fontSize: "20px", color: "black" }} />
          </Button>
          <Button type="text" className="px-2 py-0" onClick={handleNext}>
            <RightOutlined style={{ fontSize: "20px", color: "black" }} />
          </Button>
        </div>
      </div>

      {/* Carousel Section */}
      <Carousel
        ref={carouselRef}
        dots={false}
        initialSlide={currentIndex}
        afterChange={handleAfterChange}
      >
        {tokens.map((tokenObj: any, index: number) => {
          const token = tokenObj.token; // Access the inner token object
          const color = hashToColor(token?.tokenId || "default"); // Generate SVG based on tokenId
          const totalCost =
            parseInt(token.price) * parseInt(token.existingCredits);

          return (
            <div key={index}>
              {/* Main Content Section */}
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
                            label: "Price Per Credit:",
                            value: `${formatPrice(token.price, "USD")}`,
                          },
                          {
                            label: "Existing Credits:",
                            value: `${formatPrice(token.existingCredits, "USD")}`,
                          },
                          {
                            label: "Total Cost:",
                            value: `${formatPrice(totalCost, "USD")}` || "Calculating...",
                          },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="flex flex-wrap items-center"
                          >
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
                      <div className="text-gray-900 dark:text-white font-bold text-lg mb-2">
                        Carbon Credits:
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {carbonCreditBalance !== null
                          ? Intl.NumberFormat("en-US").format(carbonCreditBalance)
                          : "Loading..."}
                      </div>
                      <button
                        className="w-full mt-4 bg-blue-500 text-white font-bold py-3 px-6 rounded-md transition hover:bg-blue-700 hover:brightness-110 flex items-center justify-center border-none"
                        onClick={() =>
                          onPurchaseToken && onPurchaseToken(token)
                        }
                      >
                        Purchase
                      </button>
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
                      {
                        label: "Auditor",
                        value: token?.auditor || "Auditor Name",
                      },
                      {
                        label: "Registry ID",
                        value: token?.registerId || "526654649",
                      },
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
                        {token?.country || "Italy"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="w-1/3 text-gray-600 dark:text-gray-300 font-semibold">
                        State:
                      </label>
                      <span className="w-full bg-white dark:bg-nomyx-dark2-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 shadow-md rounded-md px-4 py-2 hover:bg-white dark:hover:bg-gray-800">
                        {token?.state || "California"}
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
                        value: token?.creditsPre2020 || "234234",
                      },
                      {
                        label: "2021 Credits",
                        value: token?.credits2021 || "95",
                      },
                      {
                        label: "2022 Credits",
                        value: token?.credits2022 || "90",
                      },
                      {
                        label: "2023 Credits",
                        value: token?.credits2023 || "100",
                      },
                      {
                        label: "2024 Credits",
                        value: token?.credits2024 || "102",
                      },
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
              {activeSlide === index && (
              <Tabs
                className="nftTabs mt-10"
                items={[
                  {
                    key: "1",
                    label: "Activity",
                    children: (
                      <>
                        <ItemActivity token={token} />
                      </>
                    ),
                  },
                ]}
              ></Tabs>
              )}
            </div>
          );
        })}
      </Carousel>
    </div>
  );
}
