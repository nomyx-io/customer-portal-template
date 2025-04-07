import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { Button, Tabs, Carousel } from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { ArrowLeft2, ArrowRight2, ArrowLeft } from "iconsax-react";

import ItemActivity from "@/components/ItemActivitySection";
import ProjectInfo from "@/components/marketplace/ProjectInfo";
import { carbonCreditFields } from "@/config/carbonCreditConfig";
import { Industries, projectInfoComponents } from "@/config/generalConfig";
import { tokenizedDebtFields } from "@/config/tokenizedDebtConfig";
import { tradeFinanceFields } from "@/config/tradeFinanceConfig";
import BlockchainService from "@/services/BlockchainService";
import { hashToColor } from "@/utils/colorUtils";
import { formatPrice } from "@/utils/currencyFormater";

dayjs.extend(isBetween);

interface TokenDetailProps {
  tokens: any[];
  currentIndex: number;
  project: Parse.Object<Project>;
  onBack?: () => void;
  onTokenAction: (token: any) => void;
  tokenActionLabel: string;
  onSlideChange?: (token: any) => void;
}

const TokenDetail: React.FC<TokenDetailProps> = ({ tokens, currentIndex, project, onBack, onTokenAction, tokenActionLabel, onSlideChange }) => {
  const carouselRef: any = useRef(null);

  const [carbonCreditBalance, setCarbonCreditBalance] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState<number>(currentIndex);
  const [combinedFields, setCombinedFields] = useState<any[]>([]);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);

  const fetchCarbonCreditBalance = useCallback(async (tokenId: number) => {
    try {
      const balance = await BlockchainService.getCarbonCreditBalance(tokenId);
      setCarbonCreditBalance(balance);
    } catch (error) {
      console.error("Failed to fetch carbon credit balance:", error);
    }
  }, []);

  const fetchTokenBalance = useCallback(async (tokenId: number) => {
    try {
      const balance = await BlockchainService.getTokenBalances([tokenId]);
      setTokenBalance(balance);
    } catch (error) {
      console.error("Failed to fetch token balance:", error);
    }
  }, []);

  useEffect(() => {
    const fetchInitialCarbonCredits = async () => {
      // Check if token exists
      if (tokens[currentIndex]) {
        await fetchCarbonCreditBalance(tokens[currentIndex].tokenId);
      }
    };

    const fetchTokenBalanceValue = async () => {
      // Check if token exists
      if (tokens[currentIndex]) {
        await fetchTokenBalance(tokens[currentIndex].tokenId);
      }
    };

    fetchInitialCarbonCredits();
    fetchTokenBalanceValue();
  }, [tokens, currentIndex, fetchCarbonCreditBalance, fetchTokenBalance]);

  const updateFields = useCallback(() => {
    const defaultFields: any = project?.attributes.fields || [];
    const industryFields = projectInfoComponents[project?.attributes.industryTemplate as keyof typeof projectInfoComponents]?.fields || [];
    setCombinedFields([...defaultFields, ...industryFields]);
  }, [project]);

  useEffect(() => {
    updateFields();
  }, [updateFields, project, activeSlide]);

  const generateSvgIcon = (color: string) => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 560 560">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor="#003366" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="560" height="560" rx="15" fill={`url(#gradient-${color})`} />
        <text
          x="50%"
          y="50%" // Adjusted to bring text to vertical center
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize="300"
          fill="white"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          N
        </text>
      </svg>
    );
  };

  const handleNext = () => {
    setCarbonCreditBalance(null);
    setTokenBalance(null);
    carouselRef?.current?.next();
  };

  const handlePrev = () => {
    setCarbonCreditBalance(null);
    setTokenBalance(null);
    carouselRef?.current?.prev();
  };

  const handleAfterChange = useCallback(
    (current: number) => {
      setActiveSlide(current);
      if (tokens[current]) {
        fetchCarbonCreditBalance(tokens[current].tokenId);

        if (onSlideChange) {
          onSlideChange(tokens[current]);
        }
        fetchTokenBalance(tokens[current].tokenId);
      }
    },
    [fetchCarbonCreditBalance, tokens, onSlideChange, fetchTokenBalance]
  );

  const includeFields = useMemo(
    () => [
      {
        key: "title",
        label: "Title",
      },
      {
        key: "description",
        label: "Description",
      },
      {
        key: "issuanceDate",
        label: "Issuance Date",
        formatter: (value: string) => dayjs(value).format("MM-DD-YYYY"),
      },
      {
        key: "price",
        label: "Price",
        formatter: (value: string) => `${formatPrice(Number(value), "USD")}`,
      },
    ],
    []
  );

  const formatValueByType = (type: string, value: any): React.ReactNode => {
    // chek if value is undefined or null or empty
    if (value === undefined || value === null || (type === "string" && typeof value === "string" && value.trim() === "")) return "N/A";

    switch (type) {
      case "string":
        // If the string is a URL, render it as a link
        if (/^(http|https):\/\/[^ "]+$/.test(value)) {
          return (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
              {value}
            </a>
          );
        }
        return value.toString();

      case "number":
        return formatPrice(Number(value), "USD");

      case "date":
        return dayjs(value).format("MM-DD-YYYY");

      // Add more cases as needed for other types

      default:
        return value.toString();
    }
  };

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
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center px-4 py-2 shadow-md rounded-md transition 
                      bg-white dark:bg-nomyx-dark2-dark text-gray-900 dark:text-white border 
                      dark:border-gray-700
                      !hover:bg-white !dark:hover:bg-gray-800 !hover:text-gray-900 !dark:hover:text-white"
          >
            <ArrowLeft className="mr-2" />
            Back
          </button>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button type="text" className="px-2 py-0" onClick={handlePrev}>
            <ArrowLeft2 style={{ fontSize: "20px" }} />
          </Button>
          <Button type="text" className="px-2 py-0" onClick={handleNext}>
            <ArrowRight2 style={{ fontSize: "20px" }} />
          </Button>
        </div>
      </div>

      {/* Carousel Section */}
      <Carousel ref={carouselRef} dots={false} initialSlide={currentIndex} afterChange={handleAfterChange}>
        {tokens.map((token: any, index: number) => {
          const color = hashToColor(token?.tokenId || "default"); // Generate SVG based on tokenId

          return (
            <div key={index}>
              {/* Main Content Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Token Image Section */}
                <div className="flex items-center justify-center">{generateSvgIcon(color)}</div>

                {/* Title and Description Section */}
                <div className="flex flex-col justify-start">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{token?.nftTitle || "Token"}</h2>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Project: {token?.projectName || "Project 1"}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{token?.description || "Description text..."}</p>
                </div>

                {/* Render Industry-Specific Component */}
                {projectInfoComponents[project?.attributes.industryTemplate as keyof typeof projectInfoComponents]?.component({
                  token,
                  combinedFields,
                  includeFields,
                  carbonCreditBalance,
                  onTokenAction,
                  tokenActionLabel,
                  tokenBalance,
                })}
              </div>

              {/* Project Info Section */}
              <div className="mt-10">
                <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-6 bg-white dark:bg-nomyx-dark2-dark">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Token Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {includeFields.map((field) => {
                      const value = token[field.key];
                      // Skip rendering if the value is undefined or null
                      if (value === undefined || value === null) return null;

                      return (
                        <div key={field.key} className="flex items-center gap-4">
                          <label className="w-1/3 text-gray-600 dark:text-gray-300 font-semibold">{field.label}:</label>
                          <span className="w-full bg-white dark:bg-nomyx-dark2-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 shadow-md rounded-md px-4 py-2 hover:bg-white dark:hover:bg-gray-800">
                            {field.formatter ? field.formatter(value) : value.toString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metadata Section */}
                <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-nomyx-dark2-dark">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Metadata Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {combinedFields.length > 0 ? (
                      combinedFields.map((field: any) => {
                        const value = token[field.key];
                        return (
                          <div key={field.key} className="flex items-center gap-4">
                            <label className="w-1/3 text-gray-600 dark:text-gray-300 font-semibold">{field.name}:</label>
                            <span className="w-full bg-white dark:bg-nomyx-dark2-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 shadow-md rounded-md px-4 py-2 hover:bg-white dark:hover:bg-gray-800">
                              {formatValueByType(field.type, value)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400">No metadata available.</div>
                    )}
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
};

export default TokenDetail;
