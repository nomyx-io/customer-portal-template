import React from "react";

import { Card } from "antd";

import { StockData } from "../../../../types/poolData";

interface Props {
  stocks: StockData[];
}

const StockCardView: React.FC<Props> = ({ stocks }) => {
  return (
    <div className="grid gap-5 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 mt-5">
      {stocks.map((stock) => (
        <Card
          key={stock.id}
          className="rounded-lg shadow-md transition-transform duration-300 ease-in-out bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:shadow-2xl hover:scale-105 cursor-pointer"
        >
          <div className="p-4">
            <h2 className="text-lg font-bold mb-2">{stock.id}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Token ID: {stock.tokenId}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Issuance Date: {stock.issuanceDate}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Maturity Date: {stock.maturityDate}</p>
            <div className="mt-4 grid gap-2">
              {[
                { label: "Held By", value: stock.heldBy },
                { label: "Company Name", value: stock.companyName },
                { label: "Shareholder Name", value: stock.shareholderName },
                { label: "Number Of Shares", value: stock.numberOfShares },
                { label: "Class of Shares", value: stock.classOfShares },
                { label: "Par Value", value: stock.parValue },
                { label: "ISIN Number", value: stock.isinNumber },
                { label: "Transfer Restrictions", value: stock.transferRestrictions },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-semibold">{item.label}</span>
                  <span className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-right w-2/3">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default StockCardView;
