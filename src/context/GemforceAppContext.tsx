import React, { createContext, useState, useContext, useEffect, Component } from "react";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";
import { ConfigProvider, theme } from "antd/es";
import { ethers } from "ethers";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import { signIn, signOut, useSession } from "next-auth/react";
import PubSub from "pubsub-js";
import { toast } from "react-toastify";
import { Chain, sepolia, useAccount, useDisconnect, WagmiConfig } from "wagmi";

import siweConfig from "@/auth/SiweConfig";
import { MainLayout } from "@/components/MainLayout/MainLayout";
import GemforceAppState from "@/context/GemforceAppState";
import initializeParse from "@/InitializeParse";
import ParseService from "@/services/ParseService";
import { generateRandomString } from "@/utils";
import { NomyxEvent } from "@/utils/Constants";
import { getEthereumProviderAndSigner, setSigner, setProvider } from "@/utils/ethereumProvider";

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = "6b3dd072d7469b88a9bc1c5d49baeefa";

// 2. Create wagmiConfig
const metadata = {
  name: "Kronos Customer Portal",
  description: "Kronos Customer Portal",
  url: "https://kronos-customer-portal.vercel.app",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const localhost: Chain = {
  id: 31337,
  name: "Localhost",
  network: "localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_NETWORK_LOCALHOST || ""],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_NETWORK_LOCALHOST || ""],
    },
  },
  testnet: true,
};

const base: any = {
  id: 8453,
  network: "base",
  name: "Base",
  nativeCurrency: {
    name: "Base",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_NETWORK_BASE],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_NETWORK_BASE],
    },
  },
};

const baseSep: any = {
  id: 84532,
  network: "baseSep",
  name: "Base Sepolia",
  nativeCurrency: {
    name: "Base",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_NETWORK_BASE_SEPOLIA],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_NETWORK_BASE_SEPOLIA],
    },
  },
};

const optSep: Chain = {
  id: 11155420,
  network: "optimism",
  name: "Optimism Sepolia",
  nativeCurrency: {
    name: "OP Sepolia",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_NETWORK_OPTIMISM_SEPOLIA || ""],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_NETWORK_OPTIMISM_SEPOLIA || ""],
    },
  },
};

const chains = [base, baseSep, localhost, optSep];
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// 3. Create modal
createWeb3Modal({
  // siweConfig,
  wagmiConfig,
  projectId,
  chains,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
});

type GemforceAppContextType = {
  appState: GemforceAppState;
};

export const GemforceAppContext = createContext<GemforceAppContextType | undefined>(undefined);

const WalletConnectHandler = ({ children }: any) => {
  const { data: session, status } = useSession();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  useEffect(() => {
    const ethereum: any = (window as any).ethereum;
    if (ethereum) {
      ethereum.on("accountsChanged", async () => {
        if (status === "authenticated") {
          try {
            // First clear any Parse session
            await ParseService.logout();
            // Then handle next-auth signout
            await signOut({ callbackUrl: "/login" });
            // Finally disconnect wallet
            disconnect();
          } catch (error) {
            console.error("Error during account change cleanup:", error);
            // Ensure signout happens even if cleanup fails
            await signOut({ callbackUrl: "/login" });
            disconnect();
          }
        }
      });
    }
    return () => {
      if (ethereum) {
        ethereum.removeAllListeners("accountsChanged");
      }
    };
  }, [disconnect, status]);

  useAccount({
    onConnect: async function ({ address, connector, isReconnected }) {
      let signature = "";
      let message = "";
      let provider = "";

      if (!session) {
        const storedSignature = localStorage.getItem("signature") ? JSON.parse(localStorage.getItem("signature") as string) : null;

        if (!storedSignature) {
          const { provider, signer } = await getEthereumProviderAndSigner();
          const RandomString = generateRandomString(10);
          message = `Sign this message to validate that you are the owner of the account. Random string: ${RandomString}`;

          try {
            signature = await signer!.signMessage(message);
          } catch (error: any) {
            const message = error.reason ? error.reason : error.message;
          }
        } else {
          signature = storedSignature.signature;
          message = storedSignature.message;
        }

        localStorage.setItem(
          "signature",
          JSON.stringify({
            message: message,
            signature: signature,
          })
        );

        // Check if we're in the registration flow
        const isRegistrationFlow = window.location.pathname.includes("/onboarding");

        if (isRegistrationFlow) {
          // Just publish the wallet linked event for registration
          PubSub.publish(NomyxEvent.WalletLinked);
          return;
        }

        const result = await signIn("ethereum", {
          signature,
          message,
          redirect: false,
        });

        if (result?.ok) {
          PubSub.publish(NomyxEvent.WalletLinked);
          const urlParams = new URLSearchParams(window.location.search);
          const redirectUrl = urlParams.get("redirect") || "/";
          router.push(redirectUrl);
        } else {
          if (result?.status == 401) {
            toast.error("Login failed. This user is not authorized. Please disconnect and try again.");
          } else {
            toast.error("An authorization error occurred. Please try again later or contact your administrator.");
          }
        }
      }
    },
    onDisconnect: function () {
      setProvider(null);
      setSigner(null);
      localStorage.removeItem("signature");
      PubSub.publish(NomyxEvent.WalletUnlinked);
    },
  });

  return <>{children}</>;
};

const GemforceAppContextProvider: React.FC<AppProps> = (props: AppProps) => {
  const { data: session, status } = useSession();
  const [appState, setAppState] = useState<any>(null);
  const { Component, pageProps } = props;
  const getLayout = (Component as any).getLayout ?? ((page: React.ReactNode) => <MainLayout>{page}</MainLayout>);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { defaultAlgorithm, darkAlgorithm } = theme;
  const algorithm = isDarkMode ? darkAlgorithm : defaultAlgorithm;

  initializeParse();

  useEffect(() => {
    if (status != "loading") {
      const appState = new GemforceAppState(session);
      setAppState(appState);
      appState.session = session;
      if (session?.user?.accessToken) ParseService.setUser(session?.user?.accessToken);
    }
  }, [session, status]);

  let handleLoad = (Component as any).handleLoad;

  if (!handleLoad) {
    PubSub.publish(NomyxEvent.PageLoad);
  }

  PubSub.subscribe(NomyxEvent.WalletUnlinked, () => {
    signOut();
  });

  return (
    <WagmiConfig config={wagmiConfig}>
      <GemforceAppContext.Provider value={{ appState }}>
        <WalletConnectHandler>
          <ConfigProvider
            theme={{
              algorithm,
              components: {
                Layout: {
                  headerBg: isDarkMode ? "#141414" : "#ffffff",
                  colorBgBase: isDarkMode ? "#141414" : "#ffffff",
                  colorBgContainer: isDarkMode ? "#141414" : "#ffffff",
                  siderBg: isDarkMode ? "#141414" : "#ffffff",
                },
                Menu: {
                  activeBarBorderWidth: 0,
                },
              },
            }}
          >
            <AntdRegistry>{getLayout(<Component {...pageProps} />)}</AntdRegistry>
          </ConfigProvider>
        </WalletConnectHandler>
      </GemforceAppContext.Provider>
    </WagmiConfig>
  );
};

export const useGemforceApp = () => React.useContext(GemforceAppContext);

export default GemforceAppContextProvider;
