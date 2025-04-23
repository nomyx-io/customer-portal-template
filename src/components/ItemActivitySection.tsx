import React, { useCallback, useEffect, useState } from "react";

import { Input, DatePicker, Button, TableColumnType, Table } from "antd";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { FilterSquare } from "iconsax-react";

import KronosCustomerService from "@/services/KronosCustomerService";

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;

interface ActivityRecord {
  key: string;
  activity: string;
  date: string; // Keeping it as string but will parse it to Dayjs later
}

const ItemActivity = ({ token, shouldApplyActivityFilter = false }: any) => {
  const [activityData, setActivityData] = useState<ActivityRecord[]>([]);
  const [filteredData, setFilteredData] = useState<ActivityRecord[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const formatActivityData = useCallback((data: any) => {
    return data.map((act: any, index: number) => ({
      key: index.toString(),
      activity: act.event,
      date: new Date(act.createdAt).toLocaleString(),
    }));
  }, []);

  const fetchActivityData = useCallback(async () => {
    if (token?.objectId || token?.id) {
      try {
        const data = await KronosCustomerService.getTokenActivity([token.objectId || token?.id]);

        // Determine whether to apply the activity filter
        const filteredActivity = shouldApplyActivityFilter
          ? data.filter((act: any) => act.tokens.some((activityToken: { tokenId: string }) => activityToken.tokenId === token.tokenId))
          : data;

        // Format the (filtered) activity data
        const formattedActivity = formatActivityData(filteredActivity);

        setActivityData(data);
        setFilteredData(formattedActivity);
      } catch (error) {
        console.error("Error fetching activity data:", error);
      }
    } else {
      console.error("Token object ID is missing.");
      return;
    }
  }, [token, shouldApplyActivityFilter, formatActivityData]);

  // Filter the activity data based on tokenId
  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  // Generic filter function for columns
  const getColumnSearchProps = (dataIndex: keyof ActivityRecord, dataType: "string" | "date"): TableColumnType<ActivityRecord> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        {dataType === "date" ? (
          <RangePicker
            onChange={(dates) => {
              setSelectedKeys(dates && dates[0] && dates[1] ? [dates[0].toISOString(), dates[1].toISOString()] : []);
            }}
            style={{ marginBottom: 8, display: "block", width: "100%" }}
          />
        ) : (
          <Input
            placeholder={`Search ${dataIndex}`}
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block", width: "100%" }}
          />
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button type="primary" onClick={() => confirm()} size="small" style={{ width: "48%", height: "10%" }}>
            Search
          </Button>
          <Button
            onClick={() => {
              clearFilters && clearFilters();
              setSelectedKeys([]);
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
      if (!value) return true;
      if (dataType === "date" && Array.isArray(value) && value.length === 2) {
        const [start, end] = value.map((v) => new Date(v));
        const recordDate = new Date(record[dataIndex]);
        return recordDate >= start && recordDate <= end;
      }

      if (typeof value === "string") {
        return String(record[dataIndex]).toLowerCase().includes(value.toLowerCase());
      }

      return false;
    },
  });

  // Define columns with sorting and filtering
  const columns: TableColumnType<ActivityRecord>[] = [
    {
      title: "Activity",
      dataIndex: "activity",
      sorter: (a, b) => a.activity.localeCompare(b.activity),
      ...getColumnSearchProps("activity", "string"),
    },
    {
      title: "Date",
      dataIndex: "date",
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ...getColumnSearchProps("date", "date"),
    },
  ];

  return <Table rowKey="key" columns={columns} dataSource={filteredData} pagination={false} scroll={{ y: 600 }} />;
};

export default ItemActivity;
