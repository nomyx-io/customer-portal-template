import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Extend the default Session interface to include `objectId`.
   */

  interface Session {
    user: User;
    expires: string;
  }

  interface User extends CustomUser { }
}

interface CustomUser {
  roles: string[];
  username: string;
  accessToken: string;
  walletAddress: string;
  accType: string;
  createdAt: string;
  updatedAt: string;
  company: string;
  walletPreference: number;
  ACL: any;
  objectId: string;
  iat: number;
  exp: number;
  jti: string;
}




