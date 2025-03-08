import "@/styles/globals.scss";
import "@/styles/globals.css";

import React, { useEffect } from "react";

import { AppProps } from "next/app";
import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ToastContainer } from "react-toastify";

import AutoLogout from "@/components/AutoLogout";
import GemforceAppContextProvider from "@/context/GemforceAppContext";
import "react-toastify/dist/ReactToastify.css";

const KronosCustomerPortal = (props: AppProps) => {
  const { Component, pageProps } = props;

  return (
    <SessionProvider refetchInterval={0}>
      <AutoLogout />
      <NextThemesProvider attribute="class">
        <ToastContainer />
        <GemforceAppContextProvider {...props}>
          <Component {...props} />
        </GemforceAppContextProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
};

export default KronosCustomerPortal;
