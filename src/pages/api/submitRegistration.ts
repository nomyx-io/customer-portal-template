// pages/api/submitRegistration.ts

import { NextApiRequest, NextApiResponse } from "next";
import Parse from "parse/node";

import { WalletPreference } from "@/utils/Constants";

// Initialize Parse
Parse.initialize(process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID || "", process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY);
Parse.serverURL = `${process.env.NEXT_PUBLIC_PARSE_SERVER_URL}/parse`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, registration, recoveryKey } = req.body;

  if (!email || !registration) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Check if recoveryKey is required based on wallet preference
  if (registration.walletPreference === WalletPreference.MANAGED && !recoveryKey) {
    return res.status(400).json({ message: "Recovery key required for managed wallets" });
  }

  try {
    const secretKey = process.env.AUTH_SECRET_KEY;

    // Update user by email using Parse Cloud function
    const response = await Parse.Cloud.run("updateUserByEmail", {
      email,
      updates: registration,
      secretKey,
      recoveryKey: recoveryKey || null, // Pass null if no recovery key
    });

    if (response?.message) {
      return res.status(200).json({
        message: "User onboarded successfully",
        data: response,
      });
    } else {
      return res.status(500).json({ message: response?.error || "Failed to onboard user" });
    }
  } catch (error: any) {
    console.error("Error in submitRegistration:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
