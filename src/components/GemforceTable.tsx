import { useEffect, useState } from "react";

import { FilterFilled, FilterOutlined } from "@ant-design/icons";
import { Button, DatePicker, Input, Select, Table, TableProps, theme as antdTheme } from "antd";
import { Dayjs } from "dayjs";

import { getValue } from "@/utils";
import { DataType, NomyxEvent } from "@/utils/Constants";

interface FilterProps {
  dataIndex: string | string[];
  onFilter: (dataIndex: string | string[], operator: string, value: any) => void;
  onClearFilter: (dataIndex: string | string[]) => void;
}

interface GemforceTableProps extends TableProps<any> {
  selectEnabled?: boolean;
}

const StringFilter: React.FC<FilterProps> = ({ dataIndex, onFilter, onClearFilter }: any) => {
  const [operator, setOperator] = useState<string>();
  const [value, setValue] = useState<string>("");

  const handleFilter = () => {
    onFilter(dataIndex, operator, value);
  };

  const clearFilter = () => {
    onClearFilter(dataIndex);
    setOperator(undefined);
    setValue("");
  };

  return (
    <div
      className="bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark border !border-nomyx-gray4-light dark:!border-nomyx-gray4-dark rounded-md"
      style={{ padding: 8 }}
    >
      <Select style={{ marginBottom: 8, display: "block" }} onChange={setOperator} placeholder="Select operator" value={operator}>
        <Select.Option value="equals">Equals</Select.Option>
        <Select.Option value="contains">Contains</Select.Option>
        <Select.Option value="doesNotEqual">Does not equal</Select.Option>
        <Select.Option value="doesNotContain">Does not contain</Select.Option>
      </Select>
      <Input
        style={{ marginBottom: 8, display: "block" }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Input value"
        className="text-nomyx-text-light dark:text-nomyx-text-dark placeholder-nomyx-gray3-light dark:placeholder-nomyx-gray3-dark bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark hover:bg-nomyx-dark2-light hover:dark:bg-nomyx-dark2-dark foucs:bg-nomyx-dark2-light focus:dark:bg-nomyx-dark2-dark focus-within:bg-nomyx-dark2-light focus-within:dark:bg-nomyx-dark2-dark border-nomyx-gray4-light dark:border-nomyx-gray4-dark"
      />
      <div className="actions">
        <Button className="text-nomyx-text-light dark:text-nomyx-text-dark hover:!bg-transparent" onClick={clearFilter}>
          Clear
        </Button>
        <Button type="primary" onClick={handleFilter}>
          Apply
        </Button>
      </div>
    </div>
  );
};

const NumberFilter: React.FC<FilterProps> = ({ dataIndex, onFilter, onClearFilter }) => {
  const [operator, setOperator] = useState<any>();
  const [value, setValue] = useState<string>("");

  const handleFilter = () => {
    onFilter(dataIndex, operator, parseFloat(value));
  };

  const clearFilter = () => {
    onClearFilter(dataIndex);
    setOperator(undefined);
    setValue("");
  };

  return (
    <div style={{ padding: 8 }}>
      <Select style={{ marginBottom: 8, display: "block" }} onChange={setOperator} placeholder="Select operator" value={operator}>
        <Select.Option value="=">=</Select.Option>
        <Select.Option value="<>">&lt;&gt;</Select.Option>
        <Select.Option value="&gt;">&gt;</Select.Option>
        <Select.Option value="&lt;">&lt;</Select.Option>
        <Select.Option value="&gt;=">&gt;=</Select.Option>
        <Select.Option value="&lt;=">&lt;=</Select.Option>
      </Select>
      <Input
        type="number"
        style={{ marginBottom: 8, display: "block" }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Input number"
      />
      <div className="actions">
        <Button onClick={clearFilter}>Clear</Button>
        <Button type="primary" onClick={handleFilter}>
          Apply
        </Button>
      </div>
    </div>
  );
};

const DateFilter: React.FC<FilterProps> = ({ dataIndex, onFilter, onClearFilter }) => {
  const [operator, setOperator] = useState<any>();
  const [value, setValue] = useState<Dayjs | null>(null);

  const handleFilter = () => {
    onFilter(dataIndex, operator, value);
  };

  const clearFilter = () => {
    onClearFilter(dataIndex);
    setOperator(undefined);
    setValue(null);
  };

  return (
    <div style={{ padding: 8 }}>
      <Select style={{ marginBottom: 8, display: "block" }} onChange={setOperator} placeholder="Select operator" value={operator}>
        <Select.Option value="equals">Equals</Select.Option>
        <Select.Option value="before">Before</Select.Option>
        <Select.Option value="after">After</Select.Option>
      </Select>
      <DatePicker
        style={{ marginBottom: 8, display: "block" }}
        onChange={(date) => {
          setValue(date);
        }}
        placeholder="Select date"
      />
      <div className="actions">
        <Button onClick={clearFilter}>Clear</Button>
        <Button type="primary" onClick={handleFilter}>
          Apply
        </Button>
      </div>
    </div>
  );
};

const GemforceTable: React.FC<GemforceTableProps> & {
  StringFilter: typeof StringFilter;
  NumberFilter: typeof NumberFilter;
  DateFilter: typeof DateFilter;
} = (props: GemforceTableProps) => {
  const { useToken } = antdTheme;
  const { token: theme } = useToken();

  const [filters, setFilters] = useState<any>({});
  const [filteredData, setFilteredData] = useState<any>([]);

  const selectEnabled = props.selectEnabled;
  const [selectedRowKeys, setSelectedRowKeys] = useState<any>([]);

  const applyFilters = () => {
    let filteredData: any = props?.dataSource;

    Object.keys(filters).forEach((k: any) => {
      const f = filters[k];

      filteredData = filteredData?.filter((row: any) => {
        const rowValue: any = getValue(k, row);
        switch (f.operator) {
          case "equals":
            return rowValue == f.value;
          case "contains":
            return rowValue.includes(f.value);
          case "doesNotEqual":
            return rowValue != f.value;
          case "doesNotContain":
            return !rowValue.includes(f.value);

          case "=":
            return rowValue == f.value;
          case "<>":
            return rowValue != f.value;
          case "<":
            return rowValue < f.value;
          case ">":
            return rowValue > f.value;
          case ">=":
            return rowValue >= f.value;
          case "<=":
            return rowValue <= f.value;

          case "before":
            return rowValue < f.value;
          case "after":
            return rowValue > f.value;
        }
      });
    });

    setFilteredData(filteredData);
  };

  const handleFilter = (dataIndex: any, operator: any, value: any) => {
    const propPath = Array.isArray(dataIndex) ? dataIndex.join(".") : dataIndex;
    filters[propPath] = { operator, value };
    applyFilters();
  };

  const handleClearFilter = (dataIndex: any) => {
    const propPath = Array.isArray(dataIndex) ? dataIndex.join(".") : dataIndex;
    delete filters[propPath];
    applyFilters();
  };

  // Check if a column has an active filter
  const isFilterActive = (dataIndex: any) => {
    const propPath = Array.isArray(dataIndex) ? dataIndex.join(".") : dataIndex;
    return filters.hasOwnProperty(propPath);
  };

  const selectRow = (record: any) => {
    const rowKey: any = props.rowKey;
    const selected: any = [...selectedRowKeys];
    if (selected.indexOf(record[rowKey]) >= 0) {
      selected.splice(selected.indexOf(record[rowKey]), 1);
    } else {
      selected.push(record[rowKey]);
    }
    setSelectedRowKeys(selected);
  };

  const onSelectedRowKeysChange = (selectedRowKeys: any) => {
    setSelectedRowKeys(selectedRowKeys);
    PubSub.publish(NomyxEvent.GemforceTableSelectionChange, { selectedRowKeys });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectedRowKeysChange,
  };

  useEffect(() => {
    setFilteredData(props?.dataSource);
  }, [props]);

  props.columns?.forEach((c: any) => {
    switch (c.dataType) {
      case DataType.NUMBER:
        c.filterDropdown = <NumberFilter dataIndex={c.dataIndex} onFilter={handleFilter} onClearFilter={handleClearFilter} />;
        break;
      case DataType.DATE:
        c.filterDropdown = <DateFilter dataIndex={c.dataIndex} onFilter={handleFilter} onClearFilter={handleClearFilter} />;
        break;
      default:
        c.filterDropdown = <StringFilter dataIndex={c.dataIndex} onFilter={handleFilter} onClearFilter={handleClearFilter} />;
        break;
    }

    c.filterIcon = (filtered: any) => {
      return isFilterActive(c.dataIndex) ? (
        <FilterFilled
          style={{
            color: theme.colorPrimary,
          }}
        />
      ) : (
        <FilterFilled />
      );
    };
  });

  return (
    <>
      <Table
        {...props}
        dataSource={filteredData}
        rowSelection={selectEnabled ? rowSelection : undefined}
        onRow={(record) => ({
          onClick: () => {
            selectRow(record);
          },
        })}
      />
    </>
  );
};

GemforceTable.StringFilter = StringFilter;
GemforceTable.NumberFilter = NumberFilter;
GemforceTable.DateFilter = DateFilter;

export default GemforceTable;
