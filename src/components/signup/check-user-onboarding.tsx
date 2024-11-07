import React, { useState } from "react";
import { Modal, Form, Input, Button, notification } from "antd";
import { useRouter } from "next/navigation";
import KronosCustomerService from "@/services/KronosCustomerService";
import { toast } from "react-toastify";

const CheckUserOnboarding = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    const { email } = values;
    setLoading(true);
    const { isOnboarded, error } =
      await KronosCustomerService.checkUserOnboarding(email);

    setLoading(false);

    if (error) {
      toast.error(error);
      return;
    }

    if (isOnboarded) {
      toast.warning("You are already onboarded.");
    } else {
      // Navigate to onboarding component
      router.push("/onboarding?email=" + email);
    }
  };

  const handleCancel = () => {
    form.resetFields(); // Reset fields when modal is canceled
    onClose(); // Call the onClose function
  };

  return (
    <Modal
      title="Check User Onboarding"
      open={visible}
      onOk={onClose}
      onCancel={handleCancel}
      footer={null}
      maskClosable={false}
      className="custom-modal"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, message: "Please enter your email!" }]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <Button onClick={handleCancel} className="text-black dark:text-white hover:!bg-transparent">Close</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="ml-3"
            >
              Submit
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CheckUserOnboarding;
