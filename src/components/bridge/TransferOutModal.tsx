import React, { useState, useEffect, useCallback, useRef } from "react";

import { Modal, Input, Select, Form } from "antd";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { Trash } from "iconsax-react";
import { useSession } from "next-auth/react";
import Parse from "parse";
import { usePlaidLink } from "react-plaid-link";
import { toast } from "react-toastify";

import ConfirmationModal from "@/components/bridge/ConfirmationModal";

countries.registerLocale(enLocale);
const countryOptions = Object.entries(countries.getNames("en", { select: "official" })).map(([code, name]) => ({
  code,
  name,
}));

const { Option } = Select;

interface TransferOutModalProps {
  bridgeCustomerId: string;
  visible: boolean;
  onClose: () => void;
  onUpdateTransfers: () => void;
}

const TransferOutModal: React.FC<TransferOutModalProps> = ({ bridgeCustomerId, visible, onClose, onUpdateTransfers }) => {
  const [transferForm] = Form.useForm();
  const [newAccountForm] = Form.useForm();

  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isNewAccountModalVisible, setIsNewAccountModalVisible] = useState(false);
  const [newAccountPaymentRail, setNewAccountPaymentRail] = useState<string>("ach");
  const [sourceBlockchain, setSourceBlockchain] = useState<string>("Unknown");
  const [externalAccounts, setExternalAccounts] = useState<any[]>([]);
  const [destinationCurrency, setDestinationCurrency] = useState<string>("USD");
  const [filteredCountries, setFilteredCountries] = useState<any[]>(countryOptions);

  const [plaidConfig, setPlaidConfig] = useState<any>(null);
  const linkTokenRef = useRef<string | null>(null);

  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    const fetchWalletInfo = async () => {
      if (!user?.walletId) {
        console.error("Wallet ID is missing");
        return;
      }

      try {
        const response = await Parse.Cloud.run("dfnsGetWallet", {
          walletId: user.walletId,
          dfns_token: user.dfns_token,
        });
        setSourceBlockchain(response.network || "Unknown");
      } catch (error) {
        console.error("Failed to fetch wallet information:", error);
        setSourceBlockchain("Unknown");
      }
    };

    if (user?.walletId) {
      fetchWalletInfo();
    }
  }, [user]);

  useEffect(() => {
    const fetchExternalAccounts = async () => {
      try {
        const accounts = await Parse.Cloud.run("getExternalAccounts", {
          customerId: bridgeCustomerId,
        });

        setExternalAccounts(accounts.data || []);
      } catch (error) {
        console.error("Failed to fetch external accounts:", error);
      }
    };

    if (bridgeCustomerId) fetchExternalAccounts();
  }, [bridgeCustomerId]);

  const handleDestinationPaymentRailChange = (value: string) => {
    const updatedCurrency = value === "sepa" ? "EUR" : "USD";
    setDestinationCurrency(updatedCurrency);
    transferForm.setFieldsValue({ destinationCurrency: updatedCurrency });
  };

  const handleNewAccountSubmit = async (values: any) => {
    const account_type = newAccountPaymentRail === "sepa" ? "iban" : "us";
    // Prepare the payload for creating the new external account
    const newAccountPayload = {
      customer_id: bridgeCustomerId,
      currency: transferForm.getFieldValue("destinationCurrency").toLowerCase(),
      bank_name: values.bank_name,
      account_owner_name: values.account_owner_name,
      account_type: account_type,
      ...(account_type === "us" && {
        address: {
          street_line_1: values.streetLine1,
          street_line_2: values.streetLine2 || undefined,
          city: values.city,
          state: values.state || "",
          postal_code: values.postalCode || "",
          country: countries.alpha2ToAlpha3(values.country),
        },
      }),
      ...(account_type === "us" && {
        account: {
          account_number: values.accountNumber,
          routing_number: values.routingNumber,
          checking_or_savings: "checking", // Adjust this if needed
        },
      }),
      ...(account_type === "iban" && {
        iban: {
          account_number: values.iban,
          bic: values.bic,
          country: countries.alpha2ToAlpha3(values.bankCountry),
        },
      }),
      ...(account_type === "iban" && {
        account_owner_type: "individual", // TODO: nate - Hardcoded to individual for now
        first_name: values.firstName,
        last_name: values.lastName,
      }),
    };

    try {
      const newAccount = await Parse.Cloud.run("createExternalAccount", newAccountPayload);
      toast.success("New external account created successfully!");

      transferForm.setFieldsValue({ accountDetails: newAccount.id });

      setIsNewAccountModalVisible(false);

      // Refetch external accounts
      const accounts = await Parse.Cloud.run("getExternalAccounts", { customerId: bridgeCustomerId });
      setExternalAccounts(accounts.data || []);
    } catch (error) {
      console.error("Failed to create external account:", error);
      toast.error("Failed to create external account.");
    }
  };

  const handleDeleteExternalAccount = async (accountId: string) => {
    try {
      await Parse.Cloud.run("deleteExternalAccount", { customerId: bridgeCustomerId, externalAccountId: accountId });
      toast.success("External account deleted successfully!");

      // Refetch external accounts
      const accounts = await Parse.Cloud.run("getExternalAccounts", { customerId: bridgeCustomerId });
      setExternalAccounts(accounts.data || []);
    } catch (error) {
      console.error("Failed to delete external account:", error);
      toast.error("Failed to delete external account.");
    }
  };

  const handleConfirmSubmit = async () => {
    try {
      const formValues = await transferForm.validateFields();
      const transferObject: any = {
        amount: formValues.amount,
        on_behalf_of: bridgeCustomerId,
        developer_fee: "0",
        source: {
          payment_rail: "ethereum", // TODO: nate - Update the source object based on the source blockchain for production
          // payment_rail: sourceBlockchain,
          currency: formValues.sourceCurrency.toLowerCase(),
          from_address: "0xfE32E8998B06C6866Cce3054F5E8bc89103091Dc", // TODO: nate - Update the to_address based on the destination blockchain for production
        },
        destination: {
          payment_rail: formValues.destinationPaymentRail.toLowerCase(),
          currency: formValues.destinationCurrency.toLowerCase(),
          external_account_id: formValues.accountDetails,
        },
      };

      // Add wireMessages if destinationPaymentRail is 'wire'
      if (formValues.destinationPaymentRail.toLowerCase() === "wire" && formValues.wireMessage) {
        transferObject.destination.wire_message = formValues.wireMessage;
      }

      // Add sepaReference if destinationPaymentRail is 'sepa'
      if (formValues.destinationPaymentRail.toLowerCase() === "sepa" && formValues.sepaReference) {
        transferObject.destination.sepa_reference = formValues.sepaReference;
      }

      await Parse.Cloud.run("createTransfer", transferObject);
      toast.success("Transfer successfully created!");
      transferForm.resetFields();

      onUpdateTransfers();
    } catch (error: any) {
      console.error("Failed to create transfer:", error);
      toast.error(`Failed to create transfer: ${error.message}`);
    } finally {
      setIsConfirmModalVisible(false);
      onClose();
    }
  };

  const handleCountrySearch = (value: string) => {
    const filtered = countryOptions.filter((country) => country.name.toLowerCase().includes(value.toLowerCase()));
    setFilteredCountries(filtered);
  };

  const handleSubmit = () => {
    setIsConfirmModalVisible(true);
  };

  const renderFields = (paymentRail: string) => {
    const sharedFields = (
      <>
        <h2 className="font-semibold mb-2 text-gray-800 dark:text-gray-200 mt-10">Bank Details</h2>
        <div className="border-t border-2 border-gray-800 dark:border-gray-200 mb-6" />
        <Form.Item label="Bank Name" name="bank_name" rules={[{ required: true, message: "Bank Name is required" }]}>
          <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Name of the Banking Institution" />
        </Form.Item>
        <Form.Item label="Account Holder Name" name="account_owner_name" rules={[{ required: true, message: "Account Holder Name is required" }]}>
          <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Name of the holder of this bank account" />
        </Form.Item>
      </>
    );

    if (paymentRail === "ach" || paymentRail === "wire") {
      return (
        <>
          {sharedFields}
          <Form.Item label="Account Number" name="accountNumber" rules={[{ required: true, message: "Account Number is required" }]}>
            <Input type="password" className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add Account number" />
          </Form.Item>
          <Form.Item
            label="Routing Number"
            name="routingNumber"
            rules={[
              { required: true, message: "Routing Number is required" },
              { len: 9, message: "Routing Number must be exactly 9 characters long" },
            ]}
          >
            <Input type="password" className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add routing number" />
          </Form.Item>
          <h2 className="font-semibold  mb-2 text-gray-800 dark:text-gray-200 mt-10">Beneficiary Info</h2>
          <div className="border-t border-2 border-gray-800 dark:border-gray-200 mb-6" />

          <Form.Item label="Street Line 1" name="streetLine1" rules={[{ required: true, message: "Street Line 1 is required" }]}>
            <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add Street" />
          </Form.Item>
          <Form.Item label="Street Line 2" name="streetLine2">
            <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add Street" />
          </Form.Item>
          <Form.Item label="City" name="city" rules={[{ required: true, message: "City is required" }]}>
            <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add City" />
          </Form.Item>
          <Form.Item label="State" name="state" rules={[{ required: true, message: "State is required" }]}>
            <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add State" />
          </Form.Item>
          <Form.Item label="Postal Code" name="postalCode" rules={[{ required: true, message: "Postal Code is required" }]}>
            <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add Postal Code" />
          </Form.Item>
          <Form.Item
            label="Country"
            name="country"
            rules={[
              { required: true, message: "Country is required" },
              {
                validator: (_, value) =>
                  value && countries.alpha2ToAlpha3(value) ? Promise.resolve() : Promise.reject(new Error("Please select a valid country.")),
              },
            ]}
          >
            <Select
              showSearch
              placeholder="Select a country"
              onSearch={handleCountrySearch}
              filterOption={false}
              options={filteredCountries.map((country) => ({
                value: country.code,
                label: country.name,
              }))}
              defaultValue={countryOptions.find((country) => country.code === "USA")?.name}
              className="border border-black rounded-md"
            >
              {filteredCountries.map((country) => (
                <Option key={country.code} value={countries.alpha2ToAlpha3(country.code)}>
                  {country.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </>
      );
    }

    if (paymentRail === "sepa") {
      return (
        <>
          {sharedFields}

          <div className="flex gap-4">
            <Form.Item label="First Name" name="firstName" rules={[{ required: true, message: "First Name is required" }]} className="w-1/2">
              <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="First Name of account holder" />
            </Form.Item>
            <Form.Item label="Last Name" name="lastName" rules={[{ required: true, message: "Last Name is required" }]} className="w-1/2">
              <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Last Name of account holder" />
            </Form.Item>
          </div>

          <Form.Item label="IBAN" name="iban" rules={[{ required: true, message: "IBAN is required" }]}>
            <Input type="password" className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add IBAN" />
          </Form.Item>

          <Form.Item label="BIC" name="bic" rules={[{ required: true, message: "BIC is required" }]}>
            <Input type="password" className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add BIC" />
          </Form.Item>

          <Form.Item
            label="Bank Country"
            name="bankCountry"
            rules={[
              { required: true, message: "Bank Country is required" },
              {
                validator: (_, value) =>
                  value && countries.alpha2ToAlpha3(value) ? Promise.resolve() : Promise.reject(new Error("Please select a valid country.")),
              },
            ]}
          >
            <Select
              showSearch
              placeholder="Select a bank country"
              onSearch={handleCountrySearch}
              filterOption={false}
              options={filteredCountries.map((country) => ({
                value: country.code,
                label: country.name,
              }))}
              className="border border-black rounded-md"
            >
              {filteredCountries.map((country) => (
                <Option key={country.code} value={countries.alpha2ToAlpha3(country.code)}>
                  {country.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </>
      );
    }
    return <></>;
  };

  // Set up the usePlaidLink hook
  const config = {
    token: plaidConfig?.link_token || "", // Set dynamically when needed
    onSuccess: useCallback(
      async (publicToken: string, metadata: any) => {
        try {
          await Parse.Cloud.run("exchangePlaidPublicToken", {
            customerId: bridgeCustomerId,
            linkToken: linkTokenRef.current,
            publicToken,
          });
          toast.success("External account connected via Plaid successfully!");
          // Refetch external accounts
          const accounts = await Parse.Cloud.run("getExternalAccounts", { customerId: bridgeCustomerId });
          transferForm.setFieldsValue({ accountDetails: "" });
          setExternalAccounts(accounts.data || []);
        } catch (error: any) {
          console.error("Failed to exchange Plaid token:", error);
          toast.error("Failed to connect external account via Plaid.");
        }
      },
      [bridgeCustomerId, transferForm]
    ),
    onExit: useCallback((error: any, metadata: any) => {
      if (error) {
        console.error("Plaid Link error:", error);
        toast.error("Failed to connect external account via Plaid.");
      }
    }, []),
  };

  const { open, ready, error: plaidError } = usePlaidLink(config);

  // Function to handle Plaid modal opening
  const handlePlaid = useCallback(() => {
    // Fetch the link_token before opening
    const fetchLinkToken = async () => {
      try {
        const response = await Parse.Cloud.run("getPlaidLinkToken", {
          customerId: bridgeCustomerId,
        });
        setPlaidConfig(response);
        linkTokenRef.current = response.link_token;
      } catch (error: any) {
        console.error("Error fetching Plaid link token:", error);
        toast.error("Failed to initiate Plaid connection.");
      }
    };

    fetchLinkToken();
  }, [bridgeCustomerId]);

  // Trigger Plaid modal when plaidConfig is set
  useEffect(() => {
    if (plaidConfig && ready) {
      open();
    }
  }, [plaidConfig, ready, open]);
  return (
    <>
      <Modal title="Transfer Out" open={visible} onCancel={onClose} footer={null} centered className="custom-modal">
        <Form
          layout="vertical"
          form={transferForm}
          onFinish={handleSubmit}
          initialValues={{
            bridgeCustomerId,
            sourceBlockchain,
            sourceCurrency: "USDC",
            destinationPaymentRail: "ach",
            destinationCurrency,
          }}
        >
          <Form.Item label="Customer ID" name="bridgeCustomerId" rules={[{ required: true, message: "Customer ID is required" }]}>
            <Input disabled />
          </Form.Item>

          <div className="flex gap-4">
            <Form.Item
              label="Source Blockchain"
              name="sourceBlockchain"
              rules={[{ required: true, message: "Source Blockchain is required" }]}
              className="w-1/2"
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              label="Source Currency"
              name="sourceCurrency"
              rules={[{ required: true, message: "Source Currency is required" }]}
              className="w-1/2"
            >
              <Input disabled />
            </Form.Item>
          </div>

          <div className="flex gap-4">
            <Form.Item
              label="Destination Payment Rail"
              name="destinationPaymentRail"
              rules={[{ required: true, message: "Destination Payment Rail is required" }]}
              className="w-1/2"
            >
              <Select
                onChange={(value) => {
                  setNewAccountPaymentRail(value);
                  handleDestinationPaymentRailChange(value);
                }}
                className="border border-black rounded-md"
              >
                <Option value="ach">ACH</Option>
                <Option value="wire">Wire Transfer</Option>
                <Option value="sepa">Sepa</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Destination Currency"
              name="destinationCurrency"
              rules={[{ required: true, message: "Destination Currency is required" }]}
              className="w-1/2"
            >
              <Input disabled />
            </Form.Item>
          </div>

          <Form.Item
            label="Amount"
            name="amount"
            rules={[
              { required: true, message: "Amount is required" },
              { pattern: /^[0-9]+(\.[0-9]{1,2})?$/, message: "Enter a valid amount" },
            ]}
          >
            <Input
              className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark"
              placeholder="Add Amount"
              prefix="$"
              onBlur={(e) => {
                const value = e.target.value;
                const numericValue = parseFloat(value);
                if (!isNaN(numericValue)) {
                  transferForm.setFieldsValue({ amount: numericValue.toFixed(2) });
                }
              }}
            />
          </Form.Item>

          <Form.Item label="External Account" name="accountDetails" rules={[{ required: true, message: "Account is required" }]}>
            <Select
              optionLabelProp="label"
              onChange={(value) => {
                if (value === "new") {
                  setIsNewAccountModalVisible(true);
                } else if (value === "plaid") {
                  transferForm.setFieldsValue({ accountDetails: "" });
                  handlePlaid();
                }
              }}
              className="border border-black rounded-md"
            >
              {externalAccounts.map((account) => (
                <Option
                  key={account.id}
                  value={account.id}
                  label={account.bank_name + " - " + account.account_owner_name + " - " + account.currency.toUpperCase()}
                >
                  <span>
                    {account.bank_name} - {account.account_owner_name} - {account.currency.toUpperCase()}
                  </span>
                  <span style={{ float: "right" }}>
                    <Trash
                      className="text-red-500 cursor-pointer"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteExternalAccount(account.id);
                      }}
                    />
                  </span>
                </Option>
              ))}
              <Option value="new">Create new external account</Option>
              <Option value="plaid">Connect via Plaid **Will take a few minutes to populate here**</Option>
            </Select>
          </Form.Item>

          {/* Conditionally render wire-specific fields */}
          {transferForm.getFieldValue("destinationPaymentRail") === "wire" && (
            <>
              <Form.Item
                label="Wire Message"
                name="wireMessage"
                rules={[
                  { required: true, message: "Wire Message is required" },
                  { max: 35, message: "Wire Message cannot exceed 35 characters" },
                ]}
              >
                <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add Wire Message" />
              </Form.Item>
            </>
          )}

          {/* Conditionally render sepa-specific fields */}
          {transferForm.getFieldValue("destinationPaymentRail") === "sepa" && (
            <>
              <Form.Item
                label="Sepa Reference"
                name="sepaReference"
                rules={[
                  { required: true, message: "Wire Message is required" },
                  { min: 6, message: "Sepa Reference must be at least 6 characters long" },
                  { max: 140, message: "Wire Message cannot exceed 140 characters" },
                ]}
              >
                <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add Wire Message" />
              </Form.Item>
            </>
          )}

          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 text-blue-500 border border-blue-500 hover:bg-transparent hover:text-blue-500 focus:ring-0 bg-transparent text-xs px-4 py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 bg-blue-500 text-white  hover:bg-blue-600 focus:ring focus:ring-blue-300 text-xs px-4 py-2 rounded-md"
            >
              Submit
            </button>
          </div>
        </Form>
      </Modal>

      <ConfirmationModal
        title="Confirm Transfer Out"
        bodyText="Are you sure you want to submit this transfer out?"
        visible={isConfirmModalVisible}
        onCancel={() => setIsConfirmModalVisible(false)}
        onConfirm={handleConfirmSubmit}
      />

      <Modal
        title="Create New External Account"
        open={isNewAccountModalVisible}
        onCancel={() => {
          setIsNewAccountModalVisible(false);
        }}
        footer={null}
        centered
        className="custom-modal"
        maskClosable={false}
        closable={false}
      >
        <Form layout="vertical" form={newAccountForm} onFinish={handleNewAccountSubmit}>
          {renderFields(newAccountPaymentRail)}
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={() => {
                setIsNewAccountModalVisible(false);
                transferForm.setFieldsValue({ accountDetails: "" });
              }}
              className="w-1/2 text-blue-500 border border-blue-500 hover:bg-transparent hover:text-blue-500 focus:ring-0 bg-transparent text-xs px-4 py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 bg-blue-500 text-white  hover:bg-blue-600 focus:ring focus:ring-blue-300 text-xs px-4 py-2 rounded-md"
            >
              Create
            </button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default TransferOutModal;
