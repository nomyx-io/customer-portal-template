import React, { useEffect, useState } from "react";

import { Layout } from "antd";
import { Form, Input, Card, Radio, Button } from "antd/es";
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getCsrfToken, getSession } from "next-auth/react";
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

  const walletLogin = loginPreference == LoginPreference.WALLET;

  const { address, isConnected } = useAccount();
  // Prevents automatic wallet disconnection on page load
  useEffect(() => {
    if (isConnected) {
      console.log("Wallet is already connected:", address);
    }
  }, [isConnected, address]);

  const standardLogin = async (values: any) => {
    const { email, password } = values;

    try {
      // Show loading state
      toast.info("Logging in...", { autoClose: false, toastId: "login" });

      const result = await signIn("standard", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (!result?.ok) {
        toast.dismiss("login");
        toast.error(result?.status === 401 ? "Incorrect username / password" : "An error occurred.");
        return;
      }

      // Check session with retries
      const maxRetries = 5;
      let session = null;

      for (let i = 0; i < maxRetries; i++) {
        session = await getSession();
        if (session?.user?.accessToken) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!session?.user?.accessToken) {
        toast.dismiss("login");
        toast.error("Session initialization failed");
        window.location.href = "/login"; // Force reload login page
        return;
      }
      const jwtToken = localStorage.getItem("jwtToken");
      // Determine redirect URL
      let redirectUrl = "";
      if (jwtToken) {
        redirectUrl = process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL + "?token=" + jwtToken;
      } else {
        redirectUrl = "/dashboard";
      }

      toast.dismiss("login");
      toast.success("Login successful!");

      // Try programmatic navigation first
      try {
        //router.push(redirectUrl);
        window.location.href = redirectUrl;
      } catch (error) {
        console.error("Router navigation failed:", error);
        // Fallback to window.location
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.dismiss("login");
      toast.error("An unexpected error occurred");
    }
  };

  // In your Login component, add this effect
  useEffect(() => {
    const checkAndRedirect = async () => {
      const session = await getSession();
      if (session?.user?.accessToken) {
        const jwtToken = localStorage.getItem("jwtToken");
        // Determine redirect URL
        let redirectUrl = "";
        if (jwtToken) {
          redirectUrl = process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL + "?token=" + jwtToken;
        } else {
          redirectUrl = "/dashboard";
        }
        window.location.href = redirectUrl;
      }
    };

    checkAndRedirect();
  }, [callbackUrl]);

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
    <>
      <Head>
        <title>Login - Customer Portal</title>
      </Head>
      <Layout
        className="relative w-full min-h-screen overflow-hidden flex flex-col"
        style={{
          backgroundImage: "url('/images/nomyx_banner.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* <Header /> */}
        <div className="flex flex-1 flex-col lg:flex-row auth-page">
          {/* Left Side */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 md:px-6 my-10">
            <div className="w-full max-w-2xl">
              <Image src="/images/nomyx_logo_white.svg" alt="Logo" width={630} height={240} priority />
            </div>
          </div>
          {/* Right Side */}
          <div className="w-full lg:w-1/2 flex items-center justify-center px-4 md:px-6">
            <div className="bg-nomyxDark1 bg-opacity-90 text-nomyxWhite shadow-lg rounded-lg p-4 max-w-2xl w-full">
              <div className="w-full flex flex-col justify-center items-center">
                <Card
                  title={<span className="text-white">Sign In</span>} // Set title color to black
                  style={{
                    width: "100%",
                    maxWidth: "550px",
                    border: "none",
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
                                <p className="text-white font-medium mt-5 ">
                                  Need an account?&nbsp;
                                  <Link href="/signup" className="text-blue-300">
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
                                          label={<span className="text-nomyxGray1">{c.label}</span>}
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
                                            className="signup-input"
                                          />
                                        </Form.Item>
                                      );
                                    })}

                                  <Form.Item className="actions">
                                    <Button type="primary" htmlType="submit" className="bg-blue-400 hover:bg-blue-700 text-nomyxWhite">
                                      Log in
                                    </Button>
                                  </Form.Item>
                                </Form>
                                <div className="flex">
                                  <p>
                                    <Link href="/forgot-password" className="text-blue-500 font-semibold">
                                      Forgot Password?
                                    </Link>
                                  </p>
                                  <p className="ml-auto text-white font-semibold">
                                    Need an account?&nbsp;
                                    <Link href="/signup" className="text-blue-500">
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
    </>
  );
};

export default Login;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  context.res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
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
