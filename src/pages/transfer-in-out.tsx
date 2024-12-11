import React, { useState, useEffect, useCallback } from "react";

import { Input, Button, Modal, Select, Table, Popover } from "antd";
import { LinkSquare, MoneyChange, SearchNormal1, ArrowRight, Copy, InfoCircle } from "iconsax-react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import Parse from "parse";
import { toast } from "react-toastify";

import BankDetailsPopover from "@/components/BankDetailsPopover";
import CustomIframe from "@/components/CustomIframe";
import TransferInModal from "@/components/TransferInModal";
import TransferOutModal from "@/components/TransferOutModal";
import ParseService from "@/services/ParseService";

const { Option } = Select;

const TransferInOut: React.FC = () => {
  const { data: session } = useSession();
  let user = session?.user;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [personalLink, setPersonalLink] = useState<string | null>(null);
  const [inquiryTemplateId, setInquiryTemplateId] = useState<string | null>(null);
  const [environmentId, setEnvironmentId] = useState<string | null>(null);
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [iqtToken, setIqtToken] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [tosLink, setTosLink] = useState<string | null>(null);
  const [tosStatus, setTosStatus] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [iframeStep, setIframeStep] = useState<"tos" | "personal" | null>(null);

  const [showTransferScreen, setShowTransferScreen] = useState(false);
  const [isTransferInVisible, setIsTransferInVisible] = useState(false);
  const [isTransferOutVisible, setIsTransferOutVisible] = useState(false);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [bridgeCustomerId, setBridgeCustomerId] = useState<string>("");

  const fetchTransferData = useCallback(async () => {
    if (!bridgeCustomerId) {
      console.warn("bridgeCustomerId is not available.");
      return;
    }

    try {
      const response = await Parse.Cloud.run("getCustomerTransfers", {
        customer_id: bridgeCustomerId,
      });

      setTransfers(response.data || []);
    } catch (error: any) {
      console.error("Error fetching transfer data:", error);
      toast.error("Failed to fetch transfer data.");
    }
  }, [bridgeCustomerId]);

  useEffect(() => {
    fetchTransferData();
  }, [fetchTransferData]);

  const handleUpdateTransfers = async () => {
    await fetchTransferData();
  };

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      searchTerm === "" ||
      transfer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.source.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.destination.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.destination.to_address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || transfer.state.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const truncateAddress = (address: string) => {
    if (address && address.length > 10) {
      return `${address.slice(0, 2)}...${address.slice(-4)}`;
    }
    return address;
  };

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
            <span>{truncateAddress(user!.walletAddress)}</span>
            <span
              onClick={() => {
                navigator.clipboard.writeText(record.id);
                toast.success("Transaction ID copied to clipboard!");
              }}
              className="ml-2 text-blue-500 cursor-pointer"
            >
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
      render: (amount: number) => {
        const formatter = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        });

        return formatter.format(amount);
      },
    },
    {
      title: "Type",
      key: "type",
      render: (_: any, record: any) => {
        const isTransferIn = ["ach_push", "sepa", "wire"].includes(record.source.payment_rail.toLowerCase());
        const type = isTransferIn ? "Transfer In" : "Transfer Out";
        return <span>{type}</span>;
      },
    },
    {
      title: "Conversion",
      key: "conversion",
      render: (_: any, record: any) => {
        const etherscanUrl = (address: string) => `https://etherscan.io/address/${address}`;

        const isTransferIn = ["ach_push", "sepa", "wire"].includes(record.source.payment_rail.toLowerCase());

        const destination = isTransferIn ? truncateAddress(record.destination.to_address) : "Bank";

        return (
          <div className="flex flex-col leading-tight">
            <div className="flex items-center">
              <span className="min-w-[150px]">Transaction ID:</span>
              <span>{truncateAddress(record.id)}</span>
              <span
                onClick={() => {
                  navigator.clipboard.writeText(record.id);
                  toast.success("Transaction ID copied to clipboard!");
                }}
                className="ml-2 text-blue-500 cursor-pointer"
              >
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
                  href={etherscanUrl(record.destination.to_address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {destination}
                </a>
              ) : (
                <BankDetailsPopover externalAccountId={record.destination.external_account_id} customerId={user?.bridgeCustomerId!} />
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Details",
      key: "details",
      render: (_: any, record: any) => {
        const isTransferOut = !["ach_push", "sepa", "wire"].includes(record.source.payment_rail.toLowerCase());

        const content = isTransferOut ? (
          <div className="flex flex-col text-black">
            <h2 className="text-lg font-semibold">Transfer Instructions</h2>
            <div className="flex items-center">
              <span className="min-w-[150px]">
                <strong>To Address:</strong>
              </span>
              <span>{truncateAddress(record.source_deposit_instructions.to_address)}</span>
              <span className="flex-grow"></span>
              <span
                onClick={() => {
                  navigator.clipboard.writeText(record.source_deposit_instructions.to_address);
                  toast.success("To Address copied to clipboard!");
                }}
                className="ml-2 text-blue-500 cursor-pointer"
              >
                <Copy size="16" />
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col text-black">
            <h2 className="text-lg font-semibold">Transfer Instructions</h2>
            <div className="flex items-center">
              <span className="min-w-[150px]">
                <strong>Beneficiary Name:</strong>
              </span>
              <span>{record.source_deposit_instructions.bank_beneficiary_name}</span>
              <span className="flex-grow"></span>
              <span
                onClick={() => {
                  navigator.clipboard.writeText(record.id);
                  toast.success("Transaction ID copied to clipboard!");
                }}
                className="ml-2 text-blue-500 cursor-pointer"
              >
                <Copy size="16" />
              </span>
            </div>

            <div className="flex items-center">
              <span className="min-w-[150px]">
                <strong>Routing #:</strong>
              </span>
              <span>{record.source_deposit_instructions.bank_routing_number}</span>
              <span className="flex-grow"></span>
              <span
                onClick={() => {
                  navigator.clipboard.writeText(record.id);
                  toast.success("Transaction ID copied to clipboard!");
                }}
                className="ml-2 text-blue-500 cursor-pointer"
              >
                <Copy size="16" />
              </span>
            </div>

            <div className="flex items-center">
              <span className="min-w-[150px]">
                <strong>Account #:</strong>
              </span>
              <span> {record.source_deposit_instructions.bank_account_number}</span>
              <span className="flex-grow"></span>
              <span
                onClick={() => {
                  navigator.clipboard.writeText(record.id);
                  toast.success("Transaction ID copied to clipboard!");
                }}
                className="ml-2 text-blue-500 cursor-pointer"
              >
                <Copy size="16" />
              </span>
            </div>

            <div className="flex items-center">
              <span className="min-w-[150px]">
                <strong>Beneficiary Address:</strong>
              </span>
              <span> {record.source_deposit_instructions.bank_beneficiary_address}</span>
              <span className="flex-grow"></span>
              <span
                onClick={() => {
                  navigator.clipboard.writeText(record.id);
                  toast.success("Transaction ID copied to clipboard!");
                }}
                className="ml-2 text-blue-500 cursor-pointer"
              >
                <Copy size="16" />
              </span>
            </div>
          </div>
        );

        return (
          <Popover
            content={content}
            trigger="click"
            placement="bottom"
            overlayInnerStyle={{
              backgroundColor: "#ffffff",
              color: "#000000",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Button className="p-0" type="link">
              View Details
            </Button>
          </Popover>
        );
      },
    },
  ];

  useEffect(() => {
    const checkKycStatus = async () => {
      try {
        const currentUser = Parse.User.current();

        if (!currentUser) {
          toast.error("User not logged in.");
          return;
        }

        const kycLinkId = currentUser.get("kycId");
        if (!kycLinkId) {
          toast.error("KYC ID not found.");
          return;
        }

        const response = await Parse.Cloud.run("getKycLinkStatus", {
          kyc_link_id: kycLinkId,
        });

        const { kyc_status, tos_status, kyc_link, tos_link, customer_id } = response;

        if (customer_id) {
          setBridgeCustomerId(customer_id);
        }

        if (kyc_status === "approved" && tos_status === "approved" && transfers.length === 0) {
          setShowTransferScreen(true);
        } else {
          setPersonalLink(kyc_link);
          setTosLink(tos_link);
          setTosStatus(tos_status);
          setKycStatus(kyc_status);

          if (tos_status !== "approved") {
            setIframeStep("tos");
          } else if (kyc_status !== "approved") {
            setIframeStep("personal");
          }
        }
      } catch (error: any) {
        console.error("Error checking KYC status:", error);
        toast.error(`Error checking KYC status: ${error.message}`);
      }
    };

    checkKycStatus();
  }, []);

  const handleTransferInOpen = () => {
    setIsTransferInVisible(true);
  };

  const handleTransferInClose = () => {
    setIsTransferInVisible(false);
  };

  const handleTransferOutOpen = () => {
    setIsTransferOutVisible(true);
  };

  const handleTransferOutClose = () => {
    setIsTransferOutVisible(false);
  };

  const handleTosComplete = async (data: any) => {
    try {
      const currentUser = Parse.User.current();

      if (currentUser) {
        await ParseService.updateRecord("User", currentUser.id, {
          signedAgreementId: data.signedAgreementId,
        });
      }
    } catch (error) {
      console.error("Failed to save signed agreement ID:", error);
    }

    toast.info("TOS step completed.");
    if (kycStatus === "approved") {
      setShowTransferScreen(true);
      setIframeStep(null);
    } else {
      setIframeStep("personal");
    }
  };

  const handleOpenModal = () => {
    if (user) {
      setCustomerName(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
      setEmailAddress(user.email ?? "");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCustomerName("");
    setEmailAddress("");
  };

  const handleAddCustomer = async () => {
    setLoading(true);
    try {
      const redirectUri = window.location.href;

      const response = await Parse.Cloud.run("generateKycLink", {
        full_name: customerName.trim(),
        email: emailAddress.trim(),
        type: "individual", // TODO: You can customize this or make it dynamic
        redirect_uri: redirectUri,
      });
      toast.success("KYC link generated successfully!");

      const { id: kycId, customer_id: bridgeCustomerId } = response;

      const currentUser = Parse.User.current();

      if (currentUser) {
        try {
          await ParseService.updateRecord("User", currentUser.id, {
            kycId,
            bridgeCustomerId,
          });

          setBridgeCustomerId(bridgeCustomerId);
        } catch (error) {
          console.error("Failed to update User with KYC ID:", error);
        }
      }

      let modifiedKycLink = response.kyc_link.replace("/verify?", "/widget?");
      modifiedKycLink += `&iframe-origin=${encodeURIComponent(window.location.origin)}`;

      setPersonalLink(modifiedKycLink);
      setTosLink(response.tos_link);

      const personaLink = new URL(response.kyc_link);

      const templateId = personaLink.searchParams.get("inquiry-template-id");
      const environmentId = personaLink.searchParams.get("environment-id");
      const developerId = personaLink.searchParams.get("fields[developer_id]");
      const iqtToken = personaLink.searchParams.get("fields[iqt_token]");
      const referenceId = personaLink.searchParams.get("reference-id");

      if (templateId && environmentId && developerId && iqtToken && referenceId) {
        setInquiryTemplateId(templateId);
        setEnvironmentId(environmentId);
        setDeveloperId(developerId);
        setIqtToken(iqtToken);
        setReferenceId(referenceId);
      }

      setIframeStep("tos");
    } catch (error: any) {
      toast.error(`Failed to generate KYC link: ${error.message}`);
      console.error("Error generating KYC link:", error);
    } finally {
      setLoading(false);
      handleCloseModal();
    }
  };

  const isAddCustomerDisabled = !customerName.trim() || !emailAddress.trim();

  const Persona = dynamic(() => import("@/components/Persona"), {
    ssr: false,
  });

  return (
    <>
      {!showTransferScreen ? (
        <>
          {iframeStep === "tos" && tosLink ? (
            <Modal title="Terms of Service" open={true} footer={null} centered className="custom-modal" maskClosable={false} closable={false}>
              <CustomIframe src={tosLink} onComplete={handleTosComplete} />
            </Modal>
          ) : iframeStep === "personal" && personalLink && inquiryTemplateId && environmentId && developerId && iqtToken && referenceId ? (
            <div className="persona-container">
              <Modal
                open={true}
                footer={null}
                centered
                className="!p-0 id-verification-modal"
                style={{
                  maxWidth: "90%",
                  margin: "0 auto",
                  height: "750px",
                  overflowY: "auto",
                }}
                maskClosable={false}
                closable={false}
              >
                <div className="p-4">
                  <Persona
                    templateId={inquiryTemplateId}
                    environmentId={environmentId}
                    developerId={developerId}
                    iqtToken={iqtToken}
                    referenceId={referenceId}
                    onComplete={(result) => {
                      toast.success("KYC verification completed successfully!");
                      setShowTransferScreen(true);
                    }}
                  />
                </div>
              </Modal>
            </div>
          ) : (
            <div className="flex flex-col text-nomyx-text-light dark:text-nomyx-text-dark h-[80%] text-xl items-center justify-center w-full grow">
              <LinkSquare variant="Outline" className="w-60 h-60 text-nomyx-gray3-light dark:text-nomyx-gray3-dark" />
              <h2 className="text-[32px]/[48px] font-semibold mb-4 text-gray-800 dark:text-gray-200">Welcome!</h2>
              <p className="text-nomyx-gray1-light dark:text-nomyx-gray1-dark mb-6">
                In order to benefit from our Bridge Transfer service, please create an account through the KYC process.
              </p>
              <button className="bg-nomyx-main1-light dark:bg-nomyx-main1-dark text-white text-xs px-4 py-2 rounded-md" onClick={handleOpenModal}>
                Create Account
              </button>
            </div>
          )}

          <Modal
            title="Create Customer Account"
            open={isModalOpen}
            onCancel={handleCloseModal}
            footer={null}
            centered
            className="rounded-lg custom-modal"
          >
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col">
                <label className="text-gray-800 font-medium">
                  <span className="text-nomyx-danger-light dark:text-nomyx-danger-dark">*</span> Customer Name
                </label>
                <Input placeholder="Type Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-800 font-medium">
                  <span className="text-nomyx-danger-light dark:text-nomyx-danger-dark">*</span> Email Address
                </label>
                <Input placeholder="Type Email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
              </div>
              <div className="flex justify-between mt-4">
                <Button onClick={handleCloseModal} className="text-blue-500">
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleAddCustomer}
                  className="bg-blue-500 hover:bg-blue-600"
                  disabled={isAddCustomerDisabled}
                  loading={loading}
                >
                  Add Customer
                </Button>
              </div>
            </div>
          </Modal>
        </>
      ) : transfers.length > 0 ? ( // Show the table if transfers exist
        <>
          {/* Search Bar Section */}
          <div className="flex flex-wrap gap-2 justify-between items-center p-2 rounded-lg bg-nomyx-dark2-light dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark">
            {/* Search Bar and Dropdown */}
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center w-full lg:w-64 bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark rounded-sm px-2 py-1">
                <SearchNormal1 size="24" />
                <input
                  type="text"
                  placeholder="Search Transfers"
                  className="bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark ml-2 w-full focus:outline-none"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  value={searchTerm}
                />
              </div>

              <select
                className="bg-nomyx-dark1-light dark:bg-nomyx-dark1-dark text-nomyx-text-light dark:text-nomyx-text-dark px-2 py-1 rounded-sm w-full lg:w-48"
                onChange={(e) => setFilterStatus(e.target.value)}
                value={filterStatus}
              >
                <option value="all">All Status</option>
                <option value="awaiting_funds">Awaiting Funds</option>
                <option value="funds_received">Funds Recieved</option>
                <option value="payment_submitted">Payment Submitted</option>
                <option value="payment_processed">Payment Processed</option>
                <option value="in_review">In Review</option>
                <option value="returned">Returned</option>
                <option value="refunded">Refunded</option>
                <option value="canceled">Canceled</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Transfer Buttons */}
            <div className="flex flex-wrap gap-2 mt-2 lg:mt-0">
              <button
                onClick={handleTransferInOpen}
                className="bg-nomyx-main1-light dark:bg-nomyx-main1-dark text-white text-xs px-4 py-2 rounded-md w-full sm:w-auto"
              >
                Transfer In
              </button>
              <button
                onClick={handleTransferOutOpen}
                className="bg-nomyx-main1-light dark:bg-nomyx-main1-dark text-white text-xs px-4 py-2 rounded-md w-full sm:w-auto"
              >
                Transfer Out
              </button>
            </div>
          </div>
          <div className="mt-5 pt-0 bg-white dark:bg-nomyx-dark2-dark text-nomyx-text-light dark:text-nomyx-text-dark rounded-lg w-full overflow-x-auto">
            <Table dataSource={filteredTransfers} columns={columns} rowKey="id" loading={loading} pagination={false} className="custom-table" />
          </div>
          <TransferInModal
            bridgeCustomerId={bridgeCustomerId}
            visible={isTransferInVisible}
            onClose={handleTransferInClose}
            onUpdateTransfers={handleUpdateTransfers}
          />
          <TransferOutModal
            bridgeCustomerId={bridgeCustomerId}
            visible={isTransferOutVisible}
            onClose={handleTransferOutClose}
            onUpdateTransfers={handleUpdateTransfers}
          />
        </>
      ) : (
        // Show "No History to View" if transfers array is empty
        <div className="flex flex-col items-center justify-center">
          <MoneyChange variant="Outline" className="w-60 h-60 text-nomyx-gray3-light dark:text-nomyx-gray3-dark" />
          <h2 className="text-[32px]/[48px] font-semibold mb-4 text-gray-800 dark:text-gray-200">No History to View</h2>
          <p className="text-nomyx-gray1-light dark:text-nomyx-gray1-dark mb-6">Transfer history will be shown here</p>
          <div className="flex gap-4 mt-6">
            <button onClick={handleTransferInOpen} className="bg-nomyx-main1-light dark:bg-nomyx-main1-dark text-white text-xs px-4 py-2 rounded-md">
              Transfer In
            </button>
            <button onClick={handleTransferOutOpen} className="bg-nomyx-main1-light dark:bg-nomyx-main1-dark text-white text-xs px-4 py-2 rounded-md">
              Transfer Out
            </button>
          </div>
          <TransferInModal
            bridgeCustomerId={bridgeCustomerId}
            visible={isTransferInVisible}
            onClose={handleTransferInClose}
            onUpdateTransfers={handleUpdateTransfers}
          />
          <TransferOutModal
            bridgeCustomerId={bridgeCustomerId}
            visible={isTransferOutVisible}
            onClose={handleTransferOutClose}
            onUpdateTransfers={handleUpdateTransfers}
          />
        </div>
      )}
    </>
  );
};

export default TransferInOut;
