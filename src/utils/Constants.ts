enum NomyxEvent {
  ClaimTopicAdded = "ClaimTopicAdded",
  ClaimTopicRemoved = "ClaimTopicRemoved",
  TrustedIssuerAdded = "TrustedIssuerAdded",
  TrustedIssuerRemoved = "TrustedIssuerRemoved",
  ClaimTopicsUpdated = "ClaimTopicsUpdated",
  ClaimRequested = "ClaimRequested",
  ClaimAdded = "ClaimAdded",
  ClaimRemoved = "ClaimRemoved",
  IdentityAdded = "IdentityAdded",
  IdentityRemoved = "IdentityRemoved",
  IdentityCountryUpdated = "IdentityCountryUpdated",
  WalletLinked = "WalletLinked",
  WalletUnlinked = "WalletUnlinked",
  GemforceStateChange = "GemforceStateChange",
  PersonaVerified = "PersonaVerified",
  PageLoad = "PageLoad",
  GemforceTableSelectionChange = "GemforceTableSelectionChange",
  GemforceCarouselStart = "GemforceCarouselStart",
}

enum NomyxAction {
  CreateClaimTopic,
  ViewClaimTopic,
  CreateTrustedIssuer,
  RemoveTrustedIssuer,
  UpdateClaimTopics,
  CreateIdentity,
  ViewIdentity,
  RemoveIdentity,
  EditClaims,
}

enum OnboardingStep {
  ABOUT,
  TERMS,
  EMAIL_VERIFICATION,
  ID_VERIFICATION,
  WALLET_SETUP,
  ACTIVATION,
}

enum WalletPreference {
  MANAGED,
  PRIVATE,
}

enum LoginPreference {
  USERNAME_PASSWORD,
  WALLET,
}

enum DataType {
  STRING,
  NUMBER,
  DATE,
}

export type Registration = {
  termsAccepted: Date | null; // Allow null value
  email?: string;
  walletAddress?: string;
  walletId?: string;
  walletPreference?: WalletPreference;
  personaReferenceId?: string;
  username?: string;
  password?: string;
  recoveryKey?: RecoveryKey;
};

export type RecoveryKey = {
  secret: string;
  credentialId: string;
  encryptedPrivateKey: string;
}

export {
  LoginPreference,
  NomyxEvent,
  NomyxAction,
  OnboardingStep,
  WalletPreference,
  DataType,
};

export const DFNS_END_USER_TOKEN_COOKIE = 'dfnsEndUserToken'