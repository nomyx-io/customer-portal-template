import React, { useState, useEffect, useRef, useCallback } from "react";

import { ArrowLeftOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Card, Tabs, Carousel } from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

import ItemActivity from "@/components/ItemActivitySection";
import BlockchainService from "@/services/BlockchainService";
import KronosCustomerService from "@/services/KronosCustomerService";
import { hashToColor } from "@/utils/colorUtils";
import { formatPrice } from "@/utils/currencyFormater";
dayjs.extend(isBetween);

interface TokenDetailProps {
  tokens: any[];
  currentIndex: number;
  onBack?: () => void;
  onTokenAction: (token: any) => void;
  tokenActionLabel: string;
}

const TokenDetail: React.FC<TokenDetailProps> = ({ tokens, currentIndex, onBack, onTokenAction, tokenActionLabel }) => {
  const carouselRef: any = useRef(null);

  const [carbonCreditBalance, setCarbonCreditBalance] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState<number>(currentIndex);

  // State variables for project data
  const [project, setProject] = useState<any>(null);
  const projectCacheRef = useRef<{ [key: string]: any }>({});

  console.log("tokens", tokens);
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
      if (tokens[currentIndex]) {
        await fetchCarbonCreditBalance(tokens[currentIndex].tokenId);
      }
    };

    fetchInitialCarbonCredits();
  }, [tokens, currentIndex, fetchCarbonCreditBalance]);

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

  const handleAfterChange = useCallback(
    (current: number) => {
      setActiveSlide(current);
      if (tokens[current]) {
        fetchCarbonCreditBalance(tokens[current].tokenId);
      }
    },
    [fetchCarbonCreditBalance, tokens]
  );

  // Define an includeFields array for Token Info
  const includeFields: {
    key: any;
    label: string;
    formatter?: (value: any) => React.ReactNode;
  }[] = [
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
  ];

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

  // Function to fetch project data based on projectId with caching
  const fetchProjectData = useCallback(async (projectId: string) => {
    // Check if project is already cached
    if (projectCacheRef.current[projectId]) {
      setProject(projectCacheRef.current[projectId]);
      return;
    }

    try {
      // Fetch projects by IDs (assuming KronosCustomerService returns an array)
      const response = await KronosCustomerService.getProjectsByIds([projectId]);

      const fetchedProject = response[0];

      // Parse fields if they are a JSON string
      let parsedFields = [];
      if (typeof fetchedProject.attributes.fields === "string") {
        try {
          parsedFields = JSON.parse(fetchedProject.attributes.fields);
        } catch (error) {
          console.error("Failed to parse project attributes.fields:", error);
          parsedFields = [];
        }
      } else if (Array.isArray(fetchedProject.attributes.fields)) {
        parsedFields = fetchedProject.attributes.fields;
      } else {
        parsedFields = [];
      }

      // Update the project object with parsed fields
      const updatedProject = {
        ...fetchedProject,
        attributes: {
          ...fetchedProject.attributes,
          fields: parsedFields,
        },
      };

      // Cache the fetched project
      projectCacheRef.current[projectId] = updatedProject;

      setProject(updatedProject);
    } catch (error) {
      console.error("Failed to fetch project data:", error);
    }
  }, []);

  // Fetch project data whenever the active slide changes
  useEffect(() => {
    const currentTokenObj = tokens[activeSlide];
    if (currentTokenObj) {
      fetchProjectData(currentTokenObj.projectId);
    }
  }, [activeSlide, tokens, fetchProjectData]);

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
            <ArrowLeftOutlined className="mr-2" />
            Back
          </button>
        )}

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
      <Carousel ref={carouselRef} dots={false} initialSlide={currentIndex} afterChange={handleAfterChange}>
        {tokens.map((token: any, index: number) => {
          const color = hashToColor(token?.tokenId || "default"); // Generate SVG based on tokenId
          const totalCost = parseInt(token.price) * parseInt(token.existingCredits);

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

                {/* Pricing Info Section */}
                <div className="flex flex-col justify-start mt-10 md:mt-0">
                  <Card className="border dark:border-gray-700 border-gray-300 bg-gray-100 dark:bg-nomyx-dark2-dark p-6 rounded-lg shadow-md">
                    <div className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing Info</h3>
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
                          <div key={index} className="flex flex-wrap items-center">
                            <span className="font-semibold w-full md:w-1/2">{item.label}</span>
                            <span className="bg-white dark:bg-nomyx-dark2-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 shadow-md px-4 py-2 rounded-md w-full md:w-1/2 mt-1 md:mt-0 overflow-hidden text-ellipsis whitespace-nowrap">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="text-gray-900 dark:text-white font-bold text-lg mb-2">Carbon Credits:</div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {carbonCreditBalance !== null ? Intl.NumberFormat("en-US").format(carbonCreditBalance) : "Loading..."}
                      </div>
                      <button
                        className="w-full mt-4 bg-blue-500 text-white font-bold py-3 px-6 rounded-md transition hover:bg-blue-700 hover:brightness-110 flex items-center justify-center border-none"
                        onClick={() => onTokenAction && onTokenAction(token)}
                      >
                        {tokenActionLabel}
                      </button>
                    </div>
                  </Card>
                </div>
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

                {/* Credit Info Section */}
                <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-nomyx-dark2-dark">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Metadata Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {project && Array.isArray(project.attributes.fields) && project.attributes.fields.length > 0 ? (
                      project.attributes.fields.map((field: any) => {
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
