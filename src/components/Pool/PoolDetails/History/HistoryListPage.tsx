"use client";

import { useEffect, useState } from "react";

import { Table, Input, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";

import { useGemforceApp } from "@/context/GemforceAppContext";
import TradeFinanceService from "@/services/TradeFinanceService";
import { formatPrice } from "@/utils/currencyFormater";

import { HistoryData } from "../../../../types/poolData";

interface Props {
  histories?: HistoryData[];
}

const HistoryListPage: React.FC<Props> = () => {
  const { appState }: any = useGemforceApp();
  const [searchText, setSearchText] = useState("");
  const [depositHistory, setDepositHistory] = useState<HistoryData[]>([]); // State for fetched pools
  const router = useRouter();

  const handleSearch = (value: string) => {
    setSearchText(value.toLowerCase());
  };

  const handleWithdraw = (id: string) => {
    console.log(`Withdraw clicked for investorId: ${id}`);
    // Add your withdrawal logic here
  };

  useEffect(() => {
    const fetchDepositHistories = async () => {
      try {
        const user = appState?.session?.user;
        if (user?.walletAddress) {
          const fetchedHistories = await TradeFinanceService.getDepositHistory(user.walletAddress); // Call service method
          setDepositHistory(fetchedHistories);
        }
      } catch (error) {
        console.error("Error fetching pools:", error);
      }
    };

    fetchDepositHistories();
  }, []);

  const filteredData = depositHistory.filter((history) => history.investorName.toLowerCase().includes(searchText));

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
      render: (amountDeposited: number) => `${formatPrice(amountDeposited, "USD")}`,
      sorter: (a, b) => a.amountDeposited - b.amountDeposited,
    },
    // {
    //   title: "", // Empty column header
    //   dataIndex: "withdraw",
    //   render: (_, record) => (
    //     <Button type="primary" onClick={() => handleWithdraw(record.investorId)}>
    //       Withdraw
    //     </Button>
    //   ),
    // },
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
