import React, { useEffect, useState } from "react";
import { Table, TableColumnType, Input, Button } from "antd";
import { FilterSquare } from "iconsax-react";
import KronosCustomerService from "@/services/KronosCustomerService";

interface RedemptionHistory {
  objectId: string;
  createdAt: Date;
  amount: number;
  address: string;
  networkId: string;
}

const ListingRedemptionHistory = ({ token }: any) => {
  const [redemptionHistory, setRedemptionHistory] = useState<
    RedemptionHistory[]
  >([]);
  const [searchText, setSearchText] = useState<string>("");

  // Generic filter function for columns
  const getColumnSearchProps = (
    dataIndex: keyof RedemptionHistory
  ): TableColumnType<RedemptionHistory> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
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
    filterIcon: (filtered) => (
      <FilterSquare style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) => {
      return String(record[dataIndex])
        .toLowerCase()
        .includes((value as string).toLowerCase());
    },
  });

  // Define columns with sorting and filtering
  const columns: TableColumnType<RedemptionHistory>[] = [
    {
      title: "Record Id",
      dataIndex: "objectId",
      sorter: (a, b) => a.objectId.localeCompare(b.objectId),
      ...getColumnSearchProps("objectId"),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (createdAt: Date) => new Date(createdAt).toLocaleDateString(),
      ...getColumnSearchProps("createdAt"),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      sorter: (a, b) => a.amount - b.amount,
      render: (amount: number) => `$${amount}`,
      ...getColumnSearchProps("amount"),
    },
    {
      title: "Treasury Address",
      dataIndex: "address",
      sorter: (a, b) => a.address.localeCompare(b.address),
      ...getColumnSearchProps("address"),
    },
    {
      title: "Network Id",
      dataIndex: "networkId",
      sorter: (a, b) => a.networkId.localeCompare(b.networkId),
      ...getColumnSearchProps("networkId"),
    },
  ];

  useEffect(() => {
    const fetchRedemptionHistory = async () => {
      const redemptionHistoryData =
        await KronosCustomerService.getRedemptionHistory(token.tokenId);
      if (redemptionHistoryData) {
        setRedemptionHistory(redemptionHistoryData);
      } else {
        setRedemptionHistory([]);
      }
    };
    fetchRedemptionHistory();
  }, [token.tokenId]);

  return (
    <Table
      rowKey="objectId"
      columns={columns}
      dataSource={redemptionHistory}
      pagination={false}
      scroll={{ y: 400 }}
    />
  );
};

export default ListingRedemptionHistory;
