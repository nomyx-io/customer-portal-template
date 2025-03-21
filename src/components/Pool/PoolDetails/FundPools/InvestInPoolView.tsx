import React, { useState, useEffect } from "react";

import { Button, Card, Modal, Tabs, Table } from "antd";
import { ArrowLeft } from "iconsax-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";

import HistoryListPage from "@/components/Pool/PoolDetails/History/HistoryListPage";
import StockListPage from "@/components/Pool/PoolDetails/Stocks/StockListPage";
import projectBackground from "@/images/projects_background.png";
import { TradeFinancePool } from "@/types/poolData";

interface InvestInPoolViewProps {
  id: string;
  onBack: () => void;
}

const InvestInPoolView: React.FC<InvestInPoolViewProps> = ({ id, onBack }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("1");
  const [pool, setPool] = useState<TradeFinancePool | null>(null);

  //   useEffect(() => {
  //     // Fetch pool details based on id (Assume getPoolDetails is a function fetching the pool data)
  //     const fetchPoolDetails = async () => {
  //       try {
  //         const response = await fetch(`/api/pool/${id}`);
  //         const data = await response.json();
  //         setPool(data);
  //       } catch (error) {
  //         console.error("Error fetching pool data:", error);
  //       }
  //     };

  //     if (id) {
  //       fetchPoolDetails();
  //     }
  //   }, [id]);

  useEffect(() => {
    // Mock data for pool details
    const mockPoolData: TradeFinancePool = {
      objectId: "1",
      title: "Sample Pool",
      description: "This is a sample description for the pool.",
      startDate: "",
      maturityDate: "",
      investedAmount: 0,
      allocatedVABB: 0,
      vabiEarned: 0,
      totalVabiYield: 0,
      yieldPercentage: "",
    };

    // Simulate API call delay
    const fetchPoolDetails = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulated delay
        setPool(mockPoolData);
      } catch (error) {
        console.error("Error fetching pool data:", error);
      }
    };

    if (id) {
      fetchPoolDetails();
    }
  }, [id]);

  return (
    <div className="project-details">
      {/* Project Header Section */}
      <div
        className="project-header relative p-6 rounded-lg"
        style={{
          backgroundImage: `url(${projectBackground.src})`,
          backgroundSize: "cover",
          backgroundPosition: "top center",
          height: "400px",
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 sm:left-auto sm:right-4 lg:left-4 bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark rounded-md flex items-center px-4 py-2 shadow-md w-[100px]"
        >
          <ArrowLeft size="24" className="mr-2" />
          Back
        </button>

        {/* Project Details */}
        {pool && (
          <div className="absolute sm:-bottom-2 bottom-4 left-0 md:flex md:flex-row flex-col items-start md:items-center p-4 rounded-lg w-full">
            {/* Project Image */}
            <div className="project-logo rounded-lg overflow-hidden flex-shrink-0" style={{ width: "100px", height: "100px" }}>
              <Image
                src={pool.logo?._url || "/default-project-image.png"} // Ensure a valid image path
                width={100}
                height={100}
                alt="Project Logo"
                className="object-cover w-full h-full"
              />
            </div>

            {/* Project Title and Description */}
            <div className="text-white flex-1 mx-4 mt-4 md:mt-0">
              <h1 className="text-3xl font-bold">{pool.title}</h1>
              <p className="text-sm mt-2 max-w-md break-words">{pool.description}</p>
            </div>

            {/* Project Stats */}
            <div className="mt-6 md:mt-0 bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark p-4 rounded-lg shadow-md transition-opacity duration-500 opacity-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Development method", value: "52.53%" },
                  { label: "Newera Score", value: "4/5" },
                  { label: "Fund Size", value: "200 M" },
                  { label: "Generation", value: "03" },
                  { label: "Economics", value: "2% - 20%" },
                  { label: "Target Return", value: "3-4x Gross" },
                  { label: "Category", value: "Venture" },
                  { label: "Stage", value: "Early/Venture" },
                  //   { label: "Phase", value: "Closing Soon" },
                ].map((stat, index) => (
                  <div key={index} className="stat-item bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark p-3 rounded-lg text-center">
                    <span className="text-xs md:text-sm text-gray-700">{stat.label}</span>
                    <h2 className="text-base font-bold text-black dark:text-white">{stat.value}</h2>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Section */}
      <Card className="no-padding bg-transparent border-none mt-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="nftTabs"
          items={[
            {
              key: "1",
              label: "Stocks",
              children: <StockListPage type="invest" />,
            },
            {
              key: "2",
              label: "History",
              children: <HistoryListPage />,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default InvestInPoolView;
