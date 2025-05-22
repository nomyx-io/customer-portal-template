import React, { useEffect, useState, useMemo, useCallback } from "react";

import { Button, Card, Modal, Tabs, Table, Select, InputNumber, ConfigProvider } from "antd";
import { ethers, parseUnits } from "ethers";
import { SearchNormal1, Category, RowVertical, ArrowLeft } from "iconsax-react";
import Image from "next/image";
import PubSub from "pubsub-js";
import { toast } from "react-toastify";

import TokenCardView from "@/components/marketplace/TokenCardView";
import TokenListView from "@/components/marketplace/TokenListView";
import TokenDetail from "@/components/TokenDetail";
import { Industries, actions } from "@/config/generalConfig";
import { useGemforceApp } from "@/context/GemforceAppContext";
import projectBackground from "@/images/projects_background.png";
import BlockchainService from "@/services/BlockchainService";
import KronosCustomerService from "@/services/KronosCustomerService";
import ParseService from "@/services/ParseService";
import TradeFinanceService from "@/services/TradeFinanceService";
import { NomyxEvent, WalletPreference } from "@/utils/Constants";
import { formatNumber } from "@/utils/numberFormatter";

import HistoryListPage from "../Pool/PoolDetails/History/HistoryListPage";
import RedeemedVABBListPage from "../Pool/PoolDetails/History/RedeemedVABBListPage";

interface ProjectDetailsProps {
  project: Parse.Object<Project>;
  onBack: () => void;
  type?: string;
}

