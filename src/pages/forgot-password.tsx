"use client";

import React from "react";
import Link from "next/link"; // Import Link from next/link
import { Layout } from "antd";
import Parse from "parse";
import { SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { Form, Input, Card, Radio, Button } from "antd/es";
import Header from "../components/global/auth_header";

type ForgotPasswordFormInputs = {
  email: string;
};

const ForgotPassword = () => {
  const onSubmit: SubmitHandler<ForgotPasswordFormInputs> = async (data) => {
    try {
      // Call the Parse Cloud function
      const response = await Parse.Cloud.run("requestPasswordReset", {
        email: data.email,
      });

      if (response.success) {
        toast.success(
          "We have sent an email to " +
            data.email +
            " with a reset password link, open your email and click the link to assign a new password"
        );
      } else {
        toast.error("Failed to send password reset email!");
      }
    } catch (error) {
      toast.error("An error occurred while processing your request!");
      console.error("Error in onSubmit:", error);
    }
  };

  //const isFormValid = email?.length > 0;

  return (
    <Layout
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Header />
      <div className="flex h-screen w-full">
        {/* Left Section - Custom Gradient Background and Logo */}
        <div className="w-1/2 flex justify-center items-center bg-black">
          <img
            src="/images/Kronos-Carbon-Logo.png"
            alt="Logo"
            className="h-156"
          />
        </div>
        <div className="flex flex-col justify-center items-center w-1/2 bg-white auth-pages">
          <div
            className={
              "flex flex-grow justify-center items-center align-middle"
            }
          >
            <div className="flex justify-center items-center">
              <Card
                title={<span className="text-black">Forgot Password</span>}
                style={{
                  width: "550px",
                  border: "1px solid #BBBBBB", // Set Card border color inline
                }}
                className="signup-card bg-white wallet-setup-radio-group"
              >
                <p className="mb-10 text-left text-nomyx-dark1-dark font-normal text-sm">
                  It&apos;s alright, type in your email, and we will send you a
                  reset password link.
                </p>
                <Form layout="vertical" onFinish={onSubmit}>
                  <Form.Item
                    key="form-item"
                    name="email"
                    label={<span className="text-[#1F1F1F]">Email</span>}
                    rules={[
                      {
                        required: true,
                        message: "Please input your email!",
                      },
                      {
                        type: "email",
                        message: "Please enter a valid email address!",
                      },
                    ]}
                  >
                    <Input
                      name="email"
                      type="email"
                      placeholder="Please enter your email"
                      style={{
                        color: "#1F1F1F", // Text color
                        backgroundColor: "transparent", // Transparent background
                        border: "1px solid #BBBBBB", // Border color
                      }}
                      className="signup-input"
                    />
                  </Form.Item>

                  <Form.Item className="actions">
                    <Button type="primary" htmlType="submit">
                      Submit
                    </Button>
                  </Form.Item>
                </Form>

                <div className="flex justify-center">
                  <Link href="/login" className="text-blue-600">
                    Back to Login
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;

ForgotPassword.getLayout = (page: React.ReactElement) => {
  return <>{page}</>;
};
