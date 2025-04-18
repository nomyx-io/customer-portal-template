import React, { useEffect, useState } from "react";

import { Layout, Button } from "antd/es";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { SignOut } from "@/components/SignOut";
import ThemeToggle from "@/components/ThemeToggle";
import TransferModal from "@/components/TransferModal";
import KronosCustomerService from "@/services/KronosCustomerService";
import { WalletPreference } from "@/utils/Constants";
import { formatPrice } from "@/utils/currencyFormater";

const AntdHeader = Layout.Header;

export const Header = () => {
  const session: any = useSession();
  const user: any = session?.data?.user;

  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const walletPreference = user?.walletPreference;

  useEffect(() => {
    async function getUSDCBalance(walletId: string, dfnsToken: string) {
      const { balance, error } = await KronosCustomerService.getUsdcBalance(walletId, dfnsToken);
      if (error) {
        console.error("Failed to get USDC balance:", error);
        return;
      }
      const usdcBalance = balance?.balance && balance?.decimals ? parseFloat(balance.balance) / 10 ** parseFloat(balance.decimals) : 0;
      setUsdcBalance(usdcBalance.toFixed(2));
    }
    if (user && user.dfns_token && walletPreference === WalletPreference.MANAGED) {
      getUSDCBalance(user.walletId, user.dfns_token);
    }
  }, [user, walletPreference]);

  const handleModalOpen = () => {
    setIsModalVisible(true); // Open modal
  };

  const handleModalClose = () => {
    setIsModalVisible(false); // Close modal
  };

  return (
    <AntdHeader className="flex items-center justify-between p-5 pl-[20px] !bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark">
      <Link href={"/dashboard"} className="w-[140px] h-[40px]">
        <Image src="/images/nomyx_logo_black.svg" alt="Logo" width={150} height={40} priority className="block dark:hidden" />
        <Image src="/images/nomyx_logo_white.svg" alt="Logo" width={150} height={40} priority className="hidden dark:block" />
      </Link>
      <div className="hidden sm:flex items-center justify-end gap-5">
        {walletPreference !== WalletPreference.MANAGED && <w3m-button />}
        {walletPreference === WalletPreference.MANAGED && (
          <>
            <div>
              <span className="border border-nomyx-main1-light dark:border-nomyx-main1-dark text-nomyx-text-light dark:text-nomyx-text-dark p-2 rounded-md mr-3">
                Total Value: {formatPrice(parseFloat(usdcBalance), "USD")}
                {/* USDC Value + current value of user's share in pool */}
              </span>
              <span className="border border-nomyx-main1-light dark:border-nomyx-main1-dark text-nomyx-text-light dark:text-nomyx-text-dark p-2 rounded-md">
                Buying Power: {formatPrice(parseFloat(usdcBalance), "USD")}
              </span>
            </div>
            {/* Transfer Button */}
            <Button type="primary" onClick={handleModalOpen}>
              Withdraw
            </Button>
            <SignOut walletAddress={user.walletAddress} />
          </>
        )}
        <ThemeToggle />
      </div>

      {/* Transfer Modal */}
      {walletPreference === WalletPreference.MANAGED && (
        <TransferModal visible={isModalVisible} onClose={handleModalClose} usdcBalance={usdcBalance} walletId={user?.walletId} />
      )}
    </AntdHeader>
  );
};

export default Header;
