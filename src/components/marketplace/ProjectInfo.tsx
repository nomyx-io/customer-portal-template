import { Card } from "antd";

import { formatPrice } from "@/utils/currencyFormater";

interface ProjectInfoProps {
  token: any;
  combinedFields: any[];
  includeFields: Array<{ key: string; label: string; formatter?: (value: any) => string }>;
  carbonCreditBalance: number | null;
  formatValueByType: (type: string, value: any) => React.ReactNode;
  onTokenAction: (token: any) => void;
  tokenActionLabel: string;
}

const ProjectInfo: React.FC<ProjectInfoProps> = ({
  token,
  combinedFields,
  includeFields,
  carbonCreditBalance,
  formatValueByType,
  onTokenAction,
  tokenActionLabel,
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
  );
};

export default ProjectInfo;
