import React, { useState, useEffect, useCallback } from "react";

import { Table, Popover, Tooltip } from "antd";
import { ArrowRight, Copy, InfoCircle, Warning2 } from "iconsax-react";
import { useSession } from "next-auth/react";
import Parse from "parse";
import { toast } from "react-toastify";

import BankDetailsPopover from "@/components/bridge/BankDetailsPopover";
import CreateCustomerModal from "@/components/bridge/CreateCustomerModal";
import InstructionRow from "@/components/bridge/InstructionRow";
import NoHistoryView from "@/components/bridge/NoHistoryView";
import PersonaVerificationModal from "@/components/bridge/PersonaVerificationModal";
import SearchAndFilterSection from "@/components/bridge/SearchAndFilterSection";
import TosModal from "@/components/bridge/TosModal";
import TransferInModal from "@/components/bridge/TransferInModal";
import TransferOutModal from "@/components/bridge/TransferOutModal";
import WelcomeScreen from "@/components/bridge/WelcomeScreen";
import KronosSpin from "@/components/KronosSpin";
import ParseService from "@/services/ParseService";
import { formatPrice } from "@/utils/currencyFormater";
import { truncateAddress, copyToClipboard } from "@/utils/helpers";

function getEtherscanUrl(address: string): string {
  return `https://etherscan.io/address/${address}`;
}

function isTransferInPaymentRail(paymentRail: string): boolean {
  const rail = paymentRail.toLowerCase();
  return ["ach_push", "sepa", "wire"].includes(rail);
}

function renderTransactionInstructions(record: any) {
  const paymentRail = record.source.payment_rail.toLowerCase();

  const commonCopyButton = (copyText: string, successMessage: string) => (
    <span onClick={() => copyToClipboard(copyText, successMessage)} className="ml-2 text-blue-500 cursor-pointer">
      <Copy size="16" />
    </span>
  );

  if (["ach_push", "wire"].includes(paymentRail)) {
    const isAch = paymentRail === "ach_push";
    const { bank_beneficiary_name, bank_routing_number, bank_account_number, bank_beneficiary_address, deposit_message } =
      record.source_deposit_instructions || {};

    return (
      <div className="flex flex-col text-nomyx-gray1-light dark:text-nomyx-gray1-dark">
        <h2 className="text-lg font-semibold">Transfer Instructions</h2>
        <InstructionRow
          label="Beneficiary Name"
          value={bank_beneficiary_name}
          copyId={bank_beneficiary_name}
          copyMessage="Beneficiary name copied."
          copyFn={commonCopyButton}
        />
        <InstructionRow
          label="Routing #"
          value={bank_routing_number}
          copyId={bank_routing_number}
          copyMessage="Routing number copied."
          copyFn={commonCopyButton}
        />
        <InstructionRow
          label="Account #"
          value={bank_account_number}
          copyId={bank_account_number}
          copyMessage="Account number copied."
          copyFn={commonCopyButton}
        />
        <InstructionRow
          label="Beneficiary Address"
          value={bank_beneficiary_address}
          copyId={bank_beneficiary_address}
          copyMessage="Beneficiary address copied."
          copyFn={commonCopyButton}
        />
        <InstructionRow
          label={isAch ? "ACH Message" : "Wire Message"}
          value={deposit_message}
          copyId={deposit_message}
          copyMessage={isAch ? "ACH message copied." : "Wire message copied."}
          copyFn={commonCopyButton}
          tooltipTitle={
            isAch
              ? "Warning: ACH sent without this message may be delayed or returned."
              : "Warning: Wire sent without this message may be delayed or returned."
          }
        />
      </div>
    );
  } else if (paymentRail === "sepa") {
    // SEPA instructions
    const { account_holder_name, bic, iban, deposit_message } = record.source_deposit_instructions || {};
    return (
      <div className="flex flex-col text-nomyx-gray1-light dark:text-nomyx-gray1-dark">
        <h2 className="text-lg font-semibold">Transfer Instructions</h2>
        <InstructionRow
          label="Account Holder Name"
          value={account_holder_name}
          copyId={account_holder_name}
          copyMessage="Account holder name copied!"
          copyFn={commonCopyButton}
        />
        <InstructionRow label="BIC" value={bic} copyId={bic} copyMessage="BIC copied." copyFn={commonCopyButton} />
        <InstructionRow label="IBAN" value={iban} copyId={iban} copyMessage="IBAN copied." copyFn={commonCopyButton} />
        <InstructionRow
          label="Deposit Message"
          value={deposit_message}
          copyId={deposit_message}
          copyMessage="Deposit message copied."
          copyFn={commonCopyButton}
          tooltipTitle="Warning: Transfer sent without the following message may be delayed or returned."
        />
      </div>
    );
  }

  // Crypto instructions
  const { to_address } = record.source_deposit_instructions || {};
  return (
    <div className="flex flex-col text-nomyx-gray1-light dark:text-nomyx-gray1-dark">
      <h2 className="text-lg font-semibold">Transfer Instructions</h2>
      <InstructionRow
        label="Deposit Address"
        value={to_address}
        copyId={to_address}
        copyMessage="Deposit address copied."
        copyFn={commonCopyButton}
      />
    </div>
  );
}

