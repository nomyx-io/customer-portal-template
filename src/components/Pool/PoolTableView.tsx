"use client";

import { useState } from "react";

import { EyeOutlined } from "@ant-design/icons";
import { Table, Input, Button, Modal, ConfigProvider, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { formatPrice } from "@/utils/currencyFormater";

import { TradeFinancePool } from "../../types/poolData";

interface Props {
  pools: TradeFinancePool[];
  handleRedeemVABB: (tradeDealId: number, vabbAmount: number) => Promise<void>; // Parent function
}

const PoolTableView: React.FC<Props> = ({ pools, handleRedeemVABB }) => {
  const [searchText, setSearchText] = useState("");
  const [isRdeeemVABBModalOpen, setIsRdeeemVABBModalOpen] = useState(false);
  const [selectedTradeDealId, setSelectedTradeDealId] = useState<number | null>(null);
  const [vabbAmount, setVabbAmount] = useState<number | null>(null);

  const router = useRouter();

  const handleSearch = (value: string) => {
    setSearchText(value.toLowerCase());
  };

  const handleViewClick = (id: string) => {
    router.push(`/pool-details/${id}`);
  };

  const handleSwap = (tradeDealId: any) => {
    setSelectedTradeDealId(tradeDealId);
    setIsRdeeemVABBModalOpen(true);
  };

  const handleConfirmRedeem = async () => {
    if (selectedTradeDealId || (0 >= 0 && vabbAmount)) {
      await handleRedeemVABB(selectedTradeDealId || 0, vabbAmount || 0);
      setIsRdeeemVABBModalOpen(false);
    }
  };

  const handleRedeemVABBCancel = () => {
    setIsRdeeemVABBModalOpen(false);
  };

  const filteredData = pools.filter((pool) => pool.title.toLowerCase().includes(searchText));

  const columns: ColumnsType<TradeFinancePool> = [
    {
      title: "",
      dataIndex: "view",
      render: (_, record) => (
        <EyeOutlined style={{ fontSize: 18, cursor: "pointer", color: "#1890ff" }} onClick={() => handleViewClick(record.projectId)} />
      ),
      fixed: "left",
      width: 50,
    },
    {
      title: "Pool Name",
      dataIndex: "poolName",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center" }} className="">
          <div className="w-12 h-12 relative rounded overflow-hidden flex-shrink-0">
            <Image src={record.logo?.url() || "/default-image.png"} alt={record.title || "Pool Image"} fill className="object-cover" />
          </div>
          <span className="ml-3 font-bold">{record.title}</span>
        </div>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Pool"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ marginBottom: 8, display: "block" }}
          />
        </div>
      ),
    },
    {
      title: <div style={{ whiteSpace: "pre-line" }}>Total Invested Amount</div>,
      dataIndex: "totalInvestedAmount",
      render: (totalInvestedAmount) => formatPrice(totalInvestedAmount / 1_000_000, "USD"),
      sorter: (a, b) => (a.totalInvestedAmount ?? 0) - (b.totalInvestedAmount ?? 0),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
          <Button type="primary" size="small" onClick={() => handleSwap(record.tradeDealId)}>
            Swap Collateral Token to USDC
          </Button>
          <Button type="primary" size="small" onClick={() => handleSwap(record.tradeDealId)}>
            Swap Dividend Token to USDC
          </Button>
        </div>
      ),
      width: 200,
    },
  ];

  return (
    <div>
      <Table className="pool-table" columns={columns} dataSource={filteredData} rowKey={(record) => record.projectId} scroll={{ x: "max-content" }} />

      {/* Confirmation Modal */}
      <ConfigProvider
        theme={{
          token: {
            colorBgElevated: "#ffffff", // Light theme modal background
            colorText: "#000000", // Light theme text
          },
        }}
      >
        <Modal
          title="Redeem VABB"
          open={isRdeeemVABBModalOpen}
          onCancel={handleRedeemVABBCancel}
          footer={[
            <Button key="cancel" onClick={handleRedeemVABBCancel} className="text-gray-700 dark:text-gray-300">
              Cancel
            </Button>,
            <Button
              key="submit"
              type="default"
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
              onClick={() => handleConfirmRedeem()}
              disabled={!vabbAmount}
            >
              Submit
            </Button>,
          ]}
        >
          <p>Enter the amount you want to redeem:</p>
          <InputNumber
            min={1}
            value={vabbAmount}
            onChange={setVabbAmount}
            className="w-full mt-2 border rounded-md bg-white focus-within:bg-white text-black"
            placeholder="Enter amount"
          />
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default PoolTableView;
