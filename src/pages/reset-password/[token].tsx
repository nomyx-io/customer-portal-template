// ResetPassword.tsx
"use client";

import React, { useState } from "react";

import { CheckOutlined } from "@ant-design/icons";
import { Layout } from "antd";
import { Form, Input, Card, Button } from "antd";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Parse from "parse";
import { toast } from "react-toastify";

import Header from "../../components/global/auth_header";

// Define the form inputs type
type ResetPasswordFormInputs = {
  password: string;
  confirmPassword: string;
};

const ResetPassword = ({ token }: { token: string }) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  // Define password criteria
  const passwordCriteria = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  // Function to render icons based on criteria
  const renderIcon = (condition: boolean) => {
    return condition ? <CheckOutlined className="!text-green-700" /> : <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" />;
  };

  const onSubmit = async (data: ResetPasswordFormInputs) => {
    try {
      if (data.password !== data.confirmPassword) {
        form.setFields([
          {
            name: "confirmPassword",
            errors: ["Passwords do not match!"],
          },
        ]);
        return;
      }

      // Validate password criteria before submission
      const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
      if (!isPasswordValid) {
        toast.error("Please meet all password requirements.");
        return;
      }

      // Call the Parse Cloud function to reset the password
      const response = await Parse.Cloud.run("resetPassword", {
        newPassword: data.password,
        token: token,
      });

      if (response.success) {
        toast.success(response.message || "Password has been reset successfully!");
        router.push("/login"); // Redirect to login page after successful reset
      } else {
        toast.error(response.message || "Failed to reset password.");
      }
    } catch (error: any) {
      toast.error("An error occurred while processing your request!");
      console.error("Error in onSubmit:", error);
    }
  };

  return (
    <Layout
      className="relative w-full min-h-screen overflow-hidden flex flex-col"
      style={{
        backgroundImage: "url('/images/nomyx_banner.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Header />
      <div className="flex flex-1 flex-col lg:flex-row auth-page">
        {/* Left Side */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 md:px-6 my-10">
          <div className="w-full max-w-2xl">
            <Image src="/images/nomyx_logo_black.svg" alt="Logo" width={630} height={240} priority />
          </div>
        </div>
        {/* Right Section - Reset Password Form */}
        <div className="w-full lg:w-1/2 flex flex-col px-4 md:px-6 my-10">
          <div className={"flex flex-grow justify-center items-center align-middle"}>
            <div className="flex justify-center items-center w-full">
              <Card
                title={<span className="text-black">Reset Password</span>}
                style={{
                  width: "100%",
                  maxWidth: "550px",
                  border: "1px solid #BBBBBB",
                }}
                className="password-card bg-transparent"
              >
                <Form layout="vertical" form={form} onFinish={onSubmit}>
                  {/* Password */}
                  <Form.Item
                    name="password"
                    label={<span className="text-[#1F1F1F]">Password</span>}
                    rules={[
                      {
                        required: true,
                        message: "Please enter your password!",
                      },
                      {
                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
                        message: "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.",
                      },
                    ]}
                  >
                    <Input.Password
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        color: "#1F1F1F",
                        backgroundColor: "white",
                        border: "1px solid #BBBBBB",
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
                      {
                        required: true,
                        message: "Please confirm your password!",
                      },
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
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        color: "#1F1F1F",
                        backgroundColor: "white",
                        border: "1px solid #BBBBBB",
                      }}
                      className="signup-input"
                    />
                  </Form.Item>

                  {/* Password Requirements */}
                  <div className="text-sm mb-4">
                    <p className="flex items-center">
                      {renderIcon(passwordCriteria.minLength)}
                      <span className={`ml-2 ${passwordCriteria.minLength ? "text-green-700" : "text-gray-500"}`}>At least 8 characters</span>
                    </p>
                    <p className="flex items-center">
                      {renderIcon(passwordCriteria.hasUppercase)}
                      <span className={`ml-2 ${passwordCriteria.hasUppercase ? "text-green-700" : "text-gray-500"}`}>
                        At least 1 uppercase letter
                      </span>
                    </p>
                    <p className="flex items-center">
                      {renderIcon(passwordCriteria.hasLowercase)}
                      <span className={`ml-2 ${passwordCriteria.hasLowercase ? "text-green-700" : "text-gray-500"}`}>
                        At least 1 lowercase letter
                      </span>
                    </p>
                    <p className="flex items-center">
                      {renderIcon(passwordCriteria.hasNumber)}
                      <span className={`ml-2 ${passwordCriteria.hasNumber ? "text-green-700" : "text-gray-500"}`}>At least 1 number</span>
                    </p>
                    <p className="flex items-center">
                      {renderIcon(passwordCriteria.hasSpecialChar)}
                      <span className={`ml-2 ${passwordCriteria.hasSpecialChar ? "text-green-700" : "text-gray-500"}`}>
                        At least 1 special character
                      </span>
                    </p>
                  </div>
                  <Form.Item className="actions">
                    <Button type="primary" htmlType="submit">
                      Reset Password
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPassword;

// Define getServerSideProps
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  // Check if params exists and has the token property
  if (params && typeof params.token === "string") {
    return {
      props: { token: params.token }, // Pass it as props to the page
    };
  }

  // Handle the case where token is not available
  return {
    notFound: true, // This will trigger a 404 page
  };
};

// Define getLayout if needed
ResetPassword.getLayout = (page: React.ReactElement) => {
  return <>{page}</>;
};