function renderDetailsContent(record: any) {
  return renderTransactionInstructions(record);
}

const TransferInOut: React.FC = () => {
  const { data: session } = useSession();
  const user = session?.user;

  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPersonaModalVisible, setIsPersonaModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");

  const [tosLink, setTosLink] = useState<string | null>(null);
  const [personaLink, setPersonaLink] = useState<string | null>(null);
  const [iframeStep, setIframeStep] = useState<"tos" | "persona" | null>(null);

  const [bridgeCustomerId, setBridgeCustomerId] = useState<string>("");
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<any[]>([]);
  const [tosStatus, setTosStatus] = useState<string | null>(null);

  // Start with transfers = null to indicate never fetched
  const [transfers, setTransfers] = useState<any[] | null>(null);
  const [filteredTransfers, setFilteredTransfers] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [isTransferInVisible, setIsTransferInVisible] = useState(false);
  const [isTransferOutVisible, setIsTransferOutVisible] = useState(false);

  const limit = 10;

  const fetchTransferData = useCallback(
    async (isRefresh = false) => {
      if (!bridgeCustomerId || tosStatus !== "approved" || kycStatus !== "approved") return;

      setLoading(true);
      try {
        const params: Record<string, any> = { customer_id: bridgeCustomerId, limit };
        if (!isRefresh && transfers && transfers.length > 0) {
          params.starting_after = transfers[transfers.length - 1].id;
        }

        const response = await Parse.Cloud.run("getCustomerTransfers", params);
        const newTransfers = response.data || [];

        setTransfers(isRefresh ? newTransfers : transfers ? [...transfers, ...newTransfers] : newTransfers);
        setHasMore(newTransfers.length >= limit);
      } catch (error: any) {
        toast.error("Failed to fetch transfer data.");
      } finally {
        setLoading(false);
      }
    },
    [bridgeCustomerId, tosStatus, kycStatus, transfers, limit]
  );

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore && !loading) {
        void fetchTransferData();
      }
    },
    [fetchTransferData, hasMore, loading]
  );

  const checkKycStatus = useCallback(async () => {
    // If stable (both approved and transfers is not null), skip re-checking:
    if (kycStatus === "approved" && tosStatus === "approved" && transfers !== null) {
      return;
    }

    setLoading(true);
    const currentUser = Parse.User.current();
    if (!currentUser) {
      toast.error("User not logged in.");
      setLoading(false);
      return;
    }

    const kycLinkId = currentUser.get("kycId");
    if (!kycLinkId) {
      setLoading(false);
      return;
    }

    try {
      const response = await Parse.Cloud.run("getKycLinkStatus", { kyc_link_id: kycLinkId });
      const { kyc_status, tos_status, kyc_link, tos_link, customer_id, rejection_reasons } = response;

      if (rejection_reasons) setRejectionReasons(rejection_reasons);
      if (customer_id) setBridgeCustomerId(customer_id);

      setPersonaLink(kyc_link);
      setTosLink(tos_link);
      setTosStatus(tos_status);
      setKycStatus(kyc_status);

      if (tos_status !== "approved") {
        setIframeStep("tos");
      } else if (kyc_status !== "approved") {
        setIframeStep("persona");
      }

      setLoading(false);
    } catch (error: any) {
      toast.error(`Error checking KYC status: ${error.message}`);
      setLoading(false);
    }
  }, [kycStatus, tosStatus, transfers]);

  useEffect(() => {
    void checkKycStatus();
  }, [checkKycStatus]);

  useEffect(() => {
    if (!loading) {
      // User is first-time
      if (!kycStatus && !tosStatus && !bridgeCustomerId) {
        setInitialized(true);
      } else if (
        // Conditions known:
        kycStatus !== null &&
        tosStatus !== null &&
        bridgeCustomerId
      ) {
        // If both approved and no fetch done yet (transfers === null), attempt a fetch:
        if (kycStatus === "approved" && tosStatus === "approved" && transfers === null) {
          (async () => {
            setLoading(true);
            await fetchTransferData(true);
            // Now transfers is either [] or has data
            setLoading(false);
            setInitialized(true);
          })();
        } else {
          // If transfers is not null, even if empty, we have a stable state
          // If not both approved, it's also stable since we know conditions
          if (transfers !== null) {
            // stable state (either no transfers [] or some transfers)
            setInitialized(true);
          } else {
            // If not approved states or no conditions to fetch, also stable
            setInitialized(true);
          }
        }
      }
    }
  }, [loading, kycStatus, tosStatus, bridgeCustomerId, transfers, fetchTransferData]);

  useEffect(() => {
    const filtered = (transfers || []).filter((transfer) => {
      const type = isTransferInPaymentRail(transfer.source.payment_rail) ? "Transfer In" : "Transfer Out";
      const lowerSearch = searchTerm.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        new Date(transfer.updated_at).toLocaleDateString().toLowerCase().includes(lowerSearch) ||
        user?.firstName?.toLowerCase().includes(lowerSearch) ||
        user?.lastName?.toLowerCase().includes(lowerSearch) ||
        user?.email?.toLowerCase().includes(lowerSearch) ||
        user?.walletAddress?.toLowerCase().includes(lowerSearch) ||
        formatPrice(transfer.amount, transfer.currency).toLowerCase().includes(lowerSearch) ||
        type.toLowerCase().includes(lowerSearch) ||
        Object.values(transfer).some((value) => String(value).toLowerCase().includes(lowerSearch));

      const matchesStatus = filterStatus === "all" || transfer.state.toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });

    setFilteredTransfers(filtered);
  }, [transfers, searchTerm, filterStatus, user]);

  const handleUpdateTransfers = useCallback(async () => {
    await fetchTransferData(true);
    await checkKycStatus();
    setIframeStep(null);
  }, [fetchTransferData, checkKycStatus]);

  const handleTransferInOpen = () => setIsTransferInVisible(true);
  const handleTransferOutOpen = () => setIsTransferOutVisible(true);

  const handlePersonaModalOpen = () => setIsPersonaModalVisible(true);

  const handleTosComplete = useCallback(
    async (data: any) => {
      try {
        setLoading(true);
        const currentUser = Parse.User.current();
        if (currentUser) {
          await ParseService.updateRecord("User", currentUser.id, {
            signedAgreementId: data.signedAgreementId,
          });
        }
        toast.success("TOS step completed.");
        await checkKycStatus();
        setIframeStep("persona");
      } catch (error) {
        console.error("Failed to save signed agreement ID:", error);
      } finally {
        setLoading(false);
      }
    },
    [checkKycStatus]
  );

  const handleOpenModal = () => {
    setCustomerName(`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim());
    setEmailAddress(user?.email ?? "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCustomerName("");
    setEmailAddress("");
  };

  const handleAddCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const response = await Parse.Cloud.run("generateKycLink", {
        full_name: customerName.trim(),
        email: emailAddress.trim(),
        type: "individual",
      });
      toast.success("KYC link generated successfully!");

      const { id: kycId, customer_id: fetchedBridgeCustomerId } = response;
      const currentUser = Parse.User.current();

      if (currentUser) {
        await ParseService.updateRecord("User", currentUser.id, { kycId, bridgeCustomerId: fetchedBridgeCustomerId });
      }

      setBridgeCustomerId(fetchedBridgeCustomerId);
      setPersonaLink(response.kyc_link);
      setTosLink(response.tos_link);
      setIframeStep("tos");
    } catch (error: any) {
      toast.error(`Failed to generate KYC link: ${error.message}`);
      console.error("Error generating KYC link:", error);
    } finally {
      setLoading(false);
      handleCloseModal();
    }
  }, [customerName, emailAddress]);

  const isAddCustomerDisabled = !customerName.trim() || !emailAddress.trim();

  const columns = [
    {
      title: "Date",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_: any, record: any) => (
        <div className="leading-tight">
          <p>
            {user?.firstName} {user?.lastName}
          </p>
          <p>{user?.email}</p>
          <div className="flex items-center">
            <span>{truncateAddress(user?.walletAddress || "")}</span>
            <span onClick={() => copyToClipboard(user!.walletAddress, "Wallet address copied.")} className="ml-2 text-blue-500 cursor-pointer">
              <Copy size="16" />
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "state",
      key: "state",
      render: (status: string) => {
        const borderColor = status === "payment_processed" ? "border-green-700 text-green-700" : "border-blue-500 text-blue-700";
        return <span className={`px-2 py-1 rounded border ${borderColor}`}>{status}</span>;
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (_: any, record: any) => formatPrice(record.amount, record.currency),
    },
    {
      title: "Type",
      key: "type",
      render: (_: any, record: any) => {
        const isTransferIn = isTransferInPaymentRail(record.source.payment_rail);
        return <span>{isTransferIn ? "Transfer In" : "Transfer Out"}</span>;
      },
    },
    {
      title: "Conversion",
      key: "conversion",
      render: (_: any, record: any) => {
        const isTransferIn = isTransferInPaymentRail(record.source.payment_rail);
        const destination = isTransferIn ? truncateAddress(record.destination.to_address) : "Bank";

        return (
          <div className="flex flex-col leading-tight">
            <div className="flex items-center">
              <span className="min-w-[150px]">Transaction ID:</span>
              <span>{truncateAddress(record.id)}</span>
              <span onClick={() => copyToClipboard(record.id, "Transaction ID copied.")} className="ml-2 text-blue-500 cursor-pointer">
                <Copy size="16" />
              </span>
            </div>
            <div className="flex items-center">
              <span className="min-w-[150px]">Currency:</span>
              <span className="flex items-center gap-2">
                {record.source.currency} ({record.source.payment_rail})
                <ArrowRight size="16" />
                {record.destination.currency} ({record.destination.payment_rail})
              </span>
            </div>
            <div className="flex items-center">
              <span className="min-w-[150px]">Destination:</span>
              {isTransferIn ? (
                <a
                  href={getEtherscanUrl(record.destination.to_address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {destination}
                </a>
              ) : (
                <BankDetailsPopover externalAccountId={record.destination.external_account_id} customerId={bridgeCustomerId} />
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Details",
      key: "details",
      render: (_: any, record: any) => (
        <Popover content={renderDetailsContent(record)} trigger="click" placement="bottom" overlayClassName="custom-popover">
          <span className="text-blue-500 cursor-pointer">View Details</span>
        </Popover>
      ),
    },
  ];

  const renderKycIncomplete = () => (
    <div className="flex flex-col items-center justify-center">
      <InfoCircle variant="Outline" className="w-60 h-60 text-nomyx-gray3-light dark:text-nomyx-gray3-dark" />
      <h2 className="text-[32px]/[48px] font-semibold mb-4 text-gray-800 dark:text-gray-200">KYC Incomplete</h2>
      <p className="text-nomyx-gray1-light dark:text-nomyx-gray1-dark mb-6">Please complete KYC verification to proceed.</p>
      {rejectionReasons.map((reason, index) => (
        <div key={index} className="text-red-600">
          <p>
            <strong>Reason:</strong> {reason.reason || "No specific reason provided"}
          </p>
          {reason.developer_reason && (
            <p>
              <strong>Developer Details:</strong> {reason.developer_reason}
            </p>
          )}
          {reason.created_at && (
            <p>
              <strong>Created At:</strong> {new Date(reason.created_at).toLocaleString()}
            </p>
          )}
        </div>
      ))}
      <button
        onClick={() => {
          handlePersonaModalOpen();
          setIsPersonaModalVisible(true);
        }}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Complete KYC
      </button>
    </div>
  );

  const renderKycProcessing = () => (
    <div className="flex flex-col items-center justify-center">
      <InfoCircle variant="Outline" className="w-60 h-60 text-nomyx-gray3-light dark:text-nomyx-gray3-dark" />
      <h2 className="text-[32px]/[48px] font-semibold mb-4 text-gray-800 dark:text-gray-200">KYC Processing</h2>
      <p className="text-nomyx-gray1-light dark:text-nomyx-gray1-dark mb-6">Please check KYC status here after a few minutes.</p>
      <button onClick={checkKycStatus} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Check KYC Status
      </button>
    </div>
  );

  const renderKycUnderReview = () => (
    <div className="flex flex-col items-center justify-center">
      <InfoCircle variant="Outline" className="w-60 h-60 text-nomyx-gray3-light dark:text-nomyx-gray3-dark" />
      <h2 className="text-[32px]/[48px] font-semibold mb-4 text-gray-800 dark:text-gray-200">KYC Under Review</h2>
      <p className="text-nomyx-gray1-light dark:text-nomyx-gray1-dark mb-6">Your KYC is currently under review. Please check back later.</p>
    </div>
  );

  const renderKycRejected = () => (
    <div className="flex flex-col items-center justify-center">
      <Warning2 variant="Outline" className="w-60 h-60 text-nomyx-gray3-light dark:text-nomyx-gray3-dark" />
      <h2 className="text-[32px]/[48px] font-semibold mb-4 text-red-600">KYC Rejected</h2>
      <p className="text-nomyx-gray1-light dark:text-nomyx-gray1-dark mb-6">
        Unfortunately, your KYC was rejected. Please contact support for assistance.
      </p>
    </div>
  );

  const renderMainView = () => {
    // If we haven't fully initialized yet (still waiting for stable conditions), show spinner
    if (!initialized) {
      return (
        <div className="flex justify-center items-center h-[400px]">
          <KronosSpin />
        </div>
      );
    }

    // After initialized is true, we rely on conditions:
    if (loading) {
      return (
        <div className="flex justify-center items-center h-[400px]">
          <KronosSpin />
        </div>
      );
    }

    if (iframeStep === "tos" && tosLink) {
      return <TosModal tosLink={tosLink} onComplete={handleTosComplete} />;
    }

    if (personaLink && kycStatus === "not_started") {
      return <PersonaVerificationModal personaLink={personaLink || ""} onComplete={() => void checkKycStatus()} />;
    }

    if (kycStatus === "incomplete") {
      return rejectionReasons.length > 0 ? renderKycIncomplete() : renderKycProcessing();
    }

    if (kycStatus === "under_review") return renderKycUnderReview();
    if (kycStatus === "rejected") return renderKycRejected();

    // KYC Approved
    if (kycStatus === "approved") {
      if ((transfers && transfers.length === 0) || transfers === null) {
        return <NoHistoryView onTransferInOpen={handleTransferInOpen} onTransferOutOpen={handleTransferOutOpen} />;
      }

      if (iframeStep === null && transfers && transfers.length > 0) {
        return (
          <>
            <SearchAndFilterSection
              searchTerm={searchTerm}
              onSearchChange={(e) => setSearchTerm(e.target.value)}
              filterStatus={filterStatus}
              onFilterChange={(e) => setFilterStatus(e.target.value)}
              onTransferInOpen={handleTransferInOpen}
              onTransferOutOpen={handleTransferOutOpen}
            />
            <div
              onScroll={handleScroll}
              className="mt-5 pt-0 bg-white dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark rounded-lg w-full overflow-x-auto h-[750px] overflow-y-auto"
            >
              <Table loading={loading} dataSource={filteredTransfers} columns={columns} rowKey="id" pagination={false} className="custom-table" />
            </div>
          </>
        );
      }
    }

    return <WelcomeScreen onOpenModal={handleOpenModal} />;
  };

  return (
    <>
      {renderMainView()}

      <TransferInModal
        bridgeCustomerId={bridgeCustomerId}
        visible={isTransferInVisible}
        onClose={() => setIsTransferInVisible(false)}
        onUpdateTransfers={handleUpdateTransfers}
      />
      <TransferOutModal
        bridgeCustomerId={bridgeCustomerId}
        visible={isTransferOutVisible}
        onClose={() => setIsTransferOutVisible(false)}
        onUpdateTransfers={handleUpdateTransfers}
      />
      <CreateCustomerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        customerName={customerName}
        emailAddress={emailAddress}
        onCustomerNameChange={(event) => setCustomerName(event.target.value)}
        onEmailAddressChange={(event) => setEmailAddress(event.target.value)}
        onAddCustomer={handleAddCustomer}
        isDisabled={isAddCustomerDisabled}
        isLoading={loading}
      />
      {isPersonaModalVisible && personaLink && (
        <PersonaVerificationModal
          personaLink={personaLink || ""}
          onComplete={() => {
            setIsPersonaModalVisible(false);
            void checkKycStatus();
          }}
        />
      )}
    </>
  );
};

export default TransferInOut;
