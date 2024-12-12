import React, { useState, useEffect } from "react";

import { Modal, Input, Select, Button, Form } from "antd";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { useSession } from "next-auth/react";
import Parse from "parse";
import { toast } from "react-toastify";

import ConfirmationModal from "@/components/ConfirmationModal";

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
  const [form] = Form.useForm();
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isNewAccountModalVisible, setIsNewAccountModalVisible] = useState(false);
  const [newAccountPaymentRail, setNewAccountPaymentRail] = useState<string>("ach");
  const [sourceBlockchain, setSourceBlockchain] = useState<string>("Unknown");
  const [externalAccounts, setExternalAccounts] = useState<any[]>([]);
  const [destinationCurrency, setDestinationCurrency] = useState<string>("USD");
  const [filteredCountries, setFilteredCountries] = useState<any[]>(countryOptions);

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
  }, []);

  useEffect(() => {
    const fetchExternalAccounts = async () => {
      try {
        const accounts = await Parse.Cloud.run("getExternalAccounts", {
          customerId: bridgeCustomerId,
        });
        setExternalAccounts(accounts.data || []);
      } catch (error) {
        console.error("Failed to fetch external accounts:", error);
        toast.error("Failed to fetch external accounts.");
      }
    };

    if (bridgeCustomerId) fetchExternalAccounts();
  }, []);

  const handleDestinationPaymentRailChange = (value: string) => {
    const updatedCurrency = value === "sepa" ? "EUR" : "USD";
    setDestinationCurrency(updatedCurrency);
    form.setFieldsValue({ destinationCurrency: updatedCurrency });
  };

  const handleNewAccountSubmit = async (values: any) => {
    const account_type = newAccountPaymentRail === "sepa" ? "iban" : "us";
    // Prepare the payload for creating the new external account
    const newAccountPayload = {
      customer_id: bridgeCustomerId,
      currency: form.getFieldValue("destinationCurrency").toLowerCase(),
      bank_name: values.bank_name,
      account_owner_name: values.account_owner_name,
      account_type: account_type,
      address: {
        street_line_1: values.streetLine1,
        street_line_2: values.streetLine2 || undefined,
        city: values.city,
        state: values.state || "",
        postal_code: values.postalCode || "",
        country: countries.alpha2ToAlpha3(values.country),
      },
      ...(account_type === "us" && {
        account: {
          account_number: values.accountNumber,
          routing_number: values.routingNumber,
          checking_or_savings: "checking", // Adjust this if needed
        },
      }),
      ...(account_type === "iban" && {
        iban: values.iban,
        bic: values.bic,
        bank_country: values.bankCountry,
      }),
    };

    try {
      const newAccount = await Parse.Cloud.run("createExternalAccount", newAccountPayload);
      toast.success("New external account created successfully!");

      form.setFieldsValue({ accountDetails: newAccount.id });

      setIsNewAccountModalVisible(false);

      // Refetch external accounts
      const accounts = await Parse.Cloud.run("getExternalAccounts", { customerId: bridgeCustomerId });
      setExternalAccounts(accounts.data || []);
    } catch (error) {
      console.error("Failed to create external account:", error);
      toast.error("Failed to create external account.");
    }
  };

  const handleConfirmSubmit = async () => {
    try {
      const formValues = await form.validateFields();
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

      console.log("transferObject", transferObject);

      await Parse.Cloud.run("createTransfer", transferObject);
      toast.success("Transfer successfully created!");
      form.resetFields();

      onUpdateTransfers();
    } catch (error) {
      console.error("Failed to create transfer:", error);
      toast.error("Failed to create transfer.");
    } finally {
      setIsConfirmModalVisible(false);
      onClose();
    }
  };

  const handleCountrySearch = (value: string) => {
    const filtered = countryOptions.filter((country) => country.name.toLowerCase().includes(value.toLowerCase()));
    setFilteredCountries(filtered);
  };

  const handleSubmit = () => setIsConfirmModalVisible(true);

  const renderFields = (paymentRail: string) => {
    const destinationPaymentRail = form.getFieldValue("destinationPaymentRail");

    const sharedFields = (
      <>
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
          <Form.Item
            label="Routing Number"
            name="routingNumber"
            rules={[
              { required: true, message: "Routing Number is required" },
              { len: 9, message: "Routing Number must be exactly 9 characters long" },
            ]}
          >
            <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add routing number" />
          </Form.Item>

          <Form.Item label="Account Number" name="accountNumber" rules={[{ required: true, message: "Account Number is required" }]}>
            <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add Account number" />
          </Form.Item>

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
              filterOption={false} // Custom filtering
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
          <Form.Item label="Account Owner Type" name="accountOwnerType" rules={[{ required: true, message: "Account Owner Type is required" }]}>
            <Input disabled value="Individual" />
          </Form.Item>

          <div className="flex gap-4">
            <Form.Item label="First Name" name="firstName" rules={[{ required: true, message: "First Name is required" }]} className="w-1/2">
              <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="First Name of account holder" />
            </Form.Item>
            <Form.Item label="Last Name" name="lastName" rules={[{ required: true, message: "Last Name is required" }]} className="w-1/2">
              <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Last Name of account holder" />
            </Form.Item>
          </div>

          <Form.Item label="IBAN" name="iban" rules={[{ required: true, message: "IBAN is required" }]}>
            <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add IBAN" />
          </Form.Item>

          <Form.Item label="BIC" name="bic" rules={[{ required: true, message: "BIC is required" }]}>
            <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add BIC" />
          </Form.Item>

          <Form.Item label="Bank Country" name="bankCountry" rules={[{ required: true, message: "Bank Country is required" }]}>
            <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add Bank Country" />
          </Form.Item>

          <Form.Item label="Sepa Reference" name="sepaReference">
            <Input className="!bg-nomyx-dark2-light dark:!bg-nomyx-dark2-dark" placeholder="Add Sepa Reference" />
          </Form.Item>
        </>
      );
    }
    return <></>;
  };

  return (
    <>
      <Modal title="Transfer Out" open={visible} onCancel={onClose} footer={null} centered className="custom-modal">
        <Form
          layout="vertical"
          form={form}
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
                {/* <Option value="sepa">Sepa</Option> */}
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
                  // Ensure two decimal places
                  form.setFieldsValue({ amount: numericValue.toFixed(2) });
                }
              }}
            />
          </Form.Item>

          <Form.Item label="External Account" name="accountDetails" rules={[{ required: true, message: "Account is required" }]}>
            <Select
              onChange={(value) => {
                if (value === "new") setIsNewAccountModalVisible(true);
              }}
              className="border border-black rounded-md"
            >
              {externalAccounts.map((account) => (
                <Option key={account.id} value={account.id}>
                  {account.bank_name} - ({account.account_owner_name})
                </Option>
              ))}
              <Option value="new">Create New External Account</Option>
            </Select>
          </Form.Item>

          {/* Conditionally render wire-specific fields */}
          {form.getFieldValue("destinationPaymentRail") === "wire" && (
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

          <div className="flex gap-4 mt-4">
            <button
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
        <Form layout="vertical" form={form} onFinish={handleNewAccountSubmit}>
          {renderFields(newAccountPaymentRail)}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => {
                setIsNewAccountModalVisible(false);
                form.setFieldsValue({ accountDetails: "" });
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
