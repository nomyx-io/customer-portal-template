import React, { useState } from "react";

import { CheckOutlined } from "@ant-design/icons";
import { Card, Form, Input, Button } from "antd";
import Image from "next/image";

interface PasswordFormProps {
  onBack: () => void;
  onSubmit: (values: any) => void; // New prop for submission
}

const PasswordForm: React.FC<PasswordFormProps> = ({ onBack, onSubmit }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordCriteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const handleFormSubmit = (values: any) => {
    // Call the onSubmit prop with the form values
    onSubmit(values);
  };

  const renderIcon = (condition: boolean) => {
    return condition ? (
      <CheckOutlined className="!text-green-500" /> // Add "!important" to override
    ) : (
      <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />
    );
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Section - Custom Gradient Background and Logo */}
      <div className="w-1/2 flex justify-center items-center bg-black">
        <Image
          src="/images/Kronos-Carbon-Logo.png"
          width={100}
          height={25}
          alt="Logo"
          className="h-156"
        />
      </div>
      <div className="flex flex-col justify-center items-center w-1/2 bg-white auth-pages">
        <Card
          title={<span className="text-black">Create Password</span>}
          style={{
            width: "550px",
            border: "1px solid #BBBBBB",
          }}
          className="password-card bg-white"
        >
          <Form layout="vertical" onFinish={handleFormSubmit}>
            {/* Password */}
            <Form.Item
              name="password"
              label={<span className="text-[#1F1F1F]">Password</span>}
              rules={[
                { required: true, message: "Please enter your password!" },
              ]}
            >
              <Input.Password
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  color: "#1F1F1F", // Text color
                  backgroundColor: "transparent", // Transparent background
                  border: "1px solid #BBBBBB", // Border color
                }}
                className="signup-input"
              />
            </Form.Item>

            {/* Confirm Password */}
            <Form.Item
              name="confirmPassword"
              label={<span className="text-[#1F1F1F]">Confirm Password</span>}
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match!"));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  color: "#1F1F1F", // Text color
                  backgroundColor: "transparent", // Transparent background
                  border: "1px solid #BBBBBB", // Border color
                }}
                className="signup-input"
              />
            </Form.Item>

            {/* Password Requirements */}
            <div className="text-sm">
              <p className="flex items-center">
                {renderIcon(passwordCriteria.minLength)}
                <span
                  className={`ml-2 ${passwordCriteria.minLength ? "text-green-500" : "text-gray-500"}`}
                >
                  At least 8 characters
                </span>
              </p>
              <p className="flex items-center">
                {renderIcon(passwordCriteria.hasUppercase)}
                <span
                  className={`ml-2 ${passwordCriteria.hasUppercase ? "text-green-500" : "text-gray-500"}`}
                >
                  At least 1 uppercase letter
                </span>
              </p>
              <p className="flex items-center">
                {renderIcon(passwordCriteria.hasLowercase)}
                <span
                  className={`ml-2 ${passwordCriteria.hasLowercase ? "text-green-500" : "text-gray-500"}`}
                >
                  At least 1 lowercase letter
                </span>
              </p>
              <p className="flex items-center">
                {renderIcon(passwordCriteria.hasNumber)}
                <span
                  className={`ml-2 ${passwordCriteria.hasNumber ? "text-green-500" : "text-gray-500"}`}
                >
                  At least 1 number
                </span>
              </p>
              <p className="flex items-center">
                {renderIcon(passwordCriteria.hasSpecialChar)}
                <span
                  className={`ml-2 ${passwordCriteria.hasSpecialChar ? "text-green-500" : "text-gray-500"}`}
                >
                  At least 1 special character
                </span>
              </p>
            </div>
            {/* Back Link and Submit Button in Two Columns */}
            <div className="grid grid-cols-2 gap-4 my-4">
              {/* Back Link - Centered in Left Column */}
              <div className="flex justify-center">
                <Button
                  onClick={onBack}
                  className="text-blue-600 border-none hover:text-blue-800 hover:!bg-transparent"
                >
                  Back
                </Button>
              </div>

              {/* Submit Button - Full Width in Right Column */}
              <Form.Item className="m-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Submit
                </Button>
              </Form.Item>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default PasswordForm;
