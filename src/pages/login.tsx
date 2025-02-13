import React, { useEffect, useState } from "react";

import { Layout } from "antd";
import { Form, Input, Card, Radio, Button } from "antd/es";
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getCsrfToken } from "next-auth/react";
import { toast } from "react-toastify";
import { useAccount, useDisconnect } from "wagmi";

import { StandardCredentials, EthereumCredentials } from "@/auth/Credentials";
import { LoginPreference } from "@/utils/Constants";

import Header from "../components/global/auth_header";

const Credentials = [StandardCredentials, EthereumCredentials];

const Login = function ({ csrfToken, callbackUrl }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const ethereumAccount = useAccount();
  const { disconnect } = useDisconnect();
  const [loginPreference, setLoginPreference] = useState(LoginPreference.USERNAME_PASSWORD);
  const { address, isConnected } = useAccount();

  // Prevents automatic wallet disconnection on page load
  useEffect(() => {
    if (isConnected) {
      console.log("Wallet is already connected:", address);
    }
  }, [isConnected, address]);

  const walletLogin = loginPreference == LoginPreference.WALLET;

  const standardLogin = async (values: any) => {
    const { email, password } = values;
    const result = await signIn("standard", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    if (!result?.ok) {
      toast.error(result?.status === 401 ? "Login failed. This user is not authorized." : "An error occurred. Try again later.");
    } else {
      toast.dismiss();
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get("redirect") || "/";
      router.push(redirectUrl);
    }
  };

  useEffect(() => {
    const handleWalletDisconnect = async () => {
      await disconnect(); // Disconnect the wallet
    };

    if (ethereumAccount.address) {
      handleWalletDisconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {/* Right Side */}
        <div className="w-full lg:w-1/2 flex flex-col px-4 md:px-6 my-10">
          <div className={"flex flex-grow justify-center items-center align-middle"}>
            <div className="flex justify-center items-center">
              <Card
                title={<span className="text-black">Sign In</span>} // Set title color to black
                style={{
                  width: "550px",
                  border: "1px solid #BBBBBB", // Set Card border color inline
                }}
                className="signup-card bg-transparent wallet-setup-radio-group"
                extra={
                  <Radio.Group defaultValue={LoginPreference.USERNAME_PASSWORD} buttonStyle="solid">
                    {Credentials &&
                      Credentials.map((credentialConfig: any, index: number) => {
                        const optionsId = credentialConfig.options.id;
                        const loginPreferenceOptionValue = optionsId == "ethereum" ? LoginPreference.WALLET : LoginPreference.USERNAME_PASSWORD;
                        const loginOptionLabel = credentialConfig.options.name;

                        return (
                          <Radio.Button
                            key={`login-option-${credentialConfig.options.id}`}
                            value={loginPreferenceOptionValue}
                            onClick={(e: any) => {
                              setLoginPreference(e.target.value);
                            }}
                            className="login-radio-button"
                          >
                            {loginOptionLabel}
                          </Radio.Button>
                        );
                      })}
                  </Radio.Group>
                }
              >
                {Credentials &&
                  Credentials.map((credentialConfig: any, index: number) => {
                    const optionsId = credentialConfig.options.id;

                    switch (optionsId) {
                      case "ethereum":
                        return (
                          walletLogin && (
                            <Card.Grid key={`login-${index}`} className="p-0 text-center" style={{ width: "100%" }}>
                              <w3m-button />
                              <p className="text-black font-medium mt-5 ">
                                Need an account?&nbsp;
                                <Link href="/signup" className="text-nomyx-violet-light">
                                  Register here.
                                </Link>
                              </p>
                            </Card.Grid>
                          )
                        );

                      default:
                        return (
                          !walletLogin && (
                            <Card.Grid key={`login-${index}`} className="pt-4" style={{ width: "100%" }}>
                              <Form layout="vertical" onFinish={standardLogin}>
                                <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
                                <input name="callbackUrl" type="hidden" defaultValue={callbackUrl} />

                                {credentialConfig?.options?.credentials &&
                                  Object.keys(credentialConfig.options.credentials).map((key: any, index: number) => {
                                    const c = credentialConfig.options.credentials[key];

                                    return (
                                      <Form.Item
                                        key={`form-item-${index}`}
                                        name={key}
                                        label={<span className="text-[#1F1F1F]">{c.label}</span>}
                                        rules={[
                                          {
                                            required: true,
                                            message: `Please input your ${key}!`,
                                          },
                                        ]}
                                      >
                                        <Input
                                          name={key}
                                          type={c.type}
                                          placeholder={c.placeholder || `Enter ${c.label}`}
                                          style={{
                                            color: "#1F1F1F",
                                            backgroundColor: "white",
                                            border: "1px solid #BBBBBB",
                                          }}
                                          className="signup-input"
                                        />
                                      </Form.Item>
                                    );
                                  })}

                                <Form.Item className="actions">
                                  <Button type="primary" htmlType="submit">
                                    Log in
                                  </Button>
                                </Form.Item>
                              </Form>
                              <div className="flex">
                                <p>
                                  <Link href="/forgot-password" className="text-nomyx-violet-light font-semibold">
                                    Forgot Password?
                                  </Link>
                                </p>
                                <p className="ml-auto text-black font-semibold">
                                  Need an account?&nbsp;
                                  <Link href="/signup" className="text-nomyx-violet-light">
                                    Register here.
                                  </Link>
                                </p>
                              </div>
                            </Card.Grid>
                          )
                        );
                    }
                  })}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
      callbackUrl: context.query.redirect || "",
    },
  };
}

Login.getLayout = (page: React.ReactElement) => {
  return <>{page}</>;
};
