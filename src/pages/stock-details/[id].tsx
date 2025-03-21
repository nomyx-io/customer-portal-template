import React from "react";

import { useRouter } from "next/router";

const mockStocks = [
  {
    id: "1",
    tokenId: "500",
    description: "Description text, Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    imageUrl: "/path-to-image.jpg",
    fullDescription: [
      { label: "Wi-Fi 6e chip sets", value: "Qualcomm FastConnect 6900" },
      { label: "QTY", value: "100,000" },
      { label: "Country of Origin", value: "China" },
      { label: "Pallet Number", value: "5001" },
      { label: "Serial Number Range", value: "5344559 - 63445699" },
      { label: "Airway Bill Number", value: "FZA31253" },
    ],
    stockInfo: [
      { label: "Type of Investment", value: "Venture" },
      { label: "Market", value: "US" },
      { label: "Generation", value: "03" },
      { label: "Opening Date", value: "09-03-2025" },
      { label: "Target Return (Gross)", value: "3-4 X" },
      { label: "Stage", value: "Early" },
      { label: "Fund Size", value: "$5M" },
      { label: "Economics", value: "2% - 20%" },
      { label: "Closing Date", value: "09-03-2026" },
    ],
  },
  // Add more stock items if needed
];

// Function to fetch stock data by ID (simulating API call)
const getStockById = (id: string) => mockStocks.find((stock) => stock.id === id);

const StockDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  // Fetch stock data based on ID
  const stockData = id ? getStockById(id as string) : null;

  if (!stockData) {
    return <div className="text-center p-10">Loading stock details...</div>;
  }

  return (
    <div className="p-6 bg-white">
      {/* Header Section */}
      <div className="rounded-lg p-6 flex gap-6 border-gray-300 border mt-6 bg-white shadow-sm">
        <img src={stockData.imageUrl} alt="Stock" className="w-48 h-48 rounded-md object-cover" />
        <div>
          <h1 className="text-2xl font-bold">
            Stock {stockData.id} - Token ID {stockData.tokenId}
          </h1>
          <p className="text-gray-600 mt-2">{stockData.description}</p>
        </div>
      </div>

      {/* Full Description */}
      <div className="mt-6 p-6 rounded-lg border border-gray-300 bg-white shadow-sm">
        <h2 className="font-semibold text-lg mb-2">Full Description</h2>
        {stockData.fullDescription.map((item, index) => (
          <p key={index}>
            <span className="font-semibold">{item.label}:</span> {item.value}
          </p>
        ))}
      </div>

      {/* Stock Information */}
      <div className="mt-6 p-6 rounded-lg border border-gray-300 bg-white shadow-sm">
        <h2 className="font-semibold text-xl mb-4">Stock Information</h2>
        <div className="grid grid-cols-2 gap-6">
          {stockData.stockInfo.map((item, index) => (
            <div key={index} className="flex items-center">
              <span className="w-1/2 text-gray-600 font-medium">{item.label}:</span>
              <div className="w-1/2 bg-gray-100 text-gray-900 px-3 py-2 rounded-md shadow-md">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockDetailsPage;
