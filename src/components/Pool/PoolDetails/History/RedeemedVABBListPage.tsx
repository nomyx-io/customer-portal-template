"use client";

import { useEffect, useState } from "react";

import { Table, Input, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";

import { useGemforceApp } from "@/context/GemforceAppContext";
import TradeFinanceService from "@/services/TradeFinanceService";
import { formatPrice } from "@/utils/currencyFormater";

import { RedeemedVABBHistory } from "../../../../types/poolData";

interface Props {
  histories?: RedeemedVABBHistory[];
}

const RedeemedVABBListPage: React.FC<Props> = () => {
  const { appState }: any = useGemforceApp();
  const [searchText, setSearchText] = useState("");
  const [depositHistory, setDepositHistory] = useState<RedeemedVABBHistory[]>([]); // State for fetched pools
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
          const fetchedHistories = await TradeFinanceService.getRedeemedVABBHistory(user.walletAddress); // Call service method
          setDepositHistory(fetchedHistories);
        }
      } catch (error) {
        console.error("Error fetching pools:", error);
      }
    };

    fetchDepositHistories();
  }, []);

  const filteredData = depositHistory.filter((history) => history.redeemerName.toLowerCase().includes(searchText));

  const columns: ColumnsType<RedeemedVABBHistory> = [
    {
      title: "Redeemer Name",
      dataIndex: "redeemerName",
      sorter: (a, b) => a.redeemerName.localeCompare(b.redeemerName),
    },
    {
      title: "Redeemer ID",
      dataIndex: "redeemerId",
    },
    {
      title: "Collateral Amount",
      dataIndex: "collateralAmount",
      render: (collateralAmount: number) => `${formatPrice(collateralAmount / 1_000_000, "USD")}`,
      sorter: (a, b) => a.collateralAmount - b.collateralAmount,
    },
    {
      title: "USDC Amount",
      dataIndex: "usdcAmount",
      render: (usdcAmount: number) => `${formatPrice(usdcAmount / 1_000_000, "USD")}`,
      sorter: (a, b) => a.usdcAmount - b.usdcAmount,
    },
    // {
    //   title: "", // Empty column header
    //   dataIndex: "withdraw",
    //   render: (_, record) => (
    //     <Button type="primary" onClick={() => handleWithdraw(record.redeemerId)}>
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
      <Table columns={columns} dataSource={filteredData} rowKey={(record) => record.id} scroll={{ x: "max-content" }} />
    </div>
  );
};

export default RedeemedVABBListPage;
