import { useState } from "react";

import { DatePicker, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Category, RowVertical, SearchNormal1 } from "iconsax-react";

import PoolCardView from "./PoolCardView";
import PoolTableView from "./PoolTableView";
import { TradeFinancePool } from "../../types/poolData";

const mockData: TradeFinancePool[] = [
  {
    objectId: "1",
    title: "Pool 1",
    logo: undefined,
    description: "Test Desc",
    startDate: "2024-05-09",
    maturityDate: "2024-09-05",
    investedAmount: 20000,
    allocatedVABB: 62000,
    vabiEarned: 4960,
    totalVabiYield: 4960,
    yieldPercentage: "8%",
  },
  {
    objectId: "2",
    title: "Pool 2",
    logo: undefined,
    description: "Test Desc",
    startDate: "2024-05-09",
    maturityDate: "2024-09-05",
    investedAmount: 22000,
    allocatedVABB: 22000,
    vabiEarned: 1540,
    totalVabiYield: 1540,
    yieldPercentage: "7%",
  },
];

const PoolListPage = () => {
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Handle date range change
  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
  };

  // Filter pools based on search text and date range
  const filteredData = mockData.filter((pool) => {
    const matchesSearch = pool.title.toLowerCase().includes(searchText.toLowerCase());

    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dayjs(pool.startDate);
      const maturityDate = dayjs(pool.maturityDate);
      return matchesSearch && startDate.isAfter(dateRange[0]) && maturityDate.isBefore(dateRange[1]);
    }

    return matchesSearch;
  });

  return (
    <div className="p-4 rounded-lg">
      {/* Search and Filter Section */}
      <div className="flex justify-between items-center p-2 rounded-lg bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark mb-4">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark flex-shrink-0 w-64 flex items-center rounded-sm h-8 py-1 px-2">
            <SearchNormal1 size="24" />
            <input
              type="text"
              placeholder="Search"
              className="bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark ml-2 w-full focus:outline-none"
              onChange={handleSearchChange}
              value={searchText}
            />
          </div>

          <Select placeholder="Start Date" className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500" />
          <Select
            placeholder="Maturity Date"
            className="w-40 bg-transparent ml-2 focus:outline-none text-gray-900 rounded-md border border-gray-500"
          />
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("table")}
            className={`p-0.5 rounded-sm ${viewMode === "table" ? "bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-blue-light" : ""}`}
          >
            <RowVertical size="20" variant={viewMode === "table" ? "Bold" : "Linear"} />
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={`p-0.5 rounded-sm ${viewMode === "card" ? "bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-blue-light" : ""}`}
          >
            <Category size="20" variant={viewMode === "card" ? "Bold" : "Linear"} />
          </button>
        </div>
      </div>

      {/* Pool List View (Table or Card) */}
      {viewMode === "table" ? <PoolTableView pools={filteredData} /> : <PoolCardView pools={filteredData} />}
    </div>
  );
};

export default PoolListPage;
