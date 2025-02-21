import React, { useState } from "react";

import { Table, TableColumnType, Input, Button, Space } from "antd";
import { FilterSquare } from "iconsax-react";

import { hashToColor } from "@/utils/colorUtils";
import { formatPrice } from "@/utils/currencyFormater";

interface ClaimedToken {
  objectId: string;
  nftTitle: string;
  withdrawalAmount: number;
  createdDate: string;
}

const ListingClaimedTokens = ({ tokens }: { tokens: ClaimedToken[] }) => {
  const [searchText, setSearchText] = useState<string>("");

  // Generic filter function for columns
  const getColumnSearchProps = (dataIndex: keyof ClaimedToken): TableColumnType<ClaimedToken> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block", width: "100%" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<FilterSquare className="h-5 w-5" />}
            size="small"
            style={{ width: "48%", height: "10%" }}
            className="filter-search-btn"
          >
            Search
          </Button>
          <Button
            onClick={() => {
              clearFilters && clearFilters();
              setSearchText("");
            }}
            size="small"
            style={{ width: "48%", height: "10%" }}
          >
            Reset
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered) => <FilterSquare style={{ color: filtered ? "#1890ff" : undefined }} />,
    onFilter: (value, record) => {
      return String(record[dataIndex])
        .toLowerCase()
        .includes((value as string).toLowerCase());
    },
  });

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

  // Define columns with sorting and filtering
  const columns: TableColumnType<ClaimedToken>[] = [
    {
      title: "Name",
      dataIndex: "nftTitle",
      render: (tokenId: string, record: any) => {
        const color = hashToColor(tokenId);
        return (
          <div style={{ display: "flex", alignItems: "left" }}>
            <span className="h-6"> {generateSvgIcon(color)}</span>
            <span style={{ marginLeft: "10px", fontWeight: "bold" }}>{record.nftTitle}</span>
          </div>
        );
      },
      sorter: (a, b) => a.nftTitle.localeCompare(b.nftTitle),
      ...getColumnSearchProps("nftTitle"),
    },
    {
      title: "Withdrawn Amount",
      dataIndex: "withdrawalAmount",
      sorter: (a, b) => a.withdrawalAmount - b.withdrawalAmount,
      render: (withdrawalAmount: number) => `${formatPrice(withdrawalAmount / 1_000_000, "USD")}`, // Convert from small units to regular price format
      ...getColumnSearchProps("withdrawalAmount"),
    },
    {
      title: "Withdrawn Date",
      dataIndex: "createdDate",
      sorter: (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
      render: (createdDate: Date) => (createdDate ? new Date(createdDate).toLocaleString() : "N/A"),
      ...getColumnSearchProps("createdDate"),
    },
  ];

  return <Table rowKey="objectId" columns={columns} dataSource={tokens} pagination={false} scroll={{ y: 600 }} />;
};

export default ListingClaimedTokens;
