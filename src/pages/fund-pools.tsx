// import React, { useCallback, useEffect, useMemo, useState } from "react";

// import { Shop, Category, RowVertical, SearchNormal1 } from "iconsax-react";

// import FundPoolsCardView from "@/components/Pool/PoolDetails/FundPools/FundPoolsCardView";
// import FundPoolsTableView from "@/components/Pool/PoolDetails/FundPools/FundPoolsTableView";
// import InvestInPoolView from "@/components/Pool/PoolDetails/FundPools/InvestInPoolView";
// import KronosCustomerService from "@/services/KronosCustomerService";
// import { TradeFinancePool } from "@/types/poolData";

// const FundPools: React.FC = () => {
//   const [poolList, setPoolList] = useState<TradeFinancePool[]>([]);
//   const [searchQuery, setSearchQuery] = useState<string>("");
//   const [viewMode, setViewMode] = useState<string>("card");
//   const [selectedPool, setSelectedPool] = useState<TradeFinancePool | null>(null);

//   // Memoized filtered pools
//   const filteredPools = useMemo(() => {
//     return poolList.filter(
//       (pool) => pool.title?.toLowerCase().includes(searchQuery.toLowerCase()) || pool.description?.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//   }, [poolList, searchQuery]);

//   // Fetch trade finance pools
//   const fetchTradeFinancePools = useCallback(async () => {
//     try {
//       const pools = await KronosCustomerService.getTradeFinanceProjects();
//       setPoolList(pools);
//     } catch (error) {
//       console.error("Failed to fetch projects:", error);
//     }
//   }, []);

//   useEffect(() => {
//     fetchTradeFinancePools();
//     console.log("Updated poolList:", poolList);
//   }, [fetchTradeFinancePools]);

//   // Toggle View Mode
//   const toggleView = (view: string) => setViewMode(view);

//   // Search Input Change Handler
//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchQuery(e.target.value);
//   };

//   // Handle pool selection
//   const handlePoolClick = (pool: TradeFinancePool) => {
//     setSelectedPool(pool);
//   };

//   return (
//     <>
//       {selectedPool ? (
//         <InvestInPoolView id={selectedPool.objectId.toString()} onBack={() => setSelectedPool(null)} />
//       ) : (
//         <>
//           {/* Header Section */}
//           <div className="flex justify-between items-center p-2 rounded-lg bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark">
//             {/* Search Bar */}
//             <div className="bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark flex-shrink-0 w-64 flex items-center rounded-sm h-8 py-1 px-2">
//               <SearchNormal1 size="24" />
//               <input
//                 type="text"
//                 placeholder="Search"
//                 className="bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark ml-2 w-full focus:outline-none"
//                 onChange={handleSearchChange}
//                 value={searchQuery}
//               />
//             </div>

//             {/* View Toggle Buttons */}
//             <div className="flex items-center">
//               <button
//                 onClick={() => toggleView("card")}
//                 className={`p-0.5 rounded-sm ${viewMode === "card" ? "bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-blue-light" : ""}`}
//               >
//                 <Category size="20" variant={viewMode === "card" ? "Bold" : "Linear"} />
//               </button>
//               <button
//                 onClick={() => toggleView("table")}
//                 className={`p-0.5 rounded-sm ${viewMode === "table" ? "bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-blue-light" : ""}`}
//               >
//                 <RowVertical size="20" variant={viewMode === "table" ? "Bold" : "Linear"} />
//               </button>
//             </div>
//           </div>

//           {/* Content Section */}
//           {filteredPools.length > 0 ? (
//             viewMode === "table" ? (
//               <FundPoolsTableView pools={filteredPools} />
//             ) : (
//               <div className="gap-5 grid grid-cols-2 xl:grid-cols-3 mt-5">
//                 {filteredPools.map((pool) => (
//                   <FundPoolsCardView key={pool.objectId} pool={pool} onPoolClick={() => handlePoolClick(pool)} />
//                 ))}
//               </div>
//             )
//           ) : (
//             <div className="flex flex-col text-nomyx-text-light dark:text-nomyx-text-dark h-[80%] text-xl items-center justify-center w-full grow">
//               <Shop className="w-60 h-60" variant="Linear" />
//               <p>No Pools around here?</p>
//               <p>Come back again soon</p>
//             </div>
//           )}
//         </>
//       )}
//     </>
//   );
// };

// export default FundPools;
