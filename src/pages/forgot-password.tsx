"use client";

import React from "react";

import { Layout } from "antd";
import { Form, Input, Card, Radio, Button } from "antd/es";
import Image from "next/image";
import Link from "next/link"; // Import Link from next/link
import { useRouter } from "next/navigation";
import Parse from "parse";
import { SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";

import Header from "../components/global/auth_header";

type ForgotPasswordFormInputs = {
  email: string;
};

const ForgotPassword = () => {
  const router = useRouter();
  const onSubmit: SubmitHandler<ForgotPasswordFormInputs> = async (data) => {
    try {
      // Call the Parse Cloud function
      const response = await Parse.Cloud.run("requestPasswordReset", {
        email: data.email,
      });

      if (response.success) {
        toast.success(
          "We have sent an email to " + data.email + " with a reset password link, open your email and click the link to assign a new password"
        );
        router.push("/login");
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
        <div className="w-full lg:w-1/2 flex flex-col px-4 md:px-6 my-10">
          <div className={"flex flex-grow justify-center items-center align-middle"}>
            <div className="flex justify-center items-center">
              <Card
                title={<span className="text-black">Forgot Password</span>}
                style={{
                  width: "550px",
                  border: "1px solid #BBBBBB", // Set Card border color inline
                }}
                className="signup-card bg-transparent wallet-setup-radio-group"
              >
                <p className="mb-10 text-left text-nomyx-dark1-dark font-normal text-sm">
                  It&apos;s alright, type in your email, and we will send you a reset password link.
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
                        backgroundColor: "white",
                        border: "1px solid #BBBBBB",
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
                  <Link href="/login" className="text-nomyx-violet-light font-semibold">
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
