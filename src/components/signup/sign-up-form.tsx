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
    <div className="flex h-screen w-full">
      {/* Left Section - Custom Gradient Background and Logo */}
      <div className="w-1/2 flex justify-center items-center bg-black">
        <Image
          src="/images/Kronos-Carbon-Logo.png"
          width={300}
          height={25}
          alt="Logo"
          className="h-156"
        />
      </div>
      {/* Right Section - Sign Up Form */}
      <div className="flex flex-col justify-center items-center w-1/2 bg-white auth-pages">
        <Card
          title={<span className="text-black">Sign Up</span>} // Set title color to black
          style={{
            width: "550px",
            border: "1px solid #BBBBBB", // Set Card border color inline
          }}
          className="signup-card bg-white"
        >
          <Form
            layout="vertical"
            form={form}
            initialValues={initialValues}
            onFinish={onSubmit}
          >
            {/* First Name and Last Name in one row */}
            <div className="flex gap-4">
              <Form.Item
                name="firstName"
                label={<span className="text-[#1F1F1F]">First Name</span>} // Set label color
                rules={[
                  { required: true, message: "Please enter your first name!" },
                ]}
                className="w-1/2"
              >
                <Input
                  placeholder="First Name"
                  style={{
                    color: "#1F1F1F", // Text color
                    backgroundColor: "transparent", // Transparent background
                    border: "1px solid #BBBBBB", // Border color
                  }}
                  className="signup-input"
                />
              </Form.Item>

              <Form.Item
                name="lastName"
                label={<span className="text-[#1F1F1F]">Last Name</span>} // Set label color
                rules={[
                  { required: true, message: "Please enter your last name!" },
                ]}
                className="w-1/2"
              >
                <Input
                  placeholder="Last Name"
                  style={{
                    color: "#1F1F1F", // Text color
                    backgroundColor: "transparent", // Transparent background
                    border: "1px solid #BBBBBB", // Border color
                  }}
                  className="signup-input"
                />
              </Form.Item>
            </div>

            {/* Email with Validation */}
            <Form.Item
              name="email"
              label={<span className="text-[#1F1F1F]">Email</span>} // Set label color
              rules={[
                { required: true, message: "Please enter your email!" },
                {
                  type: "email",
                  message: "Please enter a valid email address!",
                },
              ]}
            >
              <Input
                placeholder="Email"
                style={{
                  color: "#1F1F1F", // Text color
                  backgroundColor: "transparent", // Transparent background
                  border: "1px solid #BBBBBB", // Border color
                }}
                className="signup-input"
              />
            </Form.Item>

            {/* Company/Organization */}
            <Form.Item
              name="company"
              label={
                <span className="text-[#1F1F1F]">Company/Organization</span>
              } // Set label color
              rules={[
                {
                  required: true,
                  message: "Please enter your company/organization!",
                },
              ]}
            >
              <Input
                placeholder="Company/Organization"
                style={{
                  color: "#1F1F1F", // Text color
                  backgroundColor: "transparent", // Transparent background
                  border: "1px solid #BBBBBB", // Border color
                }}
                className="signup-input"
              />
            </Form.Item>

            {/* Submit Button */}
            <Form.Item className="actions">
              <Button type="primary" htmlType="submit">
                Next
              </Button>
            </Form.Item>
          </Form>
          <div className="flex justify-between">
            <p className="text-black font-medium">
              Onboarding Pending?&nbsp;
              <Link
                href="#"
                onClick={handleOnboardClick}
                className="text-blue-600"
              >
                Onboard
              </Link>
            </p>
            <p className="text-black font-medium">
              Already have an account?&nbsp;
              <Link href="/login" className="text-blue-600">
                Sign In
              </Link>
            </p>
          </div>
        </Card>
      </div>
      <CheckUserOnboarding
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </div>
  );
};

export default SignUpForm;