interface ProjectInfoField {
  key: string;
  value: string;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onBack, type = "invest" }) => {
  const { appState }: any = useGemforceApp();
  const [listings, setListings] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedListings, setSelectedListings] = useState<any[]>([]);
  const [projectStockList, setProjectStockList] = useState<any[]>([]);
  const [projectInfo, setProjectInfo] = useState<Array<{ key: string; value: string }>>([]);
  const [activeTab, setActiveTab] = useState("1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<string>("table");
  const [showStats, setShowStats] = useState(true);
  const [selectedToken, setSelectedToken] = useState<any | null>(null);
  const walletPreference = appState?.session?.user?.walletPreference;
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [isSwapUSDCModalOpen, setIsSwapUSDCModalOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState<number | null>(null);
  const [usdcAmount, setUSDCAmount] = useState<number | null>(null);

  const searchAllProperties = (item: any, query: string): boolean => {
    const searchInObject = (obj: any): boolean => {
      for (let key in obj) {
        const value = obj[key];
        if (typeof value === "string" && value.toLowerCase().includes(query.toLowerCase())) {
          return true;
        } else if (typeof value === "number" && value.toString().includes(query)) {
          return true;
        } else if (typeof value === "object" && value !== null) {
          if (searchInObject(value)) {
            return true;
          }
        }
      }
      return false;
    };

    return searchInObject(item);
  };

  // Memoize the filtered listings, sales, and stocks
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => searchAllProperties(listing, searchQuery));
  }, [listings, searchQuery]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => searchAllProperties(sale, searchQuery));
  }, [sales, searchQuery]);

  const filteredStocks = useMemo(() => {
    return projectStockList.filter((stock) => searchAllProperties(stock, searchQuery));
  }, [projectStockList, searchQuery]);

  // Cleanup Listings/Stocks object to pass just tokens to the MarketPlaceTokenDetail component
  const tokens = useMemo(() => {
    if (project.attributes.industryTemplate === Industries.TRADE_FINANCE) {
      return filteredStocks.map((stock) => stock);
    }
    return filteredListings.map((listing) => listing.token);
  }, [filteredListings, filteredStocks, project.attributes.industryTemplate]);

  // Handle search bar input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    // Function to handle window resize
    const handleResize = () => {
      if (window.innerWidth < 1500) {
        setShowStats(false); // Hide stats on small screens
      } else {
        setShowStats(true); // Show stats on larger screens
      }
    };

    // Set initial visibility
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleDetailsClick = (token: any) => {
    setSelectedToken(token);
  };

  const handleBackToListings = () => {
    setSelectedToken(null);
  };

  useEffect(() => {
    if (!appState) return;

    // Define an asynchronous function inside useEffect
    const fetchAndFilterListings = async () => {
      try {
        // For trade finance projects, fetch stocks instead of listings
        if (project.attributes.industryTemplate === Industries.TRADE_FINANCE) {
          // Parse project info for trade finance projects
          try {
            const parsedProjectInfo = JSON.parse(project.attributes.projectInfo || "[]");
            setProjectInfo(parsedProjectInfo);
          } catch (error) {
            console.error("Error parsing project info:", error);
            setProjectInfo([]);
          }
          const projectTokens = await ParseService.getRecords("Token", ["projectId"], [project.id], ["*"]);
          if (projectTokens) {
            const sanitizedTokens = projectTokens.map((token: Parse.Object<any>) => ({
              ...token.attributes,
              id: token.id,
              tokenId: token.get("tokenId"),
              projectId: token.get("projectId"),
              price: token.get("price"),
              existingCredits: token.get("existingCredits"),
            }));
            setProjectStockList(sanitizedTokens);
          } else {
            setProjectStockList([]);
          }
          return;
        }

        // For other projects, fetch listed tokens
        const listedTokens = await BlockchainService?.fetchItems();
        if (!listedTokens) {
          console.warn("No listed tokens fetched.");
          return;
        }

        // Create a Set of listed token IDs for efficient lookup
        const listedTokenIds = new Set(listedTokens.map((token: any) => String(token["1"])));

        // Function to filter listings based on project ID and listedTokenIds
        const filterListings = (dataListings: any) => {
          return dataListings.filter((listing: any) => listing.token?.projectId === project?.id && listedTokenIds.has(String(listing.token.tokenId)));
        };

        // Function to filter sales based on project ID
        const filterSales = (dataSales: any) => {
          return dataSales
            .filter((sale: any) => sale.token?.projectId === project.id)
            .map((sale: any) => {
              return {
                ...sale,
                price: Number(sale.token.price) * Number(sale.token.existingCredits),
              };
            });
        };

        // Handle Listings
        if (!listings?.length) {
          // Subscribe to state changes for listings
          const listingsSubscription = PubSub.subscribe(NomyxEvent.GemforceStateChange, (event, data) => {
            if (data.listings) {
              const filtered = filterListings(data.listings);
              setListings(filtered);
              PubSub.unsubscribe(listingsSubscription);
            }
          });

          // Initial setting of listings from appState
          if (appState.listings) {
            const initialFiltered = filterListings(appState.listings);
            setListings(initialFiltered);
          } else {
            setListings([]);
          }
        }

        // Handle Sales
        if (!sales?.length) {
          // Subscribe to state changes for sales
          const salesSubscription = PubSub.subscribe(NomyxEvent.GemforceStateChange, (event, data) => {
            if (data.sales) {
              const filtered = filterSales(data.sales);
              setSales(filtered);
              PubSub.unsubscribe(salesSubscription);
            }
          });

          if (appState.sales) {
            const initialFiltered = filterSales(appState.sales);
            setSales(initialFiltered);
          } else {
            setSales([]);
          }
        }

        const parsedProjectInfo = JSON.parse(project.attributes?.projectInfo);
        setProjectInfo(parsedProjectInfo);
      } catch (error) {
        console.error("Error fetching or filtering listings:", error);
      }
    };

    // Invoke the asynchronous function
    fetchAndFilterListings();
  }, [appState, listings?.length, sales?.length, project.id, setListings, setSales]);

  const fetchSales = async () => {
    const newSalesData = await KronosCustomerService.getSales("");
    setSales(newSalesData || []);
  };

  const handleApprovalAndPurchase = async (tokenId: any, price: any) => {
    try {
      const user = appState?.session?.user;
      const walletId = user?.walletId;
      const dfnsToken = user?.dfns_token;
      if (!walletId) {
        throw "No wallets found for approval or purchase";
      }

      if (!dfnsToken) {
        throw "No DFNS token available";
      }

      // convert to USDC decimals
      const usdcPrice = ethers.parseUnits(price, 6); // Dont need this cause convert on the other side

      console.log("Initiating approval and purchase for token:", tokenId);
      console.log("Wallet ID:", walletId);
      console.log("DFNS Token:", dfnsToken);
      console.log("Price:", price);

      const { initiateResponse: approvalResponse, error: approvalError } = await KronosCustomerService.initiateApproval(
        walletId,
        price, //needs to be a string here to send to the server
        dfnsToken
      );

      if (approvalError) {
        throw approvalError;
      }

      // Step 2: Complete Approval
      const { completeResponse: approvalCompleteResponse, error: completeApprovalError } = await KronosCustomerService.completeApproval(
        walletId,
        dfnsToken,
        approvalResponse.challenge,
        approvalResponse.requestBody
      );

      if (completeApprovalError) {
        throw completeApprovalError;
      }

      // Step 3: Initiate Purchase
      const { initiateResponse: purchaseResponse, error: purchaseInitiateError } = await KronosCustomerService.initiatePurchase(
        walletId,
        tokenId,
        dfnsToken
      );

      if (purchaseInitiateError) {
        throw purchaseInitiateError;
      }

      // Step 4: Complete Purchase
      const { completeResponse: purchaseCompleteResponse, error: completePurchaseError } = await KronosCustomerService.completePurchase(
        walletId,
        dfnsToken,
        purchaseResponse.challenge,
        purchaseResponse.requestBody
      );

      if (completePurchaseError) {
        throw completePurchaseError;
      }

      // Success: refresh token list data
      setListings((prevListings) => {
        const updatedListings = prevListings.filter((item) => item.tokenId !== tokenId);
        console.log("Updated Listings:", updatedListings);
        return [...updatedListings];
      });

      // Wait for state update before API calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await fetchSales();

      // Introduce a delay before refreshing tokens
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 4 seconds
      await appState.refreshTokens();
    } catch (error) {
      //toast.error("Error during approval and purchase process:" + error + "");
      throw error;
    } finally {
    }
  };

  const showInvestModal = () => {
    setIsInvestModalOpen(true);
  };

  const handleInvestCancel = () => {
    setIsInvestModalOpen(false);
  };

  const showSwapUSDCModal = () => {
    setIsSwapUSDCModalOpen(true);
  };

  const handleSwapUSDCCancel = () => {
    setIsSwapUSDCModalOpen(false);
  };

  // Function to handle individual token purchase

  const handleIndividualPurchase = async (token: any) => {
    await toast.promise(
      async () => {
        try {
          const onComplete = async () => {
            setListings((prevListings) => prevListings.filter((item) => item.tokenId !== token.tokenId));
            await fetchSales();
            await appState.refreshTokens();
          };

          const processPurchase = await actions.handleIndividualPurchase(token, walletPreference, handleApprovalAndPurchase);

          await processPurchase(onComplete);
        } catch (error) {
          console.error("Error during purchase:", error);
          throw error;
        }
      },
      {
        pending: `Purchasing token ${token.tokenId}...`,
        success: `Successfully purchased token ${token.tokenId}`,
        error: {
          render({ data }: { data: any }) {
            if (data instanceof Error) {
              return <div>{data.message}</div>;
            } else {
              const reason = (data as { reason?: string })?.reason;
              return <div>{reason || `An unknown error occurred while purchasing token ${token.tokenId}`}</div>;
            }
          },
        },
      }
    );
  };

  // Function to handle purchase of selected tokens
  const handlePurchaseSelectedTokens = async () => {
    if (selectedListings.length === 0) {
      toast.error("No tokens selected to purchase.");
      return;
    }

    await toast.promise(
      async () => {
        try {
          const processSelectedPurchase = async () => {
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Simulate delay
            // Remove purchased tokens from listings
            setListings((prevListings) => prevListings.filter((item) => !selectedListings.find((selected) => selected.tokenId === item.tokenId)));
            setSelectedListings([]); // Clear the selected listings after purchase
            await fetchSales(); // Refresh sales list if needed
            await appState.refreshTokens();
          };

          if (walletPreference == WalletPreference.PRIVATE) {
            var response = await BlockchainService.purchaseTokens(selectedListings);
            // Check if any tokens were rejected during the purchase process
            if (Array.isArray(response) && response.some((item) => item.status === "rejected")) {
              throw "The purchase was rejected.";
            } else {
              await processSelectedPurchase();
            }
          } else if (walletPreference === WalletPreference.MANAGED) {
            // Call dfns if user is using managed wallet
            try {
              for (let listing of selectedListings) {
                await handleApprovalAndPurchase(listing.tokenId, listing.price);
              }
              await processSelectedPurchase();
            } catch (e) {
              throw e;
            }
          } else {
            throw "Invalid wallet preference";
          }
        } catch (e) {
          console.log(e);
          throw e;
        }
      },
      {
        pending: "Purchasing selected tokens...",
        success: "Successfully purchased selected tokens",
        error: {
          render({ data }: { data: any }) {
            return <div>{data?.reason || data || "An error occurred while purchasing selected tokens"}</div>;
          },
        },
      }
    );
  };

  const totalTokens = listings.length + sales.length;
  //const totalValue = listings?.reduce((acc, token) => acc + Number(token?.price), 0) || 0;

  const totalListingValue = listings?.reduce((sum, item) => {
    const tokenPrice = parseFloat(item.token?.price || 0); // Safely get the token price and handle undefined
    return sum + tokenPrice;
  }, 0);

  const totalSalesValue = sales?.reduce((sum, item) => {
    const tokenPrice = parseFloat(item.token?.price || 0); // Safely get the token price and handle undefined
    return sum + tokenPrice;
  }, 0);

  const handleSwapUSDC = useCallback(
    async (tradeDealId: number, vabbAmount: any) => {
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
              if (tradeDealId < 0) throw new Error("Invalid Trade Deal Id for Swap.");
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
                throw "No wallet or DFNS token available for Swap.";
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
            pending: "Processing Swap...",
            success: "Trade deal swapped successfully.",
            error: {
              render({ data }: { data: any }) {
                return <div>{data?.reason || data || "An error occurred during swap."}</div>;
              },
            },
          }
        );
      } catch (error: any) {
        console.error("Failed to swap trade deal:", error);
      }
    },
    //[appState, walletPreference, setTokens, setWithdrawals, setSelectedToken, filteredTokens]
    [appState, walletPreference]
  );

  const handleDepositUSDC = useCallback(
    async (tradeDealId: number, investAmount: number) => {
      try {
        const user = appState?.session?.user;
        const walletId = user?.walletId;
        const dfnsToken = user?.dfns_token;
        const amount = investAmount;
        // Convert amount to USDC format early
        const usdcPrice = parseUnits(amount.toString(), 6);

        await toast.promise(
          async () => {
            if (walletPreference === WalletPreference.PRIVATE) {
              // Step 1: Approve USDC
              const approvalTx = await BlockchainService.approve(usdcPrice);
              if (approvalTx === "rejected") throw new Error("User rejected USDC approval");

              // Step 2: Deposit USDC into trade deal
              await BlockchainService.tradeInvest(tradeDealId, amount);

              const [updatedTokens, updatedWithdrawals] = await Promise.all([
                KronosCustomerService.getTokensForUser(user.walletAddress),
                KronosCustomerService.getWithdrawalsForUser(user.walletAddress),
              ]);
              // Optional UI state update
              // setTokens(updatedTokens);
              // setWithdrawals(updatedWithdrawals);
              setIsInvestModalOpen(false);
            } else if (walletPreference === WalletPreference.MANAGED) {
              if (!walletId || !dfnsToken) {
                throw "No wallet or DFNS token available for Deposit.";
              }

              const baseUnitAmount = (Number(amount) * 1000000).toString();

              // 💳 Step 0: Initiate Approval
              const { initiateResponse: approvalResponse, error: approvalError } = await KronosCustomerService.initiateApproval(
                walletId,
                baseUnitAmount,
                dfnsToken
              );

              if (approvalError) {
                throw "ApprovalInitiateError: " + approvalError;
              }

              // ✅ Step 1: Complete Approval
              const { completeResponse: approvalCompleteResponse, error: completeApprovalError } = await KronosCustomerService.completeApproval(
                walletId,
                dfnsToken,
                approvalResponse.challenge,
                approvalResponse.requestBody
              );

              if (completeApprovalError) {
                throw "ApprovalCompleteError: " + completeApprovalError;
              }

              // 💸 Step 2: Initiate Deposit
              const { initiateResponse: depositResponse, error: depositInitiateError } = await TradeFinanceService.initiateTradeInvestUSDC(
                tradeDealId,
                amount.toString(), // again, make sure this is a string
                walletId,
                dfnsToken
              );

              if (depositInitiateError) {
                throw "DepositInitiateError: " + depositInitiateError;
              }

              // 🧾 Step 3: Complete Deposit
              const { completeResponse: depositCompleteResponse, error: completeDepositError } = await TradeFinanceService.completeTradeInvestUSDC(
                walletId,
                dfnsToken,
                depositResponse.challenge,
                depositResponse.requestBody
              );

              if (completeDepositError) {
                throw "CompleteDepositError: " + completeDepositError;
              }

              const [updatedTokens, updatedWithdrawals] = await Promise.all([
                KronosCustomerService.getTokensForUser(user.walletAddress),
                KronosCustomerService.getWithdrawalsForUser(user.walletAddress),
              ]);
              // Optional UI state update
              // setTokens(updatedTokens);
              // setWithdrawals(updatedWithdrawals);
              setIsInvestModalOpen(false);
            } else {
              throw "Invalid wallet preference.";
            }
          },
          {
            pending: "Processing deposit...",
            success: "Trade deal deposited successfully.",
            error: {
              render({ data }: { data: any }) {
                return <div>{data?.reason || data || "An error occurred during deposit."}</div>;
              },
            },
          }
        );
      } catch (error: any) {
        console.error("Failed to deposit trade deal:", error);
      }
    },
    [appState, walletPreference]
  );

  return (
    <div className="project-details">
      {selectedToken ? (
        <>
          {/* Token Detail View */}
          <TokenDetail
            tokens={tokens}
            currentIndex={tokens.findIndex((t) => t.tokenId === selectedToken.tokenId)}
            project={project}
            onBack={handleBackToListings}
            onTokenAction={handleIndividualPurchase}
            tokenActionLabel="Purchase"
          />
        </>
      ) : (
        <>
          {/* Project Details View */}
          <div className="project-details">
            {/* Project Header Section */}
            <div
              className="project-header relative p-6 rounded-lg"
              style={{
                backgroundImage: `url(${projectBackground.src})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                height: "500px",
              }}
            >
              {/* Back Button */}
              <button
                onClick={onBack}
                className="absolute top-4 left-4 sm:left-auto sm:right-4 lg:left-4 bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark rounded-md flex items-center px-4 py-2 shadow-md w-[100px]"
              >
                <ArrowLeft size="24" className="mr-2" />
                Back
              </button>

              {/* Project Image, Title, and Description */}
              <div className="absolute sm:-bottom-2 bottom-4 left-0 md:flex md:flex-row flex-col items-start md:items-center p-4 rounded-lg w-full">
                {/* Project Image */}
                <div className="project-logo rounded-lg overflow-hidden flex-shrink-0" style={{ width: "100px", height: "100px" }}>
                  <Image src={project.attributes.logo?.url()} width={100} height={25} alt="Project Logo" className="object-cover w-full h-full" />
                </div>
                {/* Project Title and Description */}
                <div className="text-white flex-1 mx-4 mt-4 md:mt-0">
                  <h1 className="text-3xl font-bold">{project.attributes.title}</h1>
                  <p className="text-sm mt-2 max-w-md break-words">{project.attributes.description}</p>
                </div>

                {/* Project Stats (Moves below on small screens) */}
                {Array.isArray(projectInfo) && projectInfo.length > 0 && (
                  <div
                    className={`mt-6 md:mt-0 grid grid-cols-2 md:grid-cols-4 gap-4 bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark p-4 rounded-lg shadow-md transition-opacity duration-500 opacity-100`}
                    style={{ maxWidth: "100%", overflow: "hidden" }}
                  >
                    {projectInfo.map((item, index) => (
                      <div key={index} className="stat-item bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark p-3 rounded-lg text-center">
                        <span className="text-sm">{item.key}</span>
                        <h2 className="text-lg font-bold">{item.value}</h2>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Header Section with Search Bar */}
            <div className="flex justify-between items-center p-2 rounded-lg bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark mt-4">
              {/* Search Bar */}
              {project.attributes.industryTemplate !== Industries.TRADE_FINANCE ? (
                <div className="bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark flex-shrink-0 w-64 flex items-center rounded-sm h-8 py-1 px-2">
                  <SearchNormal1 size="24" />
                  <input
                    type="text"
                    placeholder="Search all columns"
                    className="bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark ml-2 w-full focus:outline-none"
                    onChange={handleSearchChange}
                    value={searchQuery}
                  />
                </div>
              ) : (
                // Left Section: Search & Filters
                <div className="flex items-center gap-3">
                  {/* Search Bar */}
                  <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
                    <SearchNormal1 size="20" className="text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by Stock ID"
                      className="bg-transparent ml-2 w-40 focus:outline-none text-gray-900"
                      onChange={handleSearchChange}
                      value={searchQuery}
                    />
                  </div>

                  {/* Dropdown Filters */}
                  <Select
                    placeholder="Issuance Date"
                    className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500"
                  />
                  <Select
                    placeholder="Held By"
                    className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500"
                  />
                  <Select
                    placeholder="Maturity Date"
                    className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500"
                  />
                  <Select
                    placeholder="Company"
                    className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500"
                  />

                  {/* Item Count */}
                  {/* <span className="font-medium text-gray-700">4 Items</span> */}
                </div>
              )}

              {/* View Toggle and Purchase Selected Button */}
              {project.attributes.industryTemplate !== Industries.TRADE_FINANCE ? (
                <div className="flex items-center justify-end w-full mr-4">
                  {/* Purchase Selected Button */}
                  <Button type="primary" className="mr-4 !text-white" onClick={handlePurchaseSelectedTokens}>
                    Purchase Selected
                  </Button>
                </div>
              ) : (
                <>
                  {type.toLowerCase() === "swap" && (
                    <div className="flex items-center justify-end w-full mr-4">
                      <div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium" onClick={showSwapUSDCModal}>
                          Swap Collateral Token to USDC
                        </button>
                        {/* <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium ml-2">Swap Dividend Token to USDC</button> */}
                      </div>
                    </div>
                  )}

                  {type.toLowerCase() === "invest" && (
                    <div className="flex items-center justify-end w-full mr-4">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium" onClick={showInvestModal}>
                        Invest in Pool
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* View Toggle Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-0.5 rounded-sm mr-2 ${
                    viewMode === "card" ? "bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-blue-light" : ""
                  }`}
                >
                  <Category size="20" variant={viewMode === "card" ? "Bold" : "Linear"} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-0.5 rounded-sm ${viewMode === "table" ? "bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-blue-light" : ""}`}
                >
                  <RowVertical size="20" variant={viewMode === "table" ? "Bold" : "Linear"} />
                </button>
              </div>
            </div>

            {/* Content Section */}
            <Card className="no-padding border-nomyx-gray4-light dark:border-nomyx-gray4-dark bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark mt-4">
              <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key)}
                className="nftTabs"
                items={[
                  {
                    key: "1",
                    label: project.attributes.industryTemplate === Industries.TRADE_FINANCE ? "Stocks" : "Current Listings",
                    children: (
                      <>
                        {viewMode === "table" ? (
                          <TokenListView
                            projects={project.attributes.industryTemplate === Industries.TRADE_FINANCE ? filteredStocks : filteredListings}
                            onProjectClick={handleDetailsClick}
                            onSelectionChange={setSelectedListings}
                            onPurchaseToken={handleIndividualPurchase}
                            isSalesHistory={false}
                            industryTemplate={project.attributes.industryTemplate}
                          />
                        ) : (
                          <TokenCardView
                            projects={project.attributes.industryTemplate === Industries.TRADE_FINANCE ? filteredStocks : filteredListings}
                            onProjectClick={handleDetailsClick}
                            onSelectionChange={setSelectedListings}
                            onPurchaseToken={handleIndividualPurchase}
                            isSalesHistory={false}
                            industryTemplate={project.attributes.industryTemplate}
                          />
                        )}
                      </>
                    ),
                  },
                  ...(project.attributes.industryTemplate === Industries.TRADE_FINANCE
                    ? [
                        {
                          key: "2",
                          label: "History",
                          children: <HistoryListPage />,
                        },
                      ]
                    : []),
                  ...(project.attributes.industryTemplate === Industries.TRADE_FINANCE && type == "swap"
                    ? [
                        {
                          key: "3",
                          label: "Redeemed Collateral Token",
                          children: <RedeemedVABBListPage />,
                        },
                        // {
                        //   key: "4",
                        //   label: "Redeemed VABI",
                        //   children: <HistoryListPage />,
                        // },
                      ]
                    : []),
                  ...(project.attributes.industryTemplate !== Industries.TRADE_FINANCE
                    ? [
                        {
                          key: "2",
                          label: "Sales History",
                          children:
                            viewMode === "table" ? (
                              <TokenListView projects={filteredSales} onProjectClick={handleDetailsClick} isSalesHistory={true} />
                            ) : (
                              <TokenCardView
                                projects={filteredSales}
                                onProjectClick={handleDetailsClick}
                                isSalesHistory={true}
                                industryTemplate={project.attributes.industryTemplate}
                              />
                            ),
                        },
                      ]
                    : []),
                ]}
              />
            </Card>
          </div>
        </>
      )}

      <ConfigProvider
        theme={{
          token: {
            colorBgElevated: "#ffffff", // Light theme modal background
            colorText: "#000000", // Light theme text
          },
        }}
      >
        <Modal
          title="Invest in Pool"
          open={isInvestModalOpen}
          onCancel={handleInvestCancel}
          footer={[
            <Button key="cancel" onClick={handleInvestCancel} className="text-gray-700 dark:text-gray-300">
              Cancel
            </Button>,
            <Button
              key="submit"
              type="default"
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
              onClick={() => handleDepositUSDC(project.attributes.tradeDealId, investAmount || 0)}
              disabled={!investAmount}
            >
              Submit
            </Button>,
          ]}
          maskClosable={false}
          className="custom-modal"
        >
          <p className="dark:text-white">Enter the amount you want to invest in the pool:</p>
          <InputNumber
            min={1}
            value={investAmount}
            onChange={setInvestAmount}
            placeholder="Enter amount"
            className="w-2/3 mt-3 bg-white dark:bg-black"
          />
        </Modal>

        <Modal
          title="Swap to USDC"
          open={isSwapUSDCModalOpen}
          onCancel={handleSwapUSDCCancel}
          footer={[
            <Button key="cancel" onClick={handleSwapUSDCCancel} className="text-gray-700 dark:text-gray-300 focus:bg-none">
              Cancel
            </Button>,
            <Button
              key="submit"
              type="default"
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
              onClick={() => handleSwapUSDC(project.attributes.tradeDealId, usdcAmount || 0)}
              disabled={!usdcAmount}
            >
              Submit
            </Button>,
          ]}
          maskClosable={false}
          className="custom-modal"
        >
          <p className="dark:text-white">Enter the amount you want Swap to USDC:</p>
          <InputNumber min={1} value={usdcAmount} onChange={setUSDCAmount} placeholder="Enter amount" className="w-2/3 mt-3 bg-white dark:bg-black" />
        </Modal>
      </ConfigProvider>
    </div>
  );
};
export default ProjectDetails;
