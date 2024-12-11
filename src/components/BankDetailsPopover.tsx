import React, { useState } from "react";

import { Popover } from "antd";
import Parse from "parse";
import { toast } from "react-toastify";

interface BankDetailsPopoverProps {
  externalAccountId: string;
  customerId: string;
}

const BankDetailsPopover: React.FC<BankDetailsPopoverProps> = ({ externalAccountId, customerId }) => {
  const [bankDetails, setBankDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBankDetails = async () => {
    if (bankDetails) return;
    setLoading(true);
    try {
      const response = await Parse.Cloud.run("getExternalAccount", {
        externalAccountId,
        customerId,
      });

      console.log("Bank details:", response);

      setBankDetails(response);
    } catch (error) {
      console.error("Failed to fetch bank details:", error);
      toast.error("Failed to fetch bank details.");
    } finally {
      setLoading(false);
    }
  };

  const content = bankDetails ? (
    <div className="flex flex-col text-black">
      <h2 className="text-lg font-semibold">Bank Details</h2>

      <div className="flex items-center">
        <span className="min-w-[150px]">
          <strong>Bank Name:</strong>
        </span>
        <span>{bankDetails.bank_name}</span>
      </div>

      <div className="flex items-center">
        <span className="min-w-[150px]">
          <strong>Account Holder:</strong>
        </span>
        <span>{bankDetails.account_owner_name}</span>
      </div>

      <div className="flex items-center">
        <span className="min-w-[150px]">
          <strong>Last 4:</strong>
        </span>
        <span>{bankDetails.last_4}</span>
      </div>

      <div className="flex items-center">
        <span className="min-w-[150px]">
          <strong>Currency:</strong>
        </span>
        <span>{bankDetails.currency}</span>
      </div>
    </div>
  ) : (
    <div>{loading ? "Loading..." : "No bank details available."}</div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottom"
      onOpenChange={(visible) => visible && fetchBankDetails()}
      overlayInnerStyle={{
        backgroundColor: "#ffffff",
        color: "#000000",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <span className="text-blue-500 cursor-pointer">Bank</span>
    </Popover>
  );
};

export default BankDetailsPopover;
