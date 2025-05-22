import { Card } from "antd";

import { Industries } from "@/config/generalConfig";
import { formatPrice } from "@/utils/currencyFormater";
import { formatNumber } from "@/utils/numberFormatter";

interface ProjectInfoProps {
  token: any;
  combinedFields: any[];
  includeFields: Array<{ key: string; label: string; formatter?: (value: any) => string }>;
  carbonCreditBalance: number | null;
  formatValueByType: (type: string, value: any) => React.ReactNode;
  onTokenAction: (token: any) => void;
  tokenActionLabel: string;
  tokenBalance: number | null;
  industryTemplate: string;
}

const ProjectInfo: React.FC<ProjectInfoProps> = ({
  token,
  combinedFields,
  includeFields,
  carbonCreditBalance,
  formatValueByType,
  onTokenAction,
  tokenActionLabel,
  tokenBalance,
  industryTemplate,
}) => {
  const totalCost = parseInt(token.price) * parseInt(token.existingCredits);
  return (
    <div className="flex flex-col justify-start mt-10 md:mt-0">
      <Card className="border dark:border-gray-700 border-gray-300 bg-gray-100 dark:bg-nomyx-dark2-dark p-6 rounded-lg shadow-md">
        <div className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing Info</h3>
          <div className="text-gray-800 dark:text-gray-200 space-y-4">
            {[
              {
                label: "Price",
                value:
                  industryTemplate === Industries.TRADE_FINANCE
                    ? `${formatPrice(token.totalAmount / 1_000_000, "USD")}`
                    : `${formatPrice(token.price, "USD")}`,
              },
              token.existingCredits && token.existingCredits > 0
                ? {
                    label: "Existing Credits:",
                    value: `${formatNumber(token.existingCredits)}`,
                  }
                : null,
              totalCost && totalCost > 0
                ? {
                    label: "Total Cost:",
                    value: `${formatPrice(totalCost, "USD")}`,
                  }
                : null,
            ]
              .filter(Boolean) // Filter out null values
              .map((item, index) => (
                <div key={index} className="flex flex-wrap items-center">
                  <span className="font-semibold w-full md:w-1/2">{item?.label}</span>
                  <span className="bg-white dark:bg-nomyx-dark2-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 shadow-md px-4 py-2 rounded-md w-full md:w-1/2 mt-1 md:mt-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    {item?.value}
                  </span>
                </div>
              ))}
          </div>
        </div>
        <div className="mt-6">
          {carbonCreditBalance && (
            <>
              <div className="text-gray-900 dark:text-white font-bold text-lg mb-2">Carbon Credits:</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {carbonCreditBalance !== null ? formatNumber(carbonCreditBalance) : "Loading..."}
              </div>
            </>
          )}
          {tokenBalance && !carbonCreditBalance && (
            <>
              <div className="text-gray-900 dark:text-white font-bold text-lg mb-2">Yield Available for Claim:</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {tokenBalance !== null ? formatPrice(tokenBalance / 1_000_000, "USD") : "Loading..."}
              </div>
            </>
          )}
          {industryTemplate &&
            industryTemplate != Industries.TRADE_FINANCE &&
            tokenActionLabel &&
            ((tokenBalance && tokenBalance > 0) || (carbonCreditBalance && carbonCreditBalance > 0)) && (
              <button
                className="w-full mt-4 bg-blue-500 text-white font-bold py-3 px-6 rounded-md transition hover:bg-blue-700 hover:brightness-110 flex items-center justify-center border-none"
                onClick={() => onTokenAction && onTokenAction(token)}
              >
                {tokenActionLabel}
              </button>
            )}
        </div>
      </Card>
    </div>
  );
};

export default ProjectInfo;
