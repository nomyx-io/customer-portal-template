"use client";

import { useState } from "react";

import { EyeOutlined } from "@ant-design/icons";
import { Table, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";

import { hashToColor } from "@/utils/colorUtils";

import { StockData } from "../../../../types/poolData";

interface Props {
  stocks: StockData[];
}

const StockTableView: React.FC<Props> = ({ stocks }) => {
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  const handleSearch = (value: string) => {
    setSearchText(value.toLowerCase());
  };

  const handleViewClick = (id: number) => {
    router.push(`/stock-details/${id}`);
  };

  const filteredData = stocks.filter((stock) => stock.certificateId.toLowerCase().includes(searchText));

  const generateSvgIcon = (color: string) => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 560 560">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor="#003366" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="560" height="560" rx="15" fill={`url(#gradient-${color})`} />
        <text
          x="50%"
          y="50%" // Adjusted to bring text to vertical center
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize="300" // Increased font size to make "KC" bigger
          fill="white"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          KC
        </text>
      </svg>
    );
  };

  const columns: ColumnsType<StockData> = [
    {
      title: "",
      dataIndex: "view",
      render: (_, record) => <EyeOutlined style={{ fontSize: 18, cursor: "pointer", color: "#1890ff" }} onClick={() => handleViewClick(record.id)} />,
      width: 60,
      fixed: "left",
    },
    {
      title: "Stock Certificate ID",
      dataIndex: "certificateId",
      render: (tokenId: string, record: any) => {
        const color = hashToColor(tokenId);
        return (
          <div style={{ display: "flex", alignItems: "left" }}>
            <span className="h-6"> {generateSvgIcon(color)}</span>
            <span style={{ marginLeft: "10px", fontWeight: "bold" }}>{record.certificateId}</span>
          </div>
        );
      },
      sorter: (a, b) => a.certificateId.localeCompare(b.certificateId),
    },
    {
      title: "Token ID",
      dataIndex: "tokenId",
    },
    {
      title: "Issuance Date",
      dataIndex: "issuanceDate",
      sorter: (a, b) => new Date(a.issuanceDate).getTime() - new Date(b.issuanceDate).getTime(),
    },
    {
      title: "Held By",
      dataIndex: "heldBy",
    },
    {
      title: "Maturity Date",
      dataIndex: "maturityDate",
      sorter: (a, b) => new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime(),
    },
    {
      title: "Company Name",
      dataIndex: "companyName",
    },
    {
      title: "Shareholder Name",
      dataIndex: "shareholderName",
    },
    {
      title: "Number Of Shares",
      dataIndex: "numberOfShares",
      sorter: (a, b) => a.numberOfShares - b.numberOfShares,
    },
    {
      title: "Class of Shares",
      dataIndex: "classOfShares",
    },
    {
      title: "Par Value",
      dataIndex: "parValue",
      sorter: (a, b) => a.parValue - b.parValue,
    },
    {
      title: "ISIN Number",
      dataIndex: "isinNumber",
    },
    {
      title: "Transfer Restrictions",
      dataIndex: "transferRestrictions",
    },
  ];

  return (
    <div>
      <Table columns={columns} dataSource={filteredData} rowKey={(record) => record.id} scroll={{ x: "max-content" }} />
    </div>
  );
};

export default StockTableView;
