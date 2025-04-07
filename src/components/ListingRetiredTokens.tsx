import React, { useState } from "react";

import { Table, TableColumnType, Input, Button, Space } from "antd";
import { FilterSquare } from "iconsax-react";

import { hashToColor } from "@/utils/colorUtils";
import { formatPrice } from "@/utils/currencyFormater";

interface Token {
  objectId: string;
  nftTitle: string;
  creditsPre2020: number;
  price: number;
  totalPrice: number;
  registerId: string;
  existingCredits: number;
  issuanceDate: string;
  ghgReduction: string;
  state: string;
}

const ListingRetiredTokens = ({ tokens }: { tokens: Token[] }) => {
  const [searchText, setSearchText] = useState<string>("");

  // Generic filter function for columns
  const getColumnSearchProps = (dataIndex: keyof Token): TableColumnType<Token> => ({
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
          fontSize="300"
          fill="white"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          N
        </text>
      </svg>
    );
  };

  // Define columns with sorting and filtering
  const columns: TableColumnType<Token>[] = [
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
      title: "Total Price",
      dataIndex: "totalPrice",
      sorter: (a, b) => a.totalPrice - b.totalPrice,
      render: (totalPrice: number) => `${formatPrice(totalPrice, "USD")}`, // Convert from small units to regular price format
      ...getColumnSearchProps("totalPrice"),
    },
    {
      title: "Issuance Date",
      dataIndex: "issuanceDate",
      sorter: (a, b) => new Date(a.issuanceDate).getTime() - new Date(b.issuanceDate).getTime(),
      ...getColumnSearchProps("issuanceDate"),
    },
  ];

  return <Table rowKey="objectId" columns={columns} dataSource={tokens} pagination={false} scroll={{ y: 600 }} />;
};

export default ListingRetiredTokens;
