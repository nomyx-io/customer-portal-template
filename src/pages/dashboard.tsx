import React, { useEffect, useState, useMemo, useCallback } from "react";

import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Card, List, Statistic, Tabs, Skeleton } from "antd/es";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import { Setting, DollarCircle, Coin, NoteText } from "iconsax-react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { Bar } from "react-chartjs-2";

import Ellipsis from "@/components/Ellipsis";
import KronosCustomerService from "@/services/KronosCustomerService";
import TradeFinanceService from "@/services/TradeFinanceService";

Chart.register(CategoryScale);

const Dashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const user = session?.user;

  // State variables
  const [tokens, setTokens] = useState<any>([]);
  const [retiredTokens, setRetiredTokens] = useState<any>([]);
  const [events, setEvents] = useState<any>([]);
  const [pools, setPools] = useState<any>([]);
  const [loading, setLoading] = useState({
    tokens: true,
    retiredTokens: true,
    events: true,
    pools: true,
  });

  // Derived state
  const carbonRetired = useMemo(() => {
    return retiredTokens.reduce((acc: number, token: any) => acc + parseFloat(token.existingCredits), 0);
  }, [retiredTokens]);

  const { currentValue, totalCarbon } = useMemo(() => {
    const totalValue = tokens.reduce((acc: number, token: any) => acc + parseFloat(token.price), 0);
    const totalCarbon = tokens.reduce((acc: number, token: any) => acc + parseFloat(token.existingCredits), 0);
    return { currentValue: totalValue, totalCarbon };
  }, [tokens]);

  const totalPoolInvestment = useMemo(() => {
    return pools.reduce((acc: number, pool: any) => acc + (pool.totalInvestedAmount || 0), 0);
  }, [pools]);

  // Statistics data with pending states
  const allStats = useMemo(
    () => [
      {
        key: "totalAssets",
        title: "Total Assets",
        value: tokens?.length,
        icon: <Coin />,
        color: tokens?.length < 1 ? "text-nomyx-danger-light dark:text-nomyx-danger-dark" : "text-nomyx-text-light dark:text-nomyx-text-dark",
        show: true, // Always show
        loading: loading.tokens,
      },
      {
        key: "totalFunding",
        title: "Total Funding",
        value: currentValue ? currentValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0.00",
        icon: <DollarCircle className="text-nomyx-text-light dark:text-nomyx-text-dark" />,
        color: "text-nomyx-text-light dark:text-nomyx-text-dark",
        show: true, // Always show
        loading: loading.tokens,
      },
      {
        key: "totalPoolsFunded",
        title: "Total Pools Funded",
        value: pools?.length,
        icon: <NoteText />,
        color: pools?.length < 1 ? "text-nomyx-danger-light dark:text-nomyx-danger-dark" : "text-nomyx-text-light dark:text-nomyx-text-dark",
        show: pools?.length > 0,
        loading: loading.pools,
      },
      {
        key: "totalPoolAvailable",
        title: "Total Pool Available",
        value: currentValue ? currentValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0.00",
        icon: <DollarCircle className="text-nomyx-text-light dark:text-nomyx-text-dark" />,
        color: "text-nomyx-text-light dark:text-nomyx-text-dark",
        show: currentValue > 0,
        loading: loading.tokens,
      },
      {
        key: "totalPoolInvestment",
        title: "Total Pool Investment",
        value: totalPoolInvestment ? totalPoolInvestment.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0.00",
        icon: <DollarCircle className="text-nomyx-text-light dark:text-nomyx-text-dark" />,
        color: "text-nomyx-text-light dark:text-nomyx-text-dark",
        show: pools?.length > 0,
        loading: loading.pools,
      },
      {
        key: "interestGenerated",
        title: "Interest Generated",
        value: currentValue ? currentValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0.00",
        icon: <DollarCircle className="text-nomyx-text-light dark:text-nomyx-text-dark" />,
        color: "text-nomyx-text-light dark:text-nomyx-text-dark",
        show: currentValue > 0,
        loading: loading.tokens,
      },
      {
        key: "averageAPY",
        title: "Average APY %",
        value: tokens?.length,
        color: tokens?.length < 1 ? "text-nomyx-danger-light dark:text-nomyx-danger-dark" : "text-nomyx-text-light dark:text-nomyx-text-dark",
        show: tokens?.length > 0,
        loading: loading.tokens,
      },
    ],
    [tokens.length, currentValue, loading.tokens, pools.length, loading.pools, totalPoolInvestment]
  );

  // Split stats into chunks of 5 for display
  const statsChunks = useMemo(() => {
    const visibleStats = allStats.filter((stat) => stat.show);
    const chunks = [];
    for (let i = 0; i < visibleStats.length; i += 5) {
      chunks.push(visibleStats.slice(i, i + 5));
    }
    return chunks;
  }, [allStats]);

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
  }, [tokens.length, salesEvents?.length]);

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
        label: "Invoice Insights",
        children: <Bar data={prepareTokenChartData()} options={chartOptions} />,
        className: "chart",
      },
      {
        key: "3",
        label: "Pool Insights",
        children: <Bar data={prepareTokenChartData()} options={chartOptions} />,
        className: "chart",
      },
    ],
    [prepareTokenChartData, chartOptions]
  );

  const sidebarTabItems = useMemo(
    () => [
      {
        key: "1",
        label: "Deposits",
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
        label: "Sales",
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

  // Fetch functions with loading states
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
    } finally {
      setLoading((prev) => ({ ...prev, events: false }));
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
    } finally {
      setLoading((prev) => ({ ...prev, retiredTokens: false }));
    }
  }, [user]);

  const fetchPools = useCallback(async () => {
    if (!user?.walletAddress) {
      console.error("User wallet address is missing.");
      return;
    }
    try {
      const fetchedPools = await TradeFinanceService.getUserTradePools(user.walletAddress);
      setPools(fetchedPools);
    } catch (error) {
      console.error("Error fetching pools:", error);
    } finally {
      setLoading((prev) => ({ ...prev, pools: false }));
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
    } finally {
      setLoading((prev) => ({ ...prev, tokens: false }));
    }
  }, [user]);

  // Initial data fetch on component mount
  useEffect(() => {
    if (status === "authenticated" && user?.walletAddress) {
      fetchEvents();
      fetchRetiredTokens();
      fetchTokens();
      fetchPools();
    }
  }, [status, user, fetchEvents, fetchRetiredTokens, fetchTokens, fetchPools]);

  return (
    <>
      <Head>
        <title>Dashboard - Customer Portal</title>
      </Head>
      <div className="dashboard grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-3">
          {/* Statistics section */}
          <div className="flex flex-col gap-3 pb-3">
            {statsChunks.map((chunk, chunkIndex) => (
              <div key={`chunk-${chunkIndex}`} className={`flex flex-wrap mx-[-0.5rem] ${chunk.length > 5 ? "justify-center" : ""}`}>
                {chunk.map((stat, index) => (
                  <div
                    key={`${chunkIndex}-${index}`}
                    className={`px-2 ${
                      chunk.length === 1
                        ? "w-full"
                        : chunk.length === 2
                          ? "w-1/2"
                          : chunk.length === 3
                            ? "w-1/3"
                            : chunk.length === 4
                              ? "w-1/4"
                              : chunk.length === 5
                                ? "w-1/5"
                                : "min-w-[200px] max-w-[300px] flex-1"
                    }`}
                  >
                    <Card className="w-full text-center bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark border-nomyx-gray4-light dark:border-nomyx-gray4-dark">
                      {stat.loading ? (
                        <Skeleton active paragraph={{ rows: 1 }} />
                      ) : (
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
                      )}
                    </Card>
                  </div>
                ))}
              </div>
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
