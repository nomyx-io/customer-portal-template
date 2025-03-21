"use client";

import { useState } from "react";

import { Table, Input, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";

import { HistoryData } from "../../../../types/poolData";

const mockStockData: HistoryData[] = [
  {
    investorName: "John Doe",
    investorId: "INV001",
    amountDeposited: 50000,
    vabbTokenIssued: 1000,
    vabbTokenLockupPeriod: 12,
    vabiTokensIssued: 200,
  },
  {
    investorName: "Jane Smith",
    investorId: "INV002",
    amountDeposited: 75000,
    vabbTokenIssued: 1500,
    vabbTokenLockupPeriod: 24,
    vabiTokensIssued: 300,
  },
];

interface Props {
  histories?: HistoryData[];
}

const HistoryListPage: React.FC<Props> = ({ histories = mockStockData }) => {
  const [searchText, setSearchText] = useState("");
  const router = useRouter();

  const handleSearch = (value: string) => {
    setSearchText(value.toLowerCase());
  };

  const handleWithdraw = (id: string) => {
    console.log(`Withdraw clicked for investorId: ${id}`);
    // Add your withdrawal logic here
  };

  const filteredData = histories.filter((history) => history.investorName.toLowerCase().includes(searchText));

  const columns: ColumnsType<HistoryData> = [
    {
      title: "Investor Name",
      dataIndex: "investorName",
      sorter: (a, b) => a.investorName.localeCompare(b.investorName),
    },
    {
      title: "Investor ID",
      dataIndex: "investorId",
    },
    {
      title: "Amount Deposited",
      dataIndex: "amountDeposited",
      sorter: (a, b) => a.amountDeposited - b.amountDeposited,
    },
    {
      title: "VABB Token Issued",
      dataIndex: "vabbTokenIssued",
      sorter: (a, b) => a.vabbTokenIssued - b.vabbTokenIssued,
    },
    {
      title: "VABB Token Lockup Period",
      dataIndex: "vabbTokenLockupPeriod",
      sorter: (a, b) => a.vabbTokenLockupPeriod - b.vabbTokenLockupPeriod,
    },
    {
      title: "VABI Tokens Issued",
      dataIndex: "vabiTokensIssued",
    },
    {
      title: "", // Empty column header
      dataIndex: "withdraw",
      render: (_, record) => (
        <Button type="primary" onClick={() => handleWithdraw(record.investorId)}>
          Withdraw
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* <Input
        placeholder="Search by Investor Name"
        value={searchText}
        onChange={(e) => handleSearch(e.target.value)}
        style={{ marginBottom: 16, width: 300 }}
      /> */}
      <Table columns={columns} dataSource={filteredData} rowKey={(record) => record.investorId} scroll={{ x: "max-content" }} />
    </div>
  );
};

export default HistoryListPage;
