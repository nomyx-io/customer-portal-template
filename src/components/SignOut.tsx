import React, { useState } from "react";

import { Button } from "antd";
import { Eye, EyeSlash } from "iconsax-react"; // Import from iconsax-react
import { signOut } from "next-auth/react";

import ParseService from "@/services/ParseService";

export function SignOut(props: React.ComponentPropsWithRef<typeof Button> & { walletAddress?: string }) {
  const { walletAddress, ...buttonProps } = props;
  const [showFullAddress, setShowFullAddress] = useState(false);

  const toggleAddressVisibility = () => {
    setShowFullAddress(!showFullAddress);
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-2)}`; // More truncated
  };

  return (
    <div className="flex items-center">
      {walletAddress && (
        <div className="flex items-center text-nomyx-text-light dark:text-nomyx-text-dark mr-4">
          <span className={`mr-2 ${showFullAddress ? "" : "truncate max-w-[150px]"}`}>
            {showFullAddress ? walletAddress : truncateAddress(walletAddress!)}
          </span>
          {/* Eye icon to toggle address visibility */}
          {showFullAddress ? (
            <EyeSlash onClick={toggleAddressVisibility} className="cursor-pointer" size="20" />
          ) : (
            <Eye onClick={toggleAddressVisibility} className="cursor-pointer" size="20" />
          )}
        </div>
      )}
      <Button
        className="mr-2 text-nomyx-text-light dark:text-nomyx-text-dark hover:!bg-transparent"
        {...buttonProps}
        onClick={() => {
          signOut();
          ParseService.logout();
        }}
      >
        Sign Out
      </Button>
    </div>
  );
}
