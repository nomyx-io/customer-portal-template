// pages/api/updatePersonaReferenceId.ts

import { NextApiRequest, NextApiResponse } from "next";
import Parse from "parse/node";

// Initialize Parse
Parse.initialize(process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID || "", process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY);
Parse.serverURL = `${process.env.NEXT_PUBLIC_PARSE_SERVER_URL}/parse`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, inquiryId } = req.body;

  if (!email || !inquiryId) {
    return res.status(400).json({ message: "Invalid data" });
  }

  try {
    const secretKey = process.env.AUTH_SECRET_KEY; // Server-side access only

    // Update user by email using Parse Cloud function, including recoveryKey
    const response = await Parse.Cloud.run("updateUserByEmail", {
      email,
      updates: { personaReferenceId: inquiryId },
      secretKey,
    });

    // Check for expected response structure and handle errors properly
    if (response?.message) {
      return res.status(200).json({
        message: "Persona Reference ID updated successfully",
        data: response, // Pass the response data back to the client
      });
    } else {
      return res.status(500).json({ message: response?.error || "Failed to update persona reference ID" });
    }
  } catch (error: any) {
    console.error("Error in updatePersonaReferenceId:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
