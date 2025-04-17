import React from "react";

import { Card, Button } from "antd";
import Image from "next/image"; // Ensure Next.js optimization

import { formatPrice } from "@/utils/currencyFormater";

import { TradeFinancePool } from "../../types/poolData";

interface Props {
  pools: TradeFinancePool[];
  onSwapCollateral?: (pool: TradeFinancePool) => void;
  onSwapDividend?: (pool: TradeFinancePool) => void;
}

const PoolCardView: React.FC<Props> = ({ pools, onSwapCollateral, onSwapDividend }) => {
  return (
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
              {[{ label: "Total Invested", value: formatPrice(pool.totalInvestedAmount / 1_000_000, "USD") }].map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-semibold">{item.label}</span>
                  <span className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-right w-2/3">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-3 justify-center">
              <Button
                type="primary"
                className="w-full md:w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwapCollateral?.(pool);
                }}
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
  );
};

export default PoolCardView;
