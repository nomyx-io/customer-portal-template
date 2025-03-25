"use client";

import { useState } from "react";

import { EyeOutlined } from "@ant-design/icons";
import { Table, Input, Button, Modal, ConfigProvider } from "antd";
import type { ColumnsType } from "antd/es/table";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { formatPrice } from "@/utils/currencyFormater";

import { TradeFinancePool } from "../../types/poolData";

interface Props {
  pools: TradeFinancePool[];
  handleWithdrawUSDC: (tradeDealId: any) => Promise<void>; // Parent function
}

const PoolTableView: React.FC<Props> = ({ pools, handleWithdrawUSDC }) => {
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTradeDealId, setSelectedTradeDealId] = useState<any>(null);

  const router = useRouter();

  const handleSearch = (value: string) => {
    setSearchText(value.toLowerCase());
  };

  const handleViewClick = (id: string) => {
    router.push(`/pool-details/${id}`);
  };

  const handleSwap = (tradeDealId: any) => {
    setSelectedTradeDealId(tradeDealId);
    setIsModalOpen(true);
  };

  const handleConfirmSwap = async () => {
    if (selectedTradeDealId) {
      await handleWithdrawUSDC(selectedTradeDealId);
      setIsModalOpen(false);
    }
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
    },
    {
      title: "Pool Name",
      dataIndex: "poolName",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center" }} className="ml-4">
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
          title="Confirm Swap Collateral Token to USDC"
          open={isModalOpen}
          onOk={handleConfirmSwap}
          onCancel={() => setIsModalOpen(false)}
          okText="Confirm"
          cancelText="Cancel"
        >
          <p>Are you sure you want to proceed with the swap?</p>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default PoolTableView;
