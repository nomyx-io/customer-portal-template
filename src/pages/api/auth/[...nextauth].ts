import NextAuth, { AuthOptions } from "next-auth";

import { StandardCredentials, EthereumCredentials } from "@/auth/Credentials";

const providers = [StandardCredentials, EthereumCredentials];

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },
  jwt: {
    maxAge: 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }: any) {
      console.log("next-auth signIn!");
      return true;
    },
    async jwt({ token, user, account, profile }: any) {
      // return token;
      console.log("next-auth jwt!");

      if (user) {
        // User exists → First login or sign-in → Set fresh expiration & return user details
        return { ...token, ...user, exp: Math.floor(Date.now() / 1000) + 60 * 60 };
      }

      if (!token.exp) {
        // Ensure exp is always set in case of unexpected behavior
        token.exp = Math.floor(Date.now() / 1000) + 60 * 60;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (!token?.exp) {
        console.warn("⚠️ Warning: No expiration found. Assuming session is still valid.");
        return session; // Keep session alive if expiration is missing
      }

      if (Date.now() >= token.exp * 1000) {
        return null; // Force logout if expired
      }

      session.user = token;
      session.expires = new Date(token.exp * 1000).toISOString();

      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
} satisfies AuthOptions;

export default async function auth(req: any, res: any) {
  return await NextAuth(req, res, authOptions);
}
