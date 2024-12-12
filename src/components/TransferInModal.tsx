import React, { useState, useEffect } from "react";

import { Modal, Input, Select, Button, Form } from "antd";
import { useSession } from "next-auth/react";
import Parse from "parse";
import { toast } from "react-toastify";

import ConfirmationModal from "@/components/ConfirmationModal";

const { Option } = Select;

interface TransferInModalProps {
  bridgeCustomerId: string;
  visible: boolean;
  onClose: () => void;
  onUpdateTransfers: () => void;
}

const TransferInModal: React.FC<TransferInModalProps> = ({ bridgeCustomerId, visible, onClose, onUpdateTransfers }) => {
  const [form] = Form.useForm();
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [destinationBlockchain, setDestinationBlockchain] = useState<string>("Unknown");
  const [amountPrefix, setAmountPrefix] = useState<string>("$"); // State for currency prefix

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
        setDestinationBlockchain(response.network || "Unknown");
      } catch (error) {
        console.error("Failed to fetch wallet information:", error);
        setDestinationBlockchain("Unknown");
      }
    };

    if (user?.walletId) fetchWalletInfo();
  }, []);

  const handleConfirmSubmit = async () => {
    try {
      const formValues = await form.validateFields();
      const transferObject = {
        amount: formValues.amount,
        on_behalf_of: bridgeCustomerId,
        developer_fee: "0", // TODO: nate - Hardcoded to 0 for now
        source: {
          payment_rail: formValues.sourcePaymentRail,
          currency: formValues.sourceCurrency.toLowerCase(),
        },
        destination: {
          payment_rail: "ethereum", // TODO: nate - Update the destination object based on the destination blockchain for production
          currency: "usdc",
          to_address: "0xfE32E8998B06C6866Cce3054F5E8bc89103091Dc", // TODO: nate - Update the to_address based on the destination blockchain for production
        },
      };

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

  const handleSourcePaymentRailChange = (value: string) => {
    const updatedCurrency = value === "sepa" ? "EUR" : "USD";
    form.setFieldsValue({ sourceCurrency: updatedCurrency });
    setAmountPrefix(updatedCurrency === "EUR" ? "€" : "$");
  };

  const handleSubmit = () => setIsConfirmModalVisible(true);

  return (
    <>
      <Modal title="Transfer In" open={visible} onCancel={onClose} footer={null} centered className="custom-modal">
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{
            bridgeCustomerId,
            sourcePaymentRail: "ach_push",
            sourceCurrency: "USD",
            destinationBlockchain: destinationBlockchain,
            destinationCurrency: "USDC",
            walletAddress: user?.walletId,
          }}
        >
          <Form.Item label="Customer ID" name="bridgeCustomerId" rules={[{ required: true, message: "Customer ID is required" }]}>
            <Input disabled />
          </Form.Item>

          <div className="flex gap-4">
            <Form.Item
              label="Source Payment Rail"
              name="sourcePaymentRail"
              rules={[{ required: true, message: "Source Payment Rail is required" }]}
              className="w-1/2"
            >
              <Select onChange={handleSourcePaymentRailChange} className="border border-black rounded-md">
                <Option value="ach_push">ACH Push</Option>
                <Option value="wire">Wire Transfer</Option>
                {/* <Option value="sepa">Sepa</Option> */}
              </Select>
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
              prefix={amountPrefix}
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

          <div className="flex gap-4">
            <Form.Item
              label="Destination Blockchain"
              name="destinationBlockchain"
              rules={[{ required: true, message: "Destination Blockchain is required" }]}
              className="w-1/2"
            >
              <Input disabled />
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

          <Form.Item label="Wallet Address" name="walletAddress" rules={[{ required: true, message: "Wallet Address is required" }]}>
            <Input disabled />
          </Form.Item>

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
        title="Confirm Transfer In"
        bodyText="Are you sure you want to submit this transfer in?"
        visible={isConfirmModalVisible}
        onCancel={() => setIsConfirmModalVisible(false)}
        onConfirm={handleConfirmSubmit}
      />
    </>
  );
};

export default TransferInModal;
