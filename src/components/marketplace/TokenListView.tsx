import React, { useState, useEffect } from "react";

import { EyeOutlined } from "@ant-design/icons";
import { Table, Checkbox, Button } from "antd";

import { Industries } from "@/config/generalConfig";
import { ColumnConfig, EXCLUDED_COLUMNS } from "@/types/dynamicTableColumn";
import { hashToColor } from "@/utils/colorUtils";
import { formatPrice } from "@/utils/currencyFormater";
import { formatNumber } from "@/utils/numberFormatter";

const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

interface TokenListViewProps {
  projects: any[];
  onProjectClick: (project: any) => void;
  onSelectionChange?: (selectedProjects: any[]) => void; // Prop for selection change callback
  onPurchaseToken?: (token: any) => void; // Prop for handling purchase of a single token
  isSalesHistory: boolean; // New prop to determine if this is a sales history view
  industryTemplate?: string;
}

const TokenListView: React.FC<TokenListViewProps> = ({
  projects,
  onProjectClick,
  onSelectionChange,
  onPurchaseToken,
  isSalesHistory,
  industryTemplate,
}) => {
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // Effect to update filtered projects whenever projects data changes
  useEffect(() => {
    setFilteredProjects(projects);
  }, [projects]);

  // Filter handling
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setFilterQuery(query);
    setFilteredProjects(
      projects.filter((project) => project.token?.nftTitle.toLowerCase().includes(query) || project.price.toString().includes(query))
    );
  };

  // Handle "Select All" checkbox change
  const handleSelectAllChange = (e: any) => {
    const checked = e.target.checked;
    setSelectAllChecked(checked);
    const allRowKeys = filteredProjects.map((project) => project.tokenId);
    if (checked) {
      setSelectedRowKeys(allRowKeys);
      onSelectionChange?.(filteredProjects); // Notify parent with all selected projects
    } else {
      setSelectedRowKeys([]);
      onSelectionChange?.([]); // Notify parent with no selected projects
    }
  };

  // Handle individual row selection change
  const handleRowSelectChange = (tokenId: string, checked: boolean) => {
    let updatedSelectedKeys: string[]; // Declare the type explicitly

    if (checked) {
      updatedSelectedKeys = [...selectedRowKeys, tokenId]; // Add tokenId if checked
    } else {
      updatedSelectedKeys = selectedRowKeys.filter((key) => key !== tokenId); // Remove tokenId if unchecked
    }

    setSelectedRowKeys(updatedSelectedKeys);
    setSelectAllChecked(updatedSelectedKeys.length === filteredProjects.length);

    // Update the parent with the newly selected projects
    const selectedProjects = filteredProjects.filter((project) => updatedSelectedKeys.includes(project.tokenId));

    // If onSelectionChange prop is provided, notify the parent component
    onSelectionChange?.(selectedProjects);
  };

  // Generate SVG Icon
  const generateSvgIcon = (color: string) => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#003366" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="15" fill={`url(#gradient-${color})`} />
        <text
          x="50%"
          y="50%"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize="40"
          fill="white"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          SGH
        </text>
      </svg>
    );
  };

  const getDynamicColumns = (maxColumns = 8): ColumnConfig[] => {
    const nonNullColumns: Record<string, ColumnConfig> = {};
    projects.forEach((token) => {
      const tokenData = industryTemplate === Industries.TRADE_FINANCE ? token : token.token;
      if (tokenData) {
        Object.entries(tokenData).forEach(([key, value]) => {
          // Check if the column is non-null, non-undefined, not already in nonNullColumns, and not excluded
          if (value != null && !(key in nonNullColumns) && !EXCLUDED_COLUMNS.has(key)) {
            nonNullColumns[key] = {
              title: key
                .replace(/([A-Z])/g, " $1") // Add space before uppercase letters
                .replaceAll("_", " ") // Replace underscores with spaces
                .replace(/\b\w/g, (char) => char.toUpperCase()), // Capitalize first letter of every word
              key,
            };
          }
        });
      }
    });
    return Object.values(nonNullColumns).slice(0, maxColumns);
  };

  const createColumns = (nonNullColumns: ColumnConfig[]) => {
    return nonNullColumns.map(({ title, key }) => {
      const isTotalAmount = key === "totalAmount";
      const isIsinNumber = key === "isin_number";
      const isParValue = key === "par_value";
      return {
        title: isTotalAmount ? "Price" : isIsinNumber ? "ISIN Number" : title,
        dataIndex: industryTemplate === Industries.TRADE_FINANCE ? key : ["token", key],
        render: (value: any) => {
          if (isTotalAmount || isParValue) {
            return formatPrice(isTotalAmount ? value / 1_000_000 : value, "USD") || "-";
          }
          if (typeof value === "object") return "N/A";
          if (
            value !== undefined &&
            value !== null &&
            !isNaN(Number(value)) &&
            !isValidUrl(value?.toString()) &&
            key !== "tokenId" &&
            key !== "mintAddress"
          ) {
            return formatNumber(Number(value));
          }
          if (typeof value === "string" && isValidUrl(value)) {
            return (
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                View Document
              </a>
            );
          }
          return <span>{value}</span>;
        },
        sorter: (a: any, b: any) => {
          const aValue = industryTemplate === Industries.TRADE_FINANCE ? a[key] : a.token[key];
          const bValue = industryTemplate === Industries.TRADE_FINANCE ? b[key] : b.token[key];

          if (isTotalAmount) {
            return (aValue ?? 0) - (bValue ?? 0);
          }

          return typeof aValue === "string" && typeof bValue === "string" ? aValue.localeCompare(bValue) : 0;
        },
      };
    });
  };

  const dynamicColumns = getDynamicColumns(); // This would be your method to get the first 7 non-null columns
  const additionalColumns = createColumns(dynamicColumns);

  // Define columns conditionally based on `isSalesHistory`
  const listingColumns = [
    ...(!isSalesHistory
      ? [
          {
            title: (
              <div style={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  checked={selectAllChecked}
                  indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < filteredProjects.length}
                  onChange={handleSelectAllChange}
                />
              </div>
            ),
            dataIndex: "tokenId",
            render: (tokenId: string, record: any) => (
              <Checkbox checked={selectedRowKeys.includes(tokenId)} onChange={(e) => handleRowSelectChange(tokenId, e.target.checked)} />
            ),
          },
        ]
      : []),
    {
      title: "Name",
      dataIndex: "tokenId",
      render: (tokenId: string, record: any) => {
        const color = hashToColor(tokenId);
        const title = industryTemplate === Industries.TRADE_FINANCE ? `Stock Certificate ${record.tokenId}` : record.token?.nftTitle;

        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            {!isSalesHistory && (
              <EyeOutlined
                className="text-xl cursor-pointer hover:text-blue-500"
                onClick={() => onProjectClick(record)}
                style={{ marginRight: "8px" }}
              />
            )}
            {!isSalesHistory && (
              <div
                style={{
                  width: "1px",
                  height: "24px",
                  backgroundColor: "#ccc",
                  marginRight: "8px",
                }}
              />
            )}
            {generateSvgIcon(color)}
            <span style={{ marginLeft: "10px", fontWeight: "bold" }}>{title}</span>
          </div>
        );
      },
      sorter: (a: any, b: any) => {
        const aTitle = industryTemplate === Industries.TRADE_FINANCE ? `Stock Certificate ${a.tokenId}` : a.token?.nftTitle;
        const bTitle = industryTemplate === Industries.TRADE_FINANCE ? `Stock Certificate ${b.tokenId}` : b.token?.nftTitle;
        return aTitle.localeCompare(bTitle);
      },
    },
    ...(filteredProjects.some((row: any) => row.price > 0 || row.token?.price > 0)
      ? [
          {
            title: "Price",
            dataIndex: "price",
            render: (price: number, record: any) => {
              if (industryTemplate === Industries.TRADE_FINANCE) {
                return formatPrice(record.price, "USD");
              }
              return isSalesHistory ? formatPrice(record?.token?.price, "USD") : formatPrice(price / 1_000_000, "USD");
            },
            sorter: (a: any, b: any) => {
              const aPrice = industryTemplate === Industries.TRADE_FINANCE ? a.price : a.token?.price;
              const bPrice = industryTemplate === Industries.TRADE_FINANCE ? b.price : b.token?.price;
              return aPrice - bPrice;
            },
          },
        ]
      : []),
    ...additionalColumns,

    ...(!isSalesHistory && industryTemplate && industryTemplate != Industries.TRADE_FINANCE
      ? [
          {
            title: "Actions",
            render: (_: any, record: any) => (
              <Button type="primary" onClick={() => onPurchaseToken && onPurchaseToken(record)}>
                Purchase
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <Table
      columns={listingColumns}
      dataSource={filteredProjects}
      rowKey="tokenId"
      pagination={false}
      scroll={{ x: "100%" }}
      style={{
        wordWrap: "break-word",
        whiteSpace: "pre-wrap",
        maxHeight: "350px",
        overflowY: "auto",
      }}
    />
  );
};

export default TokenListView;
