// import { Card } from "antd";
// import Image from "next/image";
// import Link from "next/link";

// import { TradeFinancePool } from "@/types/poolData";

// interface FundPoolsCardProps {
//   pool: TradeFinancePool;
//   onPoolClick: () => void;
// }

// export default function FundPoolsCardView({ pool, onPoolClick }: FundPoolsCardProps) {
//   return (
//     <Card
//       className="rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer"
//       onClick={onPoolClick}
//       bodyStyle={{ padding: "16px" }}
//     >
//       {/* Cover Image */}
//       <div className="relative w-full h-40 rounded-lg overflow-hidden">
//         <Image src={pool.coverImage?.url() || "/default-image.png"} alt={pool.title} fill className="object-cover" />
//       </div>

//       {/* Pool Name & Details Link */}
//       <div className="flex justify-between items-center mt-3">
//         <h2 className="text-lg font-bold">{pool.title}</h2>
//         <Link href="#" className="text-blue-500 text-sm">
//           View Details
//         </Link>
//       </div>

//       {/* Description */}
//       <p className="text-sm text-gray-600 mt-1 line-clamp-2">{pool.description}</p>

//       {/* Pool Info */}
//       <div className="mt-3 bg-gray-100 p-3 rounded-lg">
//         <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-800">
//           <span className="font-semibold">Credit Type</span>
//           <span className="text-right">N/A</span>

//           <span className="font-semibold">APY</span>
//           <span className="text-right">{pool.yieldPercentage || "N/A"}%</span>

//           <span className="font-semibold">Total Pool Amount</span>
//           <span className="text-right">{pool.investedAmount?.toLocaleString() || "N/A"}</span>

//           <span className="font-semibold">Total Stocks</span>
//           <span className="text-right">50</span>

//           <span className="font-semibold">Total Pool Funded</span>
//           <span className="text-right">50%</span>
//         </div>
//       </div>

//       {/* Invest Button */}
//       {/* <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Invest In Pool</button> */}
//     </Card>
//   );
// }
