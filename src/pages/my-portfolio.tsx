import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";

import { Tabs } from "antd/es";
import { FolderCross } from "iconsax-react";
import PubSub from "pubsub-js";
import { toast } from "react-toastify";

import ListingRetiredTokens from "@/components/ListingRetiredTokens";
import TokenDetail from "@/components/TokenDetail";
import { Industries } from "@/constants/constants";
import { useGemforceApp } from "@/context/GemforceAppContext";
import BlockchainService from "@/services/BlockchainService";
import KronosCustomerService from "@/services/KronosCustomerService";
import { NomyxEvent, WalletPreference } from "@/utils/Constants";

const ClaimInterest: React.FC = () => {
  const { appState }: any = useGemforceApp();
  const [tokens, setTokens] = useState<any[]>([]);
  const [selectedToken, setSelectedToken] = useState<any | null>(null);
  const [redemptionToken, setRedemptionToken] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const walletPreference = appState?.session?.user?.walletPreference;
  const projectCacheRef = useRef<{ [key: string]: any }>({}); // Cache for projects

  useEffect(() => {
    if (appState) {
      const subscription = PubSub.subscribe(NomyxEvent.GemforceStateChange, function (event: any, data: any) {
        if (data.tokens) setTokens(data.tokens);
      });
      setTokens(appState.tokens);

      // Cleanup subscription on unmount
      return () => {
        PubSub.unsubscribe(subscription);
      };
    }
  }, [appState]);

  useEffect(() => {
    const fetchRedemptionHistory = async () => {
      try {
        const redemptionData = await KronosCustomerService.getAllRedemptionHistoryToken();
        if (redemptionData) {
          const redemptionTokenIds = redemptionData.filter((tokenId) => !isNaN(tokenId));
          setRedemptionToken(redemptionTokenIds);
        } else {
          setRedemptionToken([]);
        }
      } catch (error) {
        console.error("Error fetching redemption history:", error);
        setRedemptionToken([]);
      }
    };
    fetchRedemptionHistory();
  }, []);

  const handleSuccess = (updatedToken: any) => {
    setRedemptionToken((prev) => [...prev, updatedToken.tokenId]); // Append the tokenId to the array
  };

  const onSuccess = useCallback((token: any) => {
    handleSuccess(token);
  }, []);

  // Ensure filteredTokens is always an array
  const filteredTokens: any[] = useMemo(
    () => (Array.isArray(tokens) ? tokens.filter((t) => !redemptionToken.includes(t.tokenId)) : []),
    [tokens, redemptionToken]
  );

  // New useEffect to set selectedToken as the first token in filteredTokens
  useEffect(() => {
    if (filteredTokens.length > 0) {
      setSelectedToken(filteredTokens[0]);
    } else {
      setSelectedToken(null);
    }
  }, [filteredTokens]);

  // Function to fetch project data based on projectId with caching
  const fetchProjectData = useCallback(async (projectId: string) => {
    if (projectCacheRef.current[projectId]) {
      setSelectedProject(projectCacheRef.current[projectId]);
      return;
    }

    try {
      const response = await KronosCustomerService.getProjectsByIds([projectId]);
      const fetchedProject = response[0];
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

      const updatedProject = {
        ...fetchedProject,
        attributes: {
          ...fetchedProject.attributes,
          fields: parsedFields,
        },
      };

      projectCacheRef.current[projectId] = updatedProject;
      setSelectedProject(updatedProject);
    } catch (error) {
      console.error("Failed to fetch project data:", error);
    }
  }, []);

  // Fetch project when selectedToken changes
  useEffect(() => {
    if (selectedToken?.projectId) {
      fetchProjectData(selectedToken.projectId);
    } else {
      setSelectedProject(null);
    }
  }, [selectedToken, fetchProjectData]);

  const handleRetireAllCredits = useCallback(
    async (token: any) => {
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
                onSuccess({ ...token });
              } else if (walletPreference === WalletPreference.MANAGED) {
                // Handle MANAGED wallet retire process using DFNS
                if (!walletId || !dfnsToken) {
                  throw "No wallet or DFNS token available for retirement.";
                }

                // Step 1: Initiate the retirement process for MANAGED wallet
                const { initiateResponse: retireResponse, error: retireInitiateError } = await KronosCustomerService.initiateRetire(
                  walletId,
                  tokenId,
                  balance.toString(), // Passing the amount to retire
                  dfnsToken
                );

                if (retireInitiateError) {
                  throw "RetireInitiateError: " + retireInitiateError;
                }

                // Step 2: Complete the retirement process for MANAGED wallet
                const { completeResponse: retireCompleteResponse, error: completeRetireError } = await KronosCustomerService.completeRetire(
                  walletId,
                  dfnsToken,
                  retireResponse.challenge,
                  retireResponse.requestBody
                );

                if (completeRetireError) {
                  throw "CompleteRetireError: " + completeRetireError;
                }

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
                  return <div>{data?.reason || data || "An error occurred during the retirement process."}</div>;
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
    },
    [appState, walletPreference, onSuccess]
  );

  const getTokenActionDetails = useCallback(
    (industry: Industries) => {
      switch (industry) {
        case Industries.CARBON_CREDIT:
          return {
            action: handleRetireAllCredits,
            label: "Retire Now",
          };
          break;
        case Industries.TRADE_FINANCE:
          return {
            action: () => {},
            label: "",
          };
          break;
        case Industries.TOKENIZED_DEBT:
          return {
            action: () => {},
            label: "",
          };
          break;
        default:
          return {
            action: () => {},
            label: "",
          };
          break;
      }
    },
    [handleRetireAllCredits]
  );

  // Get action and label for the current token
  const { action: tokenAction, label: tokenActionLabel } = useMemo(() => {
    if (selectedProject?.attributes.industryTemplate) {
      return getTokenActionDetails(selectedProject.attributes.industryTemplate);
    }
    return { action: () => {}, label: "" };
  }, [selectedProject, getTokenActionDetails]);

  const handleSlideChange = useCallback(
    (token: any) => {
      setSelectedToken(token);
      if (token.projectId) {
        fetchProjectData(token.projectId);
      } else {
        setSelectedProject(null);
      }
    },
    [fetchProjectData]
  );

  const tabItems = [
    {
      key: "1",
      label: "Available Tokens",
      children: (
        <div className="claimableTokens">
          {selectedToken ? (
            <TokenDetail
              tokens={filteredTokens}
              currentIndex={filteredTokens.findIndex((t) => t.tokenId === selectedToken.tokenId)}
              project={selectedProject}
              onTokenAction={tokenAction}
              tokenActionLabel={tokenActionLabel}
              onSlideChange={handleSlideChange}
            />
          ) : (
            <div className="flex flex-col text-nomyx-text-light dark:text-nomyx-text-dark h-[80%] text-xl items-center justify-center w-full grow mt-[10%]">
              <FolderCross className="w-52 h-52" variant="Linear" />
              <p>Please purchase some tokens to display under your portfolio.</p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "2",
      label: "Retired Tokens",
      children: (
        <div>
          <ListingRetiredTokens tokens={tokens && tokens.filter((t) => redemptionToken.includes(t.tokenId))} />
        </div>
      ),
    },
  ];

  return (
    <div className="my-portfolio-tabs">
      <Tabs className="nftTabs" items={tabItems} />
    </div>
  );
};

export default ClaimInterest;
