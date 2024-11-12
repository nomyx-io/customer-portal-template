import CredentialsProvider from "next-auth/providers/credentials";

const EthereumCredentials = CredentialsProvider({
  id: "ethereum",
  name: "Ethereum",
  credentials: {
    message: { label: "Message", type: "password" },
    signature: { label: "Signature", type: "password" },
  },
  async authorize(credentials, req) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_PARSE_SERVER_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: { "Content-Type": "application/json" },
    });

    const response = await res.json();
    const { personaVerificationData, ...userWithoutPersonaData } = response.user; // Exclude personaVerificationData

    if (res.ok && userWithoutPersonaData) {
      return { ...userWithoutPersonaData, accessToken: response.access_token };
    }

    return null;
  },
});

const StandardCredentials = CredentialsProvider({
  id: "standard",
  name: "Standard",
  credentials: {
    email: { label: "Email", type: "email", placeholder: "Enter your email." },
    password: { label: "Password", type: "password", placeholder: "Enter your password." },
  },
  async authorize(credentials, req) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PARSE_SERVER_URL}/auth/login`, {
        method: "POST",
        body: JSON.stringify(credentials),
        headers: { "Content-Type": "application/json" },
      });
      const response = await res.json();

      const { personaVerificationData, ...userWithoutPersonaData } = response.user; // Exclude personaVerificationData

      if (res.ok && userWithoutPersonaData) {
        return {
          ...userWithoutPersonaData,
          accessToken: response.access_token,
          dfns_token: response.dfns_token,
        };
      }

      return null;
    } catch (error) {
      console.error("Error during Standard login:", error);
      return null;
    }
  },
});

export { EthereumCredentials, StandardCredentials };
