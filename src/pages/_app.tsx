import "@/styles/globals.scss";
import "@/styles/globals.css";
import { AppProps } from "next/app";
import GemforceAppContextProvider from "@/context/GemforceAppContext";
import React from "react";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const KronosCustomerPortal = (props: AppProps) => {
  const { Component, pageProps } = props;

  return (
    <SessionProvider refetchInterval={0}>
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
