// "use client";

// import { useState } from "react";

// import { EyeOutlined } from "@ant-design/icons";
// import { Table, Input, Button } from "antd";
// import type { ColumnsType } from "antd/es/table";
// import { useRouter } from "next/navigation";

// import { TradeFinancePool } from "@/types/poolData";
// import { hashToColor } from "@/utils/colorUtils";

// interface Props {
//   pools: TradeFinancePool[];
// }

// const FundPoolsTableView: React.FC<Props> = ({ pools }) => {
//   const [searchText, setSearchText] = useState("");
//   const router = useRouter();

//   const handleSearch = (value: string) => {
//     setSearchText(value.toLowerCase());
//   };

//   const handleViewClick = (id: string) => {
//     router.push(`/pool-details/${id}`);
//   };

//   const generateSvgIcon = (color: string) => {
//     return (
//       <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 560 560">
//         <defs>
//           <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
//             <stop offset="0%" stopColor={color} stopOpacity="1" />
//             <stop offset="100%" stopColor="#003366" stopOpacity="1" />
//           </linearGradient>
//         </defs>
//         <rect width="560" height="560" rx="15" fill={`url(#gradient-${color})`} />
//         <text
//           x="50%"
//           y="50%" // Adjusted to bring text to vertical center
//           fontFamily="Arial, sans-serif"
//           fontWeight="bold"
//           fontSize="300" // Increased font size to make "KC" bigger
//           fill="white"
//           dominantBaseline="middle"
//           textAnchor="middle"
//         >
//           KC
//         </text>
//       </svg>
//     );
//   };

//   const filteredData = pools.filter((pool) => pool.title.toLowerCase().includes(searchText));

//   const columns: ColumnsType<TradeFinancePool> = [
//     {
//       title: "",
//       dataIndex: "view",
//       render: (_, record) => (
//         <EyeOutlined style={{ fontSize: 18, cursor: "pointer", color: "#1890ff" }} onClick={() => handleViewClick(record.objectId)} />
//       ),
//       width: 60,
//       fixed: "left",
//     },
//     {
//       title: "Title",
//       dataIndex: "poolName",
//       render: (id: string, record: any) => {
//         const color = hashToColor(id);
//         return (
//           <div style={{ display: "flex", alignItems: "left" }}>
//             <span className="h-6"> {generateSvgIcon(color)}</span>
//             <span style={{ marginLeft: "10px", fontWeight: "bold" }}>{record.poolName}</span>
//           </div>
//         );
//       },
//       sorter: (a, b) => a.title.localeCompare(b.title),
//       filterDropdown: () => (
//         <div style={{ padding: 8 }}>
//           <Input
//             placeholder="Search Pool"
//             value={searchText}
//             onChange={(e) => handleSearch(e.target.value)}
//             style={{ marginBottom: 8, display: "block" }}
//           />
//         </div>
//       ),
//     },
//     {
//       title: <div style={{ whiteSpace: "pre-line", textAlign: "center" }}>Description</div>,
//       dataIndex: "description",
//     },
//     {
//       title: <div style={{ whiteSpace: "pre-line", textAlign: "center" }}>Credit Type</div>,
//       dataIndex: "creditType",
//       sorter: (a, b) => a.title.localeCompare(b.title),
//     },
//     {
//       title: (
//         <div style={{ whiteSpace: "pre-line", textAlign: "center" }}>
//           Total USDC <br /> Deposited
//         </div>
//       ),
//       dataIndex: "investedAmount",
//       sorter: (a, b) => (a.investedAmount ?? 0) - (b.investedAmount ?? 0),
//       width: 150,
//     },
//     {
//       title: (
//         <div style={{ whiteSpace: "pre-line", textAlign: "center" }}>
//           Total Invoice <br /> Amount
//         </div>
//       ),
//       dataIndex: "allocatedVABB",
//       sorter: (a, b) => (a.allocatedVABB ?? 0) - (b.allocatedVABB ?? 0),
//       width: 150,
//     },
//     {
//       title: <div style={{ whiteSpace: "pre-line", textAlign: "center" }}>Total Tokens</div>,
//       dataIndex: "vabiEarned",
//       sorter: (a, b) => (a.vabiEarned ?? 0) - (b.vabiEarned ?? 0),
//       width: 150,
//     },
//     {
//       title: <div style={{ whiteSpace: "pre-line", textAlign: "center" }}>USDC Remaining</div>,
//       dataIndex: "totalVabiYield",
//       sorter: (a, b) => (a.totalVabiYield ?? 0) - (b.totalVabiYield ?? 0),
//       width: 120,
//     },
//     // {
//     //   title: "",
//     //   dataIndex: "actions",
//     //   render: (_, record) => (
//     //     <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//     //       <Button type="primary" size="small">
//     //         Invest in Pool
//     //       </Button>
//     //     </div>
//     //   ),
//     //   width: 200,
//     // },
//   ];

//   return (
//     <div>
//       <Table className="pool-table" columns={columns} dataSource={filteredData} rowKey={(record) => record.objectId} scroll={{ x: "max-content" }} />
//     </div>
//   );
// };

// export default FundPoolsTableView;
