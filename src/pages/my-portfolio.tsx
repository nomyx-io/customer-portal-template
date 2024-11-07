import React, { useCallback, useEffect, useRef, useState } from "react";
import PubSub from "pubsub-js";
import { Carousel, Tabs } from "antd/es";
import { useGemforceApp } from "@/context/GemforceAppContext";
import TokenDetail from "@/components/TokenDetail";
import { NomyxEvent } from "@/utils/Constants";
import ListingRetiredTokens from "@/components/ListingRetiredTokens";
import KronosCustomerService from "@/services/KronosCustomerService";
import { FolderCross } from "iconsax-react";

const ClaimInterest: React.FC = () => {
  const carouselRef: any = useRef(null);
  const { appState }: any = useGemforceApp();
  const [tokens, setTokens] = useState<any[]>([]);
  const [redemptionToken, setRedemptionToken] = useState<any[]>([]);
  const [activeSlide, setActiveSlide] = useState<number>(0);

  const afterChange = () => {
    console.log("afterChange");
  };

  const next = () => {
    carouselRef?.current?.next();
  };

  const prev = () => {
    carouselRef?.current?.prev();
  };

  const handleAfterChange = useCallback((current: number) => {
    setActiveSlide(current);
  }, []);

  useEffect(() => {
    if (appState) {
      const subscription = PubSub.subscribe(
        NomyxEvent.GemforceStateChange,
        function (event: any, data: any) {
          if (data.tokens) setTokens(data.tokens);
        }
      );
      setTokens(appState.tokens);
    }
  }, [appState]);

  useEffect(() => {
    const fetchRedemptionHistory = async () => {
      const redemptionData =
        await KronosCustomerService.getAllRedemptionHistoryToken();
      if (redemptionData) {
        const redemptionTokenIds = redemptionData.filter(
          (tokenId) => !isNaN(tokenId)
        );
        setRedemptionToken(redemptionTokenIds);
      } else {
        setRedemptionToken([]);
      }
    };
    fetchRedemptionHistory();
  }, []);

  const handleSuccess = (updatedToken: any) => {
    setRedemptionToken((prev) => [...prev, updatedToken.tokenId]); // Append the tokenId to the array
  };

  const filteredTokens =
    tokens && tokens.filter((t) => !redemptionToken.includes(t.tokenId));

  const tabItems = [
    {
      key: "1",
      label: "Available Tokens",
      children: (
        <div className="claimableTokens">
          {filteredTokens && filteredTokens.length > 0 ? (
            <Carousel afterChange={handleAfterChange} ref={carouselRef}>
              {filteredTokens.map((token: any, index: number) => (
                <div key={`nbt-${index}`}>
                {activeSlide === index && (
                  <TokenDetail
                    prev={prev}
                    next={next}
                    token={token}
                    onSuccess={handleSuccess}
                  />
                )}
              </div>
              ))}
            </Carousel>
          ) : (
            <div className="flex flex-col text-nomyx-text-light dark:text-nomyx-text-dark h-[80%] text-xl items-center justify-center w-full grow mt-[10%]">
              <FolderCross className="w-52 h-52" variant="Linear" />
              <p>
                Please purchase some tokens to display under your portfolio.
              </p>
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
          <ListingRetiredTokens
            tokens={
              tokens &&
              tokens.filter((t) => redemptionToken.includes(t.tokenId))
            }
          />
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
