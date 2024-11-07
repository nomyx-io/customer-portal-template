import React, { useState } from "react";
import { Card, Button, Checkbox } from "antd";
import { hashToColor } from "@/utils/colorUtils";
import { formatPrice } from "@/utils/currencyFormater";

interface TokenCardViewProps {
  projects: any[];
  onProjectClick: (project: any) => void;
  onSelectionChange?: (selectedProjects: any[]) => void; // Prop for selection change callback
  onPurchaseToken?: (token: any) => void; // Prop for handling purchase of a single token
  isSalesHistory: boolean; // New prop to determine if this is a sales history view
}

const TokenCardView: React.FC<TokenCardViewProps> = ({
  projects,
  onProjectClick,
  onSelectionChange,
  onPurchaseToken,
  isSalesHistory,
}) => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Handle individual card selection change
  const handleCardSelectChange = (tokenId: string, checked: boolean) => {
    let updatedSelectedProjects: string[]; // Explicitly typing as string array

    if (checked) {
      updatedSelectedProjects = [...selectedProjects, tokenId];
    } else {
      updatedSelectedProjects = selectedProjects.filter((id) => id !== tokenId);
    }

    setSelectedProjects(updatedSelectedProjects);

    // Update the parent with the newly selected projects
    const selectedTokens = projects.filter((project) =>
      updatedSelectedProjects.includes(project.tokenId)
    );
    if (onSelectionChange) {
      onSelectionChange(selectedTokens);
    }
  };

  const generateSvgIcon = (color: string) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient
            id={`gradient-${color}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor="#003366" stopOpacity="1" />
          </linearGradient>
        </defs>
        <rect
          width="100"
          height="100"
          rx="15"
          fill={`url(#gradient-${color})`}
        />
        <text
          x="50%"
          y="50%"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize="50"
          fill="white"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          KC
        </text>
      </svg>
    );
  };

  return (
    <div className="grid gap-5 grid-cols-2 xl:grid-cols-3 mt-5 p-5">
      {projects.map((project) => {
        const tokenId = project.tokenId ?? "default";
        const color = hashToColor(tokenId);
        const isSelected = selectedProjects.includes(tokenId);

        return (
          <Card
            key={tokenId}
            className={`rounded-lg shadow-md transition-shadow duration-200 ease-in-out bg-white dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark relative ${
              !isSalesHistory ? "hover:shadow-2xl hover:scale-105" : ""
            }`}
            style={{
              cursor: !isSalesHistory ? "pointer" : "default",
              padding: "0",
              overflow: "hidden",
              boxSizing: "border-box",
              transform: !isSalesHistory
                ? "translateY(0)"
                : "translateY(-10px)",
              transition: "transform 0.3s ease-in-out",
            }}
            onClick={
              !isSalesHistory ? () => onProjectClick(project) : undefined
            }
          >
            {/* Logo Section */}
            <div
              className="logo-container"
              style={{
                width: "100%",
                height: "40%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                boxSizing: "border-box",
              }}
              onClick={
                !isSalesHistory ? () => onProjectClick(project) : undefined
              }
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >
                {generateSvgIcon(color)}
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
              {/* Title and Description */}
              <h2 className="text-lg font-bold">
                {project.token?.nftTitle || "Token Title"}
              </h2>
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                {project.token?.description ||
                  "This is a placeholder description for the token. Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
              </p>

              {/* Project Details Section */}
              <div className="mt-4 grid gap-2">
                {[
                  {
                    label: "Total Price",
                    value: `${formatPrice(
                      Number(project.token.price) *
                        Number(project.token?.existingCredits),
                      "USD"
                    )}`,
                  },
                  {
                    label: "Registry ID",
                    value: project.token?.registerId || "-",
                  },
                  {
                    label: "Tranche Cutoff",
                    value: project.token?.trancheCutoff || "-",
                  },
                  {
                    label: "Carbon Offset (Tons)",
                    value:
                      Intl.NumberFormat("en-US").format(
                        project.token?.existingCredits
                      ) || "-",
                  },
                  { label: "Auditor", value: project.token?.auditor || "-" },
                  {
                    label: "Issuance Date",
                    value: project.token?.issuanceDate || "-",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    {/* Label on the left */}
                    <span className="font-semibold flex-1">{item.label}</span>

                    {/* Value on the right with consistent width */}
                    <span className="bg-gray-100 dark:bg-nomyx-dark1-dark p-2 rounded text-right w-2/3">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Purchase Button and Checkbox (Only shown if not sales history) */}
              {!isSalesHistory && (
                <div className="mt-4 flex justify-end items-center">
                  {/* Checkbox for Selecting the Card */}
                  {/* <Checkbox
                    checked={isSelected}
                    onChange={(e) => handleCardSelectChange(tokenId, e.target.checked)}
                    style={{ zIndex: 1 }}
                  >
                    Select
                  </Checkbox> */}

                  <Button
                    type="primary"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering card click event
                      if (onPurchaseToken) {
                        onPurchaseToken(project);
                      }
                    }}
                  >
                    Purchase
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default TokenCardView;
