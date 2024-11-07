import React, { useEffect, useState, useMemo } from "react";
import PubSub from "pubsub-js";
import { NomyxEvent, WalletPreference } from "@/utils/Constants";
import { useGemforceApp } from "@/context/GemforceAppContext";
import { Button, Card, Modal, Tabs, Table } from "antd";
import KronosCustomerService from "@/services/KronosCustomerService";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import TokenCardView from "@/components/marketplace/TokenCardView";
import TokenListView from "@/components/marketplace/TokenListView";
import MarketPlaceTokenDetail from "./MarketPlaceTokenDetail";
import { SearchNormal1, Category, RowVertical, ArrowLeft } from "iconsax-react";
import projectBackground from "@/images/projects_background.png"; // Import the background image
import BlockchainService from "@/services/BlockchainService";
import { ethers } from "ethers";

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onBack }) => {
  const router = useRouter();
  const { appState }: any = useGemforceApp();
  const [listings, setListings] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedListings, setSelectedListings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<string>("table");
  const [showStats, setShowStats] = useState(true);
  const [selectedToken, setSelectedToken] = useState<any | null>(null);
  const walletPreference = appState?.session?.user?.walletPreference;

  const searchAllProperties = (item: any, query: string): boolean => {
    const searchInObject = (obj: any): boolean => {
      for (let key in obj) {
        const value = obj[key];
        if (
          typeof value === "string" &&
          value.toLowerCase().includes(query.toLowerCase())
        ) {
          return true;
        } else if (
          typeof value === "number" &&
          value.toString().includes(query)
        ) {
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

  // Memoize the filtered listings and sales
  const filteredListings = useMemo(() => {
    return listings.filter((listing) =>
      searchAllProperties(listing, searchQuery)
    );
  }, [listings, searchQuery]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => searchAllProperties(sale, searchQuery));
  }, [sales, searchQuery]);

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

  const handleCloseModal = () => {
    setShowPurchaseModal(false);
  };

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
        // Fetch listed tokens from the blockchain service
        const listedTokens = await BlockchainService?.fetchItems();
        if (!listedTokens) {
          console.warn("No listed tokens fetched.");
          return;
        }

        // Create a Set of listed token IDs for efficient lookup
        const listedTokenIds = new Set(
          listedTokens.map((token: any) => String(token["1"]))
        );

        // Function to filter listings based on project ID and listedTokenIds
        const filterListings = (dataListings: any) => {
          return dataListings.filter(
            (listing: any) =>
              listing.token?.projectId === project?.id &&
              listedTokenIds.has(String(listing.token.tokenId))
          );
        };

        // Function to filter sales based on project ID
        const filterSales = (dataSales: any) => {
          return dataSales
            .filter((sale: any) => sale.token?.projectId === project.id)
            .map((sale: any) => {
              return {
                ...sale,
                price:
                  Number(sale.token.price) * Number(sale.token.existingCredits),
              };
            });
        };

        // Handle Listings
        if (!listings?.length) {
          // Subscribe to state changes for listings
          const listingsSubscription = PubSub.subscribe(
            NomyxEvent.GemforceStateChange,
            (event, data) => {
              if (data.listings) {
                const filtered = filterListings(data.listings);
                setListings(filtered);
                PubSub.unsubscribe(listingsSubscription);
              }
            }
          );

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
          const salesSubscription = PubSub.subscribe(
            NomyxEvent.GemforceStateChange,
            (event, data) => {
              if (data.sales) {
                const filtered = filterSales(data.sales);
                setSales(filtered);
                PubSub.unsubscribe(salesSubscription);
              }
            }
          );

          if (appState.sales) {
            const initialFiltered = filterSales(appState.sales);
            setSales(initialFiltered);
          } else {
            setSales([]);
          }
        }
      } catch (error) {
        console.error("Error fetching or filtering listings:", error);
      }
    };

    // Invoke the asynchronous function
    fetchAndFilterListings();
  }, [
    appState,
    listings?.length,
    sales?.length,
    project.id,
    setListings,
    setSales,
  ]);

  const fetchListings = async () => {
    const newListingData = await KronosCustomerService.getListings();
    if (newListingData) {
      setListings(
        newListingData.filter(
          ({ token: { projectId } }: { token: { projectId: string } }) =>
            projectId === project.id
        )
      );
    } else {
      setListings([]);
    }
  };

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

      const { initiateResponse: approvalResponse, error: approvalError } =
        await KronosCustomerService.initiateApproval(
          walletId,
          price, //needs to be a string here to send to the server
          dfnsToken
        );

      if (approvalError) {
        throw approvalError;
      }

      // Step 2: Complete Approval
      const {
        completeResponse: approvalCompleteResponse,
        error: completeApprovalError,
      } = await KronosCustomerService.completeApproval(
        walletId,
        dfnsToken,
        approvalResponse.challenge,
        approvalResponse.requestBody
      );

      if (completeApprovalError) {
        throw completeApprovalError;
      }

      // Step 3: Initiate Purchase
      const {
        initiateResponse: purchaseResponse,
        error: purchaseInitiateError,
      } = await KronosCustomerService.initiatePurchase(
        walletId,
        tokenId,
        dfnsToken
      );

      if (purchaseInitiateError) {
        throw purchaseInitiateError;
      }

      // Step 4: Complete Purchase
      const {
        completeResponse: purchaseCompleteResponse,
        error: completePurchaseError,
      } = await KronosCustomerService.completePurchase(
        walletId,
        dfnsToken,
        purchaseResponse.challenge,
        purchaseResponse.requestBody
      );

      if (completePurchaseError) {
        throw completePurchaseError;
      }

      // Success: Clear all pending states and store final response
      let response = purchaseCompleteResponse;
    } catch (error: any) {
      //toast.error("Error during approval and purchase process:" + error + "");
      throw error;
    } finally {
    }
  };

  // Function to handle individual token purchase
  const handleIndividualPurchase = async (token: any) => {
    toast.promise(
      async () => {
        try {
          const processPurchase = async () => {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            setListings((prevListings) =>
              prevListings.filter((item) => item.tokenId !== token.tokenId)
            );
            await fetchSales(); // Refresh sales list if needed
            await appState.refreshTokens();
          };

          if (walletPreference == WalletPreference.PRIVATE) {
            var response = await BlockchainService.purchaseTokens([token]);
            if (response == "rejected") {
              throw "The purchase was rejected.";
            }
            await processPurchase();
          } else if (walletPreference === WalletPreference.MANAGED) {
            // Call dfns if user is using managed wallet
            console.log("Inside individual purchase with managed wallet");
            try {
              await handleApprovalAndPurchase(token.tokenId, token.price);
              await processPurchase();
            } catch (e: any) {
              throw e;
            }
          } else {
            throw "Invalid wallet preference";
          }
        } catch (e: any) {
          console.log(e);
          throw e;
        }
      },
      {
        pending: `Purchasing token ${token.tokenId}...`,
        success: `Successfully purchased token ${token.tokenId}`,
        error: {
          render({ data }: { data: any }) {
            return (
              <div>
                {data?.reason ||
                  data?.message ||
                  data ||
                  `An error occurred while purchasing token ${token.tokenId}`}
              </div>
            );
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

    toast.promise(
      async () => {
        try {
          const processSelectedPurchase = async () => {
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Simulate delay
            // Remove purchased tokens from listings
            setListings((prevListings) =>
              prevListings.filter(
                (item) =>
                  !selectedListings.find(
                    (selected) => selected.tokenId === item.tokenId
                  )
              )
            );
            setSelectedListings([]); // Clear the selected listings after purchase
            await fetchSales(); // Refresh sales list if needed
            await appState.refreshTokens();
          };

          if (walletPreference == WalletPreference.PRIVATE) {
            var response = await BlockchainService.purchaseTokens(
              selectedListings
            );
            if (response == "rejected") {
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
            } catch (e: any) {
              throw e;
            }
          } else {
            throw "Invalid wallet preference";
          }
        } catch (e: any) {
          console.log(e);
          throw e;
        }
      },
      {
        pending: "Purchasing selected tokens...",
        success: "Successfully purchased selected tokens",
        error: {
          render({ data }: { data: any }) {
            return (
              <div>
                {data?.reason ||
                  data ||
                  "An error occurred while purchasing selected tokens"}
              </div>
            );
          },
        },
      }
    );
  };

  const handleNextToken = () => {
    const currentIndex = filteredListings.findIndex(
      (listing) => listing.tokenId === selectedToken.tokenId
    );
    // Move to the next token, or loop to the first if at the end
    const nextIndex = (currentIndex + 1) % filteredListings.length;
    setSelectedToken(filteredListings[nextIndex]);
  };

  const handlePreviousToken = () => {
    const currentIndex = filteredListings.findIndex(
      (listing) => listing.tokenId === selectedToken.tokenId
    );
    // Move to the previous token, or loop to the last if at the beginning
    const prevIndex =
      (currentIndex - 1 + filteredListings.length) % filteredListings.length;
    setSelectedToken(filteredListings[prevIndex]);
  };

  const totalTokens = listings.length + sales.length;
  return (
    <div className="project-details">
      {selectedToken ? (
        <>
          {/* Token Detail View */}
          <MarketPlaceTokenDetail
            token={selectedToken}
            tokens={filteredListings}
            currentIndex={filteredListings.findIndex(
              (listing) => listing.tokenId === selectedToken.tokenId
            )}
            next={handleNextToken}
            prev={handlePreviousToken}
            onBack={handleBackToListings}
            onPurchaseToken={handleIndividualPurchase}
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
                onClick={onBack} // Use the onBack function to reset the view
                className="absolute top-4 left-4 bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark rounded-md flex items-center px-4 py-2 shadow-md"
              >
                <ArrowLeft size="24" className="mr-2" />
                Back
              </button>

              {/* Project Image, Title, and Description */}
              <div className="absolute bottom-4 left-0 flex items-center p-4 rounded-lg">
                {/* Project Image */}
                <div
                  className="project-logo rounded-lg overflow-hidden"
                  style={{ width: "100px", height: "100px" }}
                >
                  <img
                    src={project.coverImage?.url()}
                    alt="Project Logo"
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Project Title and Description */}
                <div className="text-white flex-1 mx-4">
                  <h1 className="text-3xl font-bold">{project.title}</h1>
                  <p className="text-sm mt-2 max-w-md break-words">
                    {project.description}
                  </p>
                </div>
              </div>

              {/* Project Stats (Hide when screen width is small enough to cause overlap) */}
              <div
                className={`absolute bottom-4 right-4 flex flex-nowrap space-x-4 bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark p-4 rounded-lg shadow-md transition-opacity duration-500 ${
                  showStats ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                style={{ overflow: "hidden" }}
              >
                <div className="stat-item bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark p-3 rounded-lg text-center">
                  <span className="text-sm">Credit Type</span>
                  <h2 className="text-lg font-bold">Carbon Credit</h2>
                </div>
                <div className="stat-item bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark p-3 rounded-lg text-center">
                  <span className="text-sm">Carbon Offset (Tons)</span>
                  <h2 className="text-lg font-bold">787,988,450</h2>
                </div>
                <div className="stat-item bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark p-3 rounded-lg text-center">
                  <span className="text-sm">Tokenization Date</span>
                  <h2 className="text-lg font-bold">8.21.21</h2>
                </div>
                <div className="stat-item bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark p-3 rounded-lg text-center">
                  <span className="text-sm">Total Tokens</span>
                  <h2 className="text-lg font-bold">{totalTokens}</h2>
                </div>
              </div>
            </div>

            {/* Header Section with Search Bar */}
            <div className="flex justify-between items-center p-2 rounded-lg bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark mt-4">
              {/* Search Bar */}
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

              {/* View Toggle and Purchase Selected Button */}
              <div className="flex items-center">
                {/* Purchase Selected Button */}
                <Button
                  type="primary"
                  className="mr-4 !text-white"
                  onClick={handlePurchaseSelectedTokens}
                >
                  Purchase Selected
                </Button>

                {/* View Toggle Buttons */}
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-0.5 rounded-sm mr-2 ${
                    viewMode === "card"
                      ? "bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-blue-light"
                      : ""
                  }`}
                >
                  <Category
                    size="20"
                    variant={viewMode === "card" ? "Bold" : "Linear"}
                  />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-0.5 rounded-sm ${
                    viewMode === "table"
                      ? "bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-blue-light"
                      : ""
                  }`}
                >
                  <RowVertical
                    size="20"
                    variant={viewMode === "table" ? "Bold" : "Linear"}
                  />
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
                    label: "Current Listings",
                    children: (
                      <>
                        {viewMode === "table" ? (
                          <TokenListView
                            projects={filteredListings}
                            onProjectClick={handleDetailsClick}
                            onSelectionChange={setSelectedListings}
                            onPurchaseToken={handleIndividualPurchase}
                            isSalesHistory={false}
                          />
                        ) : (
                          <TokenCardView
                            projects={filteredListings}
                            onProjectClick={handleDetailsClick}
                            onSelectionChange={setSelectedListings}
                            onPurchaseToken={handleIndividualPurchase}
                            isSalesHistory={false}
                          />
                        )}
                      </>
                    ),
                  },
                  {
                    key: "2",
                    label: "Sales History",
                    children:
                      viewMode === "table" ? (
                        <TokenListView
                          projects={filteredSales}
                          onProjectClick={handleDetailsClick}
                          isSalesHistory={true}
                        />
                      ) : (
                        <TokenCardView
                          projects={filteredSales}
                          onProjectClick={handleDetailsClick}
                          isSalesHistory={true}
                        />
                      ),
                  },
                ]}
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
export default ProjectDetails;
