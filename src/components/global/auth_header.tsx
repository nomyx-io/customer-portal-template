import React, { useState } from "react";
import { Layout, Select } from "antd";
import { DownOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Header } = Layout;
const { Option } = Select;

// Define the menu items with 2-letter abbreviations
const languageItems = [
  {
    key: "1",
    label: "EN", // English
  },
  {
    key: "2",
    label: "ES", // Spanish
  },
  {
    key: "3",
    label: "FR", // French
  },
];

const AppHeader: React.FC = () => {
  // State for the selected language, default is "EN"
  const [selectedLanguage, setSelectedLanguage] = useState("EN");

  // Handle the language change
  const handleChange = (value: string) => {
    setSelectedLanguage(value);
  };

  return (
    <Header
      className="header"
      style={{
        width: "100%", // Full width
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: "0 20px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Logo */}
      <div className="logo">
        <Link href="/">
          <img
            src="/images/nomyx_logo_black.svg"
            alt="Logo"
            style={{ height: "25px", cursor: "pointer" }}
          />
        </Link>
      </div>

      {/* Language Selector */}
      <Select
        value={selectedLanguage}
        onChange={handleChange}
        suffixIcon={<DownOutlined />} // Arrow color set in CSS
        style={{
          backgroundColor: "transparent", // Transparent background for selector
          border: "none", // No border for selector
        }}
        dropdownStyle={{
          backgroundColor: "black", // Black background for dropdown
          color: "white", // Text color for dropdown items
        }}
      >
        {languageItems.map((item) => (
          <Option key={item.key} value={item.label} style={{ color: "white" }}>
            {item.label}
          </Option>
        ))}
      </Select>
    </Header>
  );
};

export default AppHeader;
