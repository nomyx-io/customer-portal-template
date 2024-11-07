import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import React, { useEffect, useState } from "react";
import { Layout } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount, useDisconnect } from "wagmi";
import { signIn, getCsrfToken } from "next-auth/react";
import { Form, Input, Card, Radio, Button } from "antd/es";
import { LoginPreference } from "@/utils/Constants";
import { StandardCredentials, EthereumCredentials } from "@/auth/Credentials";
import Header from "../components/global/auth_header";
import { toast } from "react-toastify";

const Credentials = [StandardCredentials, EthereumCredentials];

const Login = function ({
  csrfToken,
  callbackUrl,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const ethereumAccount = useAccount();
  const { disconnect } = useDisconnect();
  const [loginPreference, setLoginPreference] = useState(
    LoginPreference.USERNAME_PASSWORD
  );

  const walletLogin = loginPreference == LoginPreference.WALLET;

  const standardLogin = async (values: any) => {
    const { email, password } = values;
    const result: any = await signIn("standard", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    if (!result.ok) {
      if (result.status == 401) {
        toast.error("Login failed. This user is not authorized.");
      } else {
        toast.error(
          "An authorization error occurred. Please try again later or contact your administrator."
        );
      }
    } else {
      toast.error(null);
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
  }, []);

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
                title={<span className="text-black">Sign In</span>} // Set title color to black
                style={{
                  width: "550px",
                  border: "1px solid #BBBBBB", // Set Card border color inline
                }}
                className="signup-card bg-white wallet-setup-radio-group"
                extra={
                  <Radio.Group
                    defaultValue={LoginPreference.USERNAME_PASSWORD}
                    buttonStyle="solid"
                  >
                    {Credentials &&
                      Credentials.map(
                        (credentialConfig: any, index: number) => {
                          const optionsId = credentialConfig.options.id;
                          const loginPreferenceOptionValue =
                            optionsId == "ethereum"
                              ? LoginPreference.WALLET
                              : LoginPreference.USERNAME_PASSWORD;
                          const loginOptionLabel =
                            credentialConfig.options.name;

                          return (
                            <Radio.Button
                              key={`login-option-${credentialConfig.options.id}`}
                              value={loginPreferenceOptionValue}
                              onClick={(e: any) => {
                                setLoginPreference(e.target.value);
                              }}
                            >
                              {loginOptionLabel}
                            </Radio.Button>
                          );
                        }
                      )}
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
                            <Card.Grid
                              key={`login-${index}`}
                              className="p-0 text-center"
                              style={{ width: "100%" }}
                            >
                              <w3m-button />
                              <p className="text-black font-medium mt-5 ">
                                Need an account?&nbsp;
                                <Link href="/signup" className="text-blue-600">
                                  Register here.
                                </Link>
                              </p>
                            </Card.Grid>
                          )
                        );

                      default:
                        return (
                          !walletLogin && (
                            <Card.Grid
                              key={`login-${index}`}
                              className="pt-4"
                              style={{ width: "100%" }}
                            >
                              <Form layout="vertical" onFinish={standardLogin}>
                                <input
                                  name="csrfToken"
                                  type="hidden"
                                  defaultValue={csrfToken}
                                />
                                <input
                                  name="callbackUrl"
                                  type="hidden"
                                  defaultValue={callbackUrl}
                                />

                                {credentialConfig?.options?.credentials &&
                                  Object.keys(
                                    credentialConfig.options.credentials
                                  ).map((key: any, index: number) => {
                                    const c =
                                      credentialConfig.options.credentials[key];

                                    return (
                                      <Form.Item
                                        key={`form-item-${index}`}
                                        name={key}
                                        label={
                                          <span className="text-[#1F1F1F]">
                                            {c.label}
                                          </span>
                                        }
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
                                          placeholder={
                                            c.placeholder || `Enter ${c.label}`
                                          }
                                          style={{
                                            color: "#1F1F1F", // Text color
                                            backgroundColor: "transparent", // Transparent background
                                            border: "1px solid #BBBBBB", // Border color
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
                                  <Link
                                    href="/forgot-password"
                                    className="text-blue-600 font-medium"
                                  >
                                    Forgot Password?
                                  </Link>
                                </p>
                                <p className="ml-auto text-black font-medium">
                                  Need an account?&nbsp;
                                  <Link
                                    href="/signup"
                                    className="text-blue-600"
                                  >
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
