import React, { useState, useRef } from "react";

import { Modal, Button, Form, Input } from "antd";
import { toast } from "react-toastify";

import GenerateUserRecoveryKit, { UserRecoveryKitRef } from "@/components/onboarding/GenerateUserRecoveryKit";
import { useGemforceApp } from "@/context/GemforceAppContext";
import KronosCustomerService from "@/services/KronosCustomerService";

const RecoverDfnsKeyModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { appState }: any = useGemforceApp();
  const [form] = Form.useForm();
  const userRecoveryKitRef = useRef<UserRecoveryKitRef | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [newCredentialId, setNewCredentialId] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Loader state

  const handleRecoveryProcess = async (data: any) => {
    try {
      setLoading(true);
      const user = appState?.session?.user;
      const username = user?.username;
      setUsername(username);
      let storedRecoveryKey = {
        credentialId: data.credentialId,
        secret: data.secret,
      };
      // Step 1: Initiate the recovery process
      const {
        recoveryChallenge,
        tempAuthToken,
        recoveryKey,
        error: initError,
      } = await KronosCustomerService.initiateRecovery(username, storedRecoveryKey);

      if (initError) {
        toast.error(initError);
        setLoading(false);
        return; // Exit if initiation fails
      }

      console.log("Recovery initiated, proceeding to complete recovery...");
      // Step 2: Complete the recovery process
      const {
        newStoredRecoveryKey,
        completeResponse,
        error: completeError,
      } = await KronosCustomerService.completeRecovery(
        {
          ...recoveryChallenge,
          username,
          tempAuthToken,
          recoveryKey,
        },
        storedRecoveryKey
      );

      if (completeError) {
        toast.error(completeError);
        setLoading(false);
      } else {
        console.log("Recovery process complete:", completeResponse);
        form.resetFields();
        setNewCredentialId(newStoredRecoveryKey?.credentialId || null);
        setNewSecret(newStoredRecoveryKey?.secret || null);
      }
    } catch (error: any) {
      toast.error(error?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields(); // Reset fields when modal is canceled
    onClose(); // Call the onClose function
  };

  const handleDownloadRecoveryFile = () => {
    if (userRecoveryKitRef.current) {
      userRecoveryKitRef.current.generatePDF(); // Call the PDF generation function
    }
  };

  return (
    <Modal
      title="Recover Dfns Passkey"
      open={visible}
      onOk={onClose}
      onCancel={handleCancel}
      footer={null} // Remove default footer to customize
      maskClosable={false}
      className="custom-modal"
    >
      <div>
        <Form layout="vertical" form={form} onFinish={handleRecoveryProcess}>
          <Form.Item
            name="credentialId"
            label={<span>Recovery Code</span>} // Using Tailwind for label
            rules={[{ required: true, message: "Please enter Recovery Code" }]}
          >
            <Input placeholder="Recovery Code" />
          </Form.Item>
          <Form.Item
            name="secret"
            label={<span>Recovery Key ID</span>} // Tailwind for label
            rules={[{ required: true, message: "Please enter Recovery Key ID" }]}
          >
            <Input placeholder="Recovery Key ID" />
          </Form.Item>

          {/* Tailwind styles to align buttons in the same line */}
          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button key="back" onClick={handleCancel} className="text-black dark:text-white hover:!bg-transparent">
                Close
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading} // Display loader when loading is true
              >
                Recover
              </Button>
            </div>
          </Form.Item>
        </Form>

        {newCredentialId && (
          <>
            <p className="text-gray-500 text-base mt-6">Your recovery file has been generated. Please print and store it in a safe place.</p>
            <GenerateUserRecoveryKit
              ref={userRecoveryKitRef} // Pass the ref to the child component
              username={username || ""}
              credentialId={newCredentialId || ""}
              secret={newSecret || ""}
            />
            <button
              onClick={handleDownloadRecoveryFile} // Call the download handler
              className="bg-blue-500 text-white px-4 py-2 mt-4 rounded-md" // Tailwind button styles
            >
              Print
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default RecoverDfnsKeyModal;
