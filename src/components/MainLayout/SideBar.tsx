"use client";
import React, { useState } from "react";

import type { MenuProps } from "antd";
import { Layout, Menu, Button } from "antd/es";
import { ChartSquare, LanguageSquare, Shop, Key, MoneyChange } from "iconsax-react";
import Link from "next/link";

import RecoverDfnsKeyModal from "@/components/RecoverDfnsKeyModal";
import { useGemforceApp } from "@/context/GemforceAppContext";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const SideNavBar = () => {
  const { appState }: any = useGemforceApp();
  const user = appState?.session?.user;
  const dfnsToken = user?.dfns_token;
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRecoveryLinkClick = () => {
    // Trigger a popup or perform any action
    setIsModalVisible(true);
  };

  function getItem(label: React.ReactNode, key: React.Key, href?: string, icon?: React.ReactNode, children?: MenuItem[], type?: "group"): MenuItem {
    return {
      key,
      icon,
      children,
      label: href ? (
        <Link className="!text-nomyx-text-light dark:!text-nomyx-text-dark" href={href}>
          {label}
        </Link>
      ) : (
        label
      ),
      type,
    } as MenuItem;
  }

  const items: MenuProps["items"] = [
    getItem("Dashboard", "menu-item-1", "/dashboard", <ChartSquare className="!text-nomyx-text-light dark:!text-nomyx-text-dark" />),
    getItem("My Portfolio", "menu-item-2", "/my-portfolio", <LanguageSquare className="!text-nomyx-text-light dark:!text-nomyx-text-dark" />),
    getItem("Marketplace", "menu-item-3", "/marketplace", <Shop className="!text-nomyx-text-light dark:!text-nomyx-text-dark" />),
    getItem("Transfer In/Out", "menu-item-4", "/transfer-in-out", <MoneyChange className="!text-nomyx-text-light dark:!text-nomyx-text-dark" />),
  ];

  return (
    <>
      <Sider className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark">
        <Menu className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" mode="inline" items={items} />
        {dfnsToken && (
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <Button type="primary" className="w-full flex" icon={<Key />} onClick={handleRecoveryLinkClick}>
              Recover Key
            </Button>
          </div>
        )}
      </Sider>

      <RecoverDfnsKeyModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />
    </>
  );
};

export default SideNavBar;
