import React from "react";

import { Card, Button } from "antd";

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
          key={pool.objectId}
          className="rounded-lg shadow-md transition-transform duration-300 ease-in-out bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:shadow-2xl hover:scale-105 cursor-pointer"
        >
          <div className="p-4">
            <h2 className="text-lg font-bold mb-2">{pool.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Start Date: {pool.startDate}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Maturity Date: {pool.maturityDate}</p>
            <div className="mt-4 grid gap-2">
              {[
                { label: "Total Invested", value: formatPrice(pool.investedAmount ?? 0, "USD") },
                { label: "Total Allocated", value: formatPrice(pool.allocatedVABB ?? 0, "USD") },
                { label: "Total Earned", value: formatPrice(pool.vabiEarned ?? 0, "USD") },
                { label: "Total Yield", value: formatPrice(pool.totalVabiYield ?? 0, "USD") },
                { label: "Yield %", value: `${pool.yieldPercentage}` },
              ].map((item, index) => (
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
