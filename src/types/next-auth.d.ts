import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Extend the default Session interface to include `objectId`.
   */

  interface Session {
    user: User;
    expires: string;
  }

  interface User extends CustomUser {}
}

interface CustomUser {
  accessToken: string;
  ACL: any;
  bridgeCustomerId: string;
  company: string;
  createdAt: string;
  dfns_token: string;
  email: string;
  emailVerified: boolean;
  exp: number;
  firstName: string;
  iat: number;
  jti: string;
  kycId: string;
  lastName: string;
  objectId: string;
  pendingApproval: boolean;
  personalReferenceId: string;
  roles: string[];
  signedAgreementId: string;
  tempToken: string;
  termsAccepted: any;
  tokenExpiration: string;
  updatedAt: string;
  username: string;
  walletAddress: string;
  walletId: string;
  walletPreference: number;
}
