import React, { useState } from "react";
import { Modal, Button, Form, Input } from "antd";
import KronosCustomerService from "@/services/KronosCustomerService";
import { toast } from "react-toastify";
import { useGemforceApp } from "@/context/GemforceAppContext";
import { parseUnits, ethers } from "ethers";

const TransferModal = ({ visible, onClose, usdcBalance, walletId }: any) => {
  const [form] = Form.useForm();
  const { appState }: any = useGemforceApp();

  const handleTransfer = async (data: any) => {
    try {
      const { recipient, amount } = data;

      // Retrieve user details from appState
      const user = appState?.session?.user;
      const walletId = user?.walletId;
      const dfnsToken = user?.dfns_token;

      if (!walletId || !dfnsToken) {
        throw new Error("Wallet ID or DFNS token is missing.");
      }

      // Initiate the transfer process
      const response = await KronosCustomerService.transferUSDC(
        walletId,
        dfnsToken,
        recipient,
        amount
      );

      if (response?.transactionHash) {
        toast.success(
          "Transfer successful! Transaction Hash: " + response.transactionHash
        );
        form.resetFields();
        onClose(); // Close modal on success
      } else {
        toast.error(
          "Transfer failed: " + response?.message || "Unknown error."
        );
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred during the transfer.");
    }
  };

  const handleCancel = () => {
    form.resetFields(); // Reset fields when modal is canceled
    onClose(); // Call the onClose function
  };

  return (
    <Modal
      title="Transfer USDC"
      open={visible}
      onOk={onClose}
      onCancel={handleCancel}
      footer={null} // Custom footer for better control
      className="custom-modal"
      maskClosable={false}
    >
      <Form layout="vertical" form={form} onFinish={handleTransfer}>
        <Form.Item
          name="recipient"
          label="Recipient Wallet Address"
          rules={[
            {
              required: true,
              message: "Please enter recipient wallet address",
            },
          ]}
        >
          <Input placeholder="Wallet address" />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Amount to Transfer"
          rules={[
            {
              required: true,
              message: "Please enter amount to transfer",
            },
            {
              pattern: /^\d+(\.\d{1,2})?$/,
              message: "Please enter a valid amount",
            },
            {
              validator: (_, value) =>
                value && parseFloat(value) > parseFloat(usdcBalance)
                  ? Promise.reject("Insufficient balance")
                  : Promise.resolve(),
            },
          ]}
        >
          <Input placeholder="Amount (USDC)" />
        </Form.Item>

        <Form.Item>
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
          >
            <Button
              key="back"
              onClick={handleCancel}
              className="text-black dark:text-white hover:!bg-transparent"
            >
              Close
            </Button>
            <Button type="primary" htmlType="submit">
              Transfer
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TransferModal;
