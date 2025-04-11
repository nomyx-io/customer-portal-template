import React, { useState } from "react";

import { Card, Form, Input, Button } from "antd";
import Image from "next/image";
import Link from "next/link";

import CheckUserOnboarding from "./check-user-onboarding";

const SignUpForm = ({ onNext, formData }: any) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Initial form values (from parent state)
  const initialValues = formData;

  const onSubmit = (values: any) => {
    onNext(values); // Pass form data to parent and switch to PasswordForm
  };

  const handleOnboardClick = () => {
    setIsModalVisible(true); // Open the modal
  };

  return (
    <div className="flex flex-1 flex-col lg:flex-row auth-page">
      {/* Left Side */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 md:px-6 my-10">
        <div className="w-full max-w-2xl">
          <Image src="/images/nomyx_logo_white.svg" alt="Logo" width={630} height={240} priority />
        </div>
      </div>
      {/* Right Section - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 md:px-6">
        <div className="bg-nomyxDark1 bg-opacity-90 text-nomyxWhite shadow-lg rounded-lg p-4 max-w-2xl w-full">
          <div className="w-full flex flex-col justify-center items-center">
            <Card
              title={<span className="text-white">Sign Up</span>} // Set title color to black
              style={{
                width: "100%",
                maxWidth: "550px",
                border: "none",
              }}
              className="signup-card bg-transparent"
            >
              <Form layout="vertical" form={form} initialValues={initialValues} onFinish={onSubmit}>
                {/* First Name and Last Name in one row */}
                <div className="flex gap-4">
                  <Form.Item
                    name="firstName"
                    label={<span className="text-nomyxGray1">First Name</span>} // Set label color
                    rules={[{ required: true, message: "Please enter your first name!" }]}
                    className="w-1/2"
                  >
                    <Input placeholder="First Name" className="signup-input" />
                  </Form.Item>

                  <Form.Item
                    name="lastName"
                    label={<span className="text-nomyxGray1">Last Name</span>} // Set label color
                    rules={[{ required: true, message: "Please enter your last name!" }]}
                    className="w-1/2"
                  >
                    <Input placeholder="Last Name" className="signup-input" />
                  </Form.Item>
                </div>

                {/* Email with Validation */}
                <Form.Item
                  name="email"
                  label={<span className="text-nomyxGray1">Email</span>} // Set label color
                  rules={[
                    { required: true, message: "Please enter your email!" },
                    {
                      type: "email",
                      message: "Please enter a valid email address!",
                    },
                  ]}
                >
                  <Input placeholder="Email" className="signup-input" />
                </Form.Item>

                {/* Company/Organization */}
                <Form.Item
                  name="company"
                  label={<span className="text-nomyxGray1">Company/Organization</span>} // Set label color
                  rules={[
                    {
                      required: true,
                      message: "Please enter your company/organization!",
                    },
                  ]}
                >
                  <Input placeholder="Company/Organization" className="signup-input" />
                </Form.Item>

                {/* Submit Button */}
                <Form.Item className="actions">
                  <Button type="primary" htmlType="submit">
                    Next
                  </Button>
                </Form.Item>
              </Form>
              <div className="flex justify-between">
                <p className="text-white font-medium">
                  Onboarding Pending?&nbsp;
                  <Link href="#" onClick={handleOnboardClick} className="text-blue-500">
                    Onboard
                  </Link>
                </p>
                <p className="text-white font-medium">
                  Already have an account?&nbsp;
                  <Link href="/login" className="text-blue-500">
                    Sign In
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <CheckUserOnboarding visible={isModalVisible} onClose={() => setIsModalVisible(false)} />
    </div>
  );
};

export default SignUpForm;
