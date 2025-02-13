import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";

import { Tabs } from "antd/es";
import { FolderCross } from "iconsax-react";
import PubSub from "pubsub-js";
import { toast } from "react-toastify";

import ListingClaimedTokens from "@/components/ListingClaimedTokens";
import ListingRetiredTokens from "@/components/ListingRetiredTokens";
import TokenDetail from "@/components/TokenDetail";
import { Industries } from "@/config/generalConfig";
import { useGemforceApp } from "@/context/GemforceAppContext";
import BlockchainService from "@/services/BlockchainService";
import KronosCustomerService from "@/services/KronosCustomerService";
import { NomyxEvent, WalletPreference } from "@/utils/Constants";

const ClaimInterest: React.FC = () => {
  const { appState }: any = useGemforceApp();
  const [tokens, setTokens] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [selectedToken, setSelectedToken] = useState<any | null>(null);
  const [redemptionToken, setRedemptionToken] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const walletPreference = appState?.session?.user?.walletPreference;
  const projectCacheRef = useRef<{ [key: string]: any }>({}); // Cache for projects

  useEffect(() => {
    if (!appState) return;
    const subscription = PubSub.subscribe(NomyxEvent.GemforceStateChange, (event: any, data: any) => {
      if (data.tokens) setTokens(data.tokens);
      if (data.userWithdrawals) setWithdrawals(data.userWithdrawals);
    });

    setTokens(appState.tokens);
    setWithdrawals(appState.userWithdrawals);
    // Cleanup subscription on unmount
    return () => {
      PubSub.unsubscribe(subscription);
    };
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
  const filteredTokens: any[] = useMemo(() => {
    if (!Array.isArray(tokens)) return [];

    return tokens.filter((t) => {
      const withdrawal = (t.withdrawalAmount ?? 0) / 1_000_000;
      const deposit = (t.depositAmount ?? 0) / 1_000_000;
      const price = isNaN(parseFloat(t.price)) ? 0 : parseFloat(t.price);

      return !redemptionToken.includes(t.tokenId) && (withdrawal < deposit || withdrawal < price);
    });
  }, [tokens, redemptionToken]);

  const formatWithdrawnTokens: any[] = useMemo(() => {
    if (!Array.isArray(withdrawals)) return [];

    return withdrawals.map((t) => ({
      objectId: t.objectId,
      tokenId: t.token?.tokenId, // Ensure token exists before accessing properties
      nftTitle: t.token?.nftTitle,
      withdrawalAmount: t.amount,
      createdDate: t.createdAt,
    }));
  }, [withdrawals]);

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

  const handleTokenWithdraw = useCallback(
    async (token: any) => {
      if (!token?.tokenId) {
        console.error("Token ID is missing");
        return;
      }

      try {
        const user = appState?.session?.user;
        const walletId = user?.walletId;
        const dfnsToken = user?.dfns_token;
        const tokenId = parseInt(token.tokenId);

        toast.promise(
          async () => {
            if (walletPreference === WalletPreference.PRIVATE) {
              // Handle PRIVATE wallet withdrawal
              if (tokenId < 0) throw new Error("Invalid token ID for withdrawal.");
              await BlockchainService.withdraw([tokenId]);
            } else if (walletPreference === WalletPreference.MANAGED) {
              // Handle MANAGED wallet withdrawal
              if (!walletId || !dfnsToken) {
                throw "No wallet or DFNS token available for withdrawal.";
              }

              // Step 1: Initiate the withdrawal process
              const { initiateResponse: withdrawResponse, error: withdrawInitiateError } = await KronosCustomerService.initiateWithdraw(
                walletId,
                [tokenId],
                dfnsToken
              );

              if (withdrawInitiateError) {
                throw "WithdrawInitiateError: " + withdrawInitiateError;
              }

              // Step 2: Complete the withdrawal process
              const { completeResponse: withdrawCompleteResponse, error: completeWithdrawError } = await KronosCustomerService.completeWithdraw(
                walletId,
                dfnsToken,
                withdrawResponse.challenge,
                withdrawResponse.requestBody
              );

              if (completeWithdrawError) {
                throw "CompleteWithdrawError: " + completeWithdrawError;
              }
              const updatedTokens = await KronosCustomerService.getTokensForUser(user.walletAddress);
              const updatedWithdrawals = await KronosCustomerService.getWithdrawalsForUser(user.walletAddress);

              setTokens(updatedTokens);
              setWithdrawals(updatedWithdrawals);
              if (filteredTokens.filter((t) => t.tokenId == token.tokenId)) {
                setSelectedToken(token);
              } else {
                setSelectedToken(filteredTokens[0]);
              }
            } else {
              throw "Invalid wallet preference.";
            }
          },
          {
            pending: "Processing withdrawal...",
            success: "Token withdrawal successful.",
            error: {
              render({ data }: { data: any }) {
                return <div>{data?.reason || data || "An error occurred during withdrawal."}</div>;
              },
            },
          }
        );
      } catch (error: any) {
        console.error("Failed to withdraw token:", error);
      }
    },
    [appState, walletPreference]
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
            action: handleTokenWithdraw,
            label: "Claim Now",
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
    [handleRetireAllCredits, handleTokenWithdraw]
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
    {
      key: "3",
      label: "Paid Off",
      children: (
        <div>
          <ListingClaimedTokens tokens={formatWithdrawnTokens} />
        </div>
      ),
    },
  ].filter((tab): tab is any => tab !== null);

  return (
    <div className="my-portfolio-tabs">
      <Tabs className="nftTabs" items={tabItems} />
    </div>
  );
};

export default ClaimInterest;
