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
    } catch (error: any) {
      console.error("Failed to fetch bank details:", error);
      toast.error("Failed to fetch bank details: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadingContent = <div className="text-nomyx-gray1-light dark:text-nomyx-gray1-dark">Loading...</div>;

  const getContent = () => {
    if (loading) {
      return loadingContent;
    }

    if (!bankDetails) {
      // If still no bank details and not loading, show loading indicator
      return loadingContent;
    }

    const sharedFields = (
      <>
        <h2 className="text-lg font-semibold">Bank Details</h2>
        <div className="flex items-center">
          <span className="min-w-[150px]">
            <strong>Bank Name:</strong>
          </span>
          <span>{bankDetails.bank_name}</span>
        </div>
      </>
    );

    if (bankDetails.account_type === "us") {
      return (
        <div className="flex flex-col text-nomyx-gray1-light dark:text-nomyx-gray1-dark">
          {sharedFields}
          <div className="flex items-center">
            <span className="min-w-[150px]">
              <strong>Account Holder:</strong>
            </span>
            <span>{bankDetails.account_owner_name}</span>
          </div>
          <div className="flex items-center">
            <span className="min-w-[150px]">
              <strong>Account #:</strong>
            </span>
            <span>{`****${bankDetails.account.last_4}`}</span>
          </div>
          <div className="flex items-center">
            <span className="min-w-[150px]">
              <strong>Routing #:</strong>
            </span>
            <span>{bankDetails.account.routing_number}</span>
          </div>
          <div className="flex items-center">
            <span className="min-w-[150px]">
              <strong>Currency:</strong>
            </span>
            <span>{bankDetails.currency.toUpperCase()}</span>
          </div>
        </div>
      );
    } else if (bankDetails.account_type === "iban") {
      return (
        <div className="flex flex-col text-nomyx-gray1-light dark:text-nomyx-gray1-dark">
          {sharedFields}
          <div className="flex items-center">
            <span className="min-w-[150px]">
              <strong>Bank Country:</strong>
            </span>
            <span>{bankDetails.iban.country}</span>
          </div>
          <div className="flex items-center">
            <span className="min-w-[150px]">
              <strong>Account Holder:</strong>
            </span>
            <span>{bankDetails.account_owner_name}</span>
          </div>
          <div className="flex items-center">
            <span className="min-w-[150px]">
              <strong>IBAN #:</strong>
            </span>
            <span>{`****${bankDetails.iban.last_4}`}</span>
          </div>
          <div className="flex items-center">
            <span className="min-w-[150px]">
              <strong>BIC #:</strong>
            </span>
            <span>{bankDetails.iban.bic}</span>
          </div>
          <div className="flex items-center">
            <span className="min-w-[150px]">
              <strong>Currency:</strong>
            </span>
            <span>{bankDetails.currency.toUpperCase()}</span>
          </div>
        </div>
      );
    } else {
      // If account_type is unknown or not "us"/"non_us"
      return <div className="text-nomyx-gray1-light dark:text-nomyx-gray1-dark">No details available for this account type.</div>;
    }
  };

  return (
    <Popover
      content={getContent()}
      trigger="click"
      placement="bottom"
      onOpenChange={(visible) => visible && fetchBankDetails()}
      overlayClassName="custom-popover"
    >
      <span className="text-blue-500 cursor-pointer">Bank</span>
    </Popover>
  );
};

export default BankDetailsPopover;
