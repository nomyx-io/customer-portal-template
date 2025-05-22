import React, { useState } from "react";

import { Card, Button, ConfigProvider, Modal, InputNumber } from "antd";
import Image from "next/image"; // Ensure Next.js optimization
import { useRouter } from "next/router";

import { formatPrice } from "@/utils/currencyFormater";

import { TradeFinancePool } from "../../types/poolData";

interface Props {
  pools: TradeFinancePool[];
  handleRedeemVABB: (tradeDealId: number, usdcAmount: number) => Promise<void>; // Parent function
}

const PoolCardView: React.FC<Props> = ({ pools, handleRedeemVABB }) => {
  const [usdcAmount, setUSDCAmount] = useState<number | null>(null);
  const [isRedeemVABBModalOpen, setIsRedeemVABBModalOpen] = useState(false);
  const [selectedTradeDealId, setSelectedTradeDealId] = useState<number | null>(null);

  const router = useRouter();

  const handleViewClick = (id: string) => {
    router.push(`/pool-details/${id}`);
  };

  const handleRedeem = (tradeDealId: any) => {
    setSelectedTradeDealId(tradeDealId);
    setIsRedeemVABBModalOpen(true);
  };

  const handleConfirmRedeem = async () => {
    if (selectedTradeDealId || (0 >= 0 && usdcAmount)) {
      await handleRedeemVABB(selectedTradeDealId || 0, usdcAmount || 0);
      setIsRedeemVABBModalOpen(false);
    }
  };

  const handleRedeemVABBCancel = () => {
    setIsRedeemVABBModalOpen(false);
  };

  return (
    <>
      <div className="grid gap-5 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 mt-5">
        {pools.map((pool) => (
          <Card
            key={pool.projectId}
            className="rounded-lg shadow-md transition-transform duration-300 ease-in-out bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-pointer overflow-hidden"
          >
            {/* Cover Image */}
            <div className="relative w-full h-40">
              <Image
                src={pool.coverImage?.url() || "/default-cover.png"}
                alt={pool.title || "Pool Cover Image"}
                layout="fill"
                objectFit="cover"
                className="rounded-t-lg"
              />
            </div>

            <div className="p-4">
              <h2 className="text-lg font-bold mb-2">{pool.title}</h2>

              <div className="mt-4 grid gap-2">
                {[{ label: "Total Invested", value: formatPrice(pool.totalInvestedAmount, "USD") }].map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-semibold">{item.label}</span>
                    <span className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-right w-2/3">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-3 justify-end">
                <Button
                  type="primary"
                  className="w-full md:w-auto disabled:text-black disabled:p-2 disabled:leading-[0.50rem]"
                  onClick={() => handleRedeem(pool.tradeDealId)}
                  disabled={pool.isRedemptionCompleted}
                >
                  Swap Collateral Token to USDC
                </Button>
                {/* <Button
                type="primary"
                className="w-full md:w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwapCollateral?.(pool);
                }}
              >
                Swap Dividend Token to USDC
              </Button> */}
              </div>
            </div>
          </Card>
        ))}
      </div>
      {/* Confirmation Modal */}
      <ConfigProvider
        theme={{
          token: {
            colorBgElevated: "#ffffff", // Light theme modal background
            colorText: "#000000", // Light theme text
          },
        }}
      >
        <Modal
          title="Redeem VABB"
          open={isRedeemVABBModalOpen}
          onCancel={handleRedeemVABBCancel}
          footer={[
            <Button key="cancel" onClick={handleRedeemVABBCancel} className="text-gray-700 dark:text-gray-300">
              Cancel
            </Button>,
            <Button
              key="submit"
              type="default"
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
              onClick={() => handleConfirmRedeem()}
              disabled={!usdcAmount}
            >
              Submit
            </Button>,
          ]}
        >
          <p>Enter the amount you want to USDC:</p>
          <InputNumber
            min={1}
            value={usdcAmount}
            onChange={setUSDCAmount}
            className="w-full mt-2 border rounded-md bg-white focus-within:bg-white text-black"
            placeholder="Enter amount"
          />
        </Modal>
      </ConfigProvider>
    </>
  );
};

export default PoolCardView;
