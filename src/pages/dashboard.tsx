import React, { useEffect, useState, useMemo, useCallback } from "react";

import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Card, List, Statistic, Tabs } from "antd/es";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import { Setting, DollarCircle, Coin } from "iconsax-react";
import { useSession } from "next-auth/react";
import { Bar } from "react-chartjs-2";

import Ellipsis from "@/components/Ellipsis";
import KronosCustomerService from "@/services/KronosCustomerService";

Chart.register(CategoryScale);

const Dashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const user = session?.user;

  // State variables
  const [tokens, setTokens] = useState<any>([]);
  const [retiredTokens, setRetiredTokens] = useState<any>([]);
  const [events, setEvents] = useState<any>([]);

  // Derived state
  const carbonRetired = useMemo(() => {
    return retiredTokens.reduce((acc: number, token: any) => acc + parseFloat(token.existingCredits), 0);
  }, [retiredTokens]);

  const { currentValue, totalCarbon } = useMemo(() => {
    const totalValue = tokens.reduce((acc: number, token: any) => acc + parseFloat(token.price), 0);
    const totalCarbon = tokens.reduce((acc: number, token: any) => acc + parseFloat(token.existingCredits), 0);
    return { currentValue: totalValue, totalCarbon };
  }, [tokens]);

  //const retirableCarbon = useMemo(() => parseFloat(totalCarbon) - parseFloat(carbonRetired), [totalCarbon, carbonRetired]);

  // Statistics data
  const stats = useMemo(
    () => [
      {
        title: "Tokens",
        value: tokens?.length,
        // Icon KronosSymbolDark or KronosSymbolLight depending on the theme
        icon: <Coin />,
        color: tokens?.length < 1 ? "text-nomyx-danger-light dark:text-nomyx-danger-dark" : "text-nomyx-text-light dark:text-nomyx-text-dark",
      },
      {
        title: "Current Value",
        value: currentValue ? currentValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0",
        icon: <DollarCircle className="text-nomyx-text-light dark:text-nomyx-text-dark" />,
        color: "text-nomyx-text-light dark:text-nomyx-text-dark",
      },
    ],
    [tokens.length, currentValue]
  );

  // Filtered events
  const salesEvents = useMemo(() => events.filter((event: any) => event.event === "Sales"), [events]);
  const redemptionEvents = useMemo(() => events.filter((event: any) => event.event === "CarbonCreditsRetired"), [events]);

  // Chart data preparation
  const prepareTokenChartData = useCallback(() => {
    return {
      labels: ["Total Tokens Purchased", "Sales"],
      datasets: [
        {
          label: "Total Tokens Purchased",
          data: [tokens?.length || 0, 0],
          backgroundColor: "rgba(33, 102, 248, 0.8)",
        },
        {
          label: "Sales",
          data: [0, salesEvents?.length || 0],
          backgroundColor: "rgba(255, 130, 0, 0.8)",
        },
      ],
    };
  }, [tokens.length, retiredTokens.length]);

  const prepareCarbonChartData = useCallback(() => {
    return {
      labels: ["Total Carbon Purchased", "Total Carbon Retired"],
      datasets: [
        {
          label: "Total Carbon Purchased",
          data: [totalCarbon, 0],
          backgroundColor: "rgba(33, 102, 248, 0.8)",
        },
        {
          label: "Total Carbon Retired",
          data: [0, carbonRetired],
          backgroundColor: "rgba(255, 130, 0, 0.8)",
        },
      ],
    };
  }, [totalCarbon, carbonRetired]);

  // Chart options
  const chartOptions: any = useMemo(
    () => ({
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          stacked: true,
        },
        y: {
          beginAtZero: true,
          stacked: false,
          max: (context: { chart: { data: { datasets: { data: number[] }[] } } }) => {
            const maxData = Math.max(...context.chart.data.datasets.flatMap((dataset) => dataset.data));
            return maxData * 1.1;
          },
          ticks: {
            stepSize: 5,
          },
        },
      },
    }),
    []
  );

  // Tab items
  const mainTabItems = useMemo(
    () => [
      {
        key: "1",
        label: "Token Insights",
        children: <Bar data={prepareTokenChartData()} options={chartOptions} />,
        className: "chart",
      },
      {
        key: "2",
        label: "Carbon Insights",
        children: <Bar data={prepareCarbonChartData()} options={chartOptions} />,
        className: "chart",
      },
    ],
    [prepareTokenChartData, prepareCarbonChartData, chartOptions]
  );

  const sidebarTabItems = useMemo(
    () => [
      {
        key: "1",
        label: "Purchases",
        children: (
          <List
            itemLayout="horizontal"
            dataSource={salesEvents}
            renderItem={(item: any, index) => (
              <List.Item key={`event-list-item-${index}`}>
                <List.Item.Meta
                  className="px-4 text-nomyx-text-light dark:text-nomyx-text-dark"
                  avatar={<WarningOutlined />}
                  title={
                    <a href={`${process.env.NEXT_PUBLIC_ETHERSCAN_BASE_URL}${item.transactionHash}`} target="_blank">
                      {item.event}
                    </a>
                  }
                  description={<Ellipsis suffixCount={12}>{item.transactionHash}</Ellipsis>}
                />
              </List.Item>
            )}
          />
        ),
        className: "event-list",
      },
      {
        key: "2",
        label: "Redemptions",
        children: (
          <List
            itemLayout="horizontal"
            dataSource={redemptionEvents}
            renderItem={(item: any, index) => (
              <List.Item key={`event-list-item-${index}`}>
                <List.Item.Meta
                  className="px-4 text-nomyx-text-light dark:text-nomyx-text-dark"
                  avatar={<InfoCircleOutlined />}
                  title={
                    <a href={`${process.env.NEXT_PUBLIC_ETHERSCAN_BASE_URL}${item.transactionHash}`} target="_blank">
                      {item.event}
                    </a>
                  }
                  description={<Ellipsis suffixCount={12}>{item.transactionHash}</Ellipsis>}
                />
              </List.Item>
            )}
          />
        ),
        className: "event-list",
      },
    ],
    [salesEvents, redemptionEvents]
  );

  // Fetch functions
  const fetchEvents = useCallback(async () => {
    if (!user?.walletAddress) {
      console.error("User wallet address not found.");
      return;
    }
    try {
      const fetchedEvents = await KronosCustomerService.getCustomerEvents(user.walletAddress);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, [user]);

  const fetchRetiredTokens = useCallback(async () => {
    if (!user?.walletAddress) {
      console.error("User wallet address is missing.");
      return;
    }
    try {
      const fetchedRetiredTokens = await KronosCustomerService.getRetiredTokensForUser(user.walletAddress);
      setRetiredTokens(fetchedRetiredTokens);
    } catch (error) {
      console.error("Error fetching retired tokens:", error);
    }
  }, [user]);

  const fetchTokens = useCallback(async () => {
    if (!user?.walletAddress) {
      console.error("User wallet address is missing.");
      return;
    }
    try {
      const fetchedTokens = await KronosCustomerService.getTokensForUser(user.walletAddress);
      setTokens(fetchedTokens);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
  }, [user]);

  // Initial data fetch on component mount
  useEffect(() => {
    if (status === "authenticated" && user?.walletAddress) {
      fetchEvents();
      fetchRetiredTokens();
      fetchTokens();
    }
  }, [status, user, fetchEvents, fetchRetiredTokens, fetchTokens]);

  return (
    <>
      <div className="dashboard grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-3">
          {/* Statistics section */}
          <div className="flex flex-wrap gap-3 pb-3">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="flex-1 text-center bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark border-nomyx-gray4-light dark:border-nomyx-gray4-dark"
              >
                <Statistic
                  title={<span className="text-nomyx-gray2-light dark:text-nomyx-gray2-dark">{stat.title}</span>}
                  value={stat.value}
                  formatter={() => (
                    <div className="flex items-center space-x-2">
                      {stat.icon}
                      <span className={stat.color}>{stat.value}</span>
                    </div>
                  )}
                  valueStyle={{
                    color: stat.color,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                />
              </Card>
            ))}
          </div>

          {/* Main content section */}
          <Card className="no-padding min-h-[600px] bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark border-nomyx-gray4-light dark:border-nomyx-gray4-dark feature">
            <Tabs items={mainTabItems} />
          </Card>
        </div>

        {/* Sidebar section */}
        <Card className="col-span-1 no-padding text-nomyx-text-light dark:text-nomyx-text-dark bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark border-b border-nomyx-gray4-light dark:border-nomyx-gray4-dark">
          <Tabs items={sidebarTabItems} />
        </Card>
      </div>
    </>
  );
};

export default Dashboard;
