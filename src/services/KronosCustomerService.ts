import { WebAuthnSigner } from "@dfns/sdk-browser";
import { formatUnits } from "ethers";
import Parse from "parse";

import ParseService from "./ParseService";
import { base64url } from "@/utils/base64url";
import { createRecoveryCredential, KeyClientData, signRecoveryCredentials, validateRecoveryKey } from "@/utils/dfnsRecoveryKey";


class KronosCustomerService {
  private static _instance: KronosCustomerService;

  public static get instance(): KronosCustomerService {
    if (!KronosCustomerService._instance) {
      KronosCustomerService._instance = new KronosCustomerService();
    }
    return KronosCustomerService._instance;
  }

  public async getInitialState() {
    // const customer = await ParseClient.getCustomerData();
    // return customer;
  }

  public async getProjects() {
    let records = await ParseService.getRecords("TokenProject", [], [], ["*"]);
    return records;
  }

  public async getProjectsByIds(projectIds: string[]) {
    let records = await ParseService.getRecords("TokenProject", ["objectId"], [projectIds], ["*"]);
    return records || [];
  }

  public async getTokensForUser(address: string) {
    const lowerCaseAddress = address.toLocaleLowerCase();
    let records = await ParseService.getRecords("Token", ["owner"], [lowerCaseAddress], ["*"]);
    let sanitizedRecords: any[] = [];

    if (records && records.length > 0) {
      sanitizedRecords = JSON.parse(JSON.stringify(records));
      sanitizedRecords = sanitizedRecords.map((t: any) => {
        const price = parseFloat(t.price);
        const existingCredits = parseFloat(t.existingCredits);
        const totalPrice = price * existingCredits;
        return {
          ...t,
          totalPrice,
        };
      });
    }

    const projectIds = sanitizedRecords.reduce((uniqueIds: any[], record: any) => {
      if (!uniqueIds.includes(record.projectId)) {
        uniqueIds.push(record.projectId);
      }
      return uniqueIds;
    }, []);

    const projects = await ParseService.getRecords("TokenProject", ["objectId"], [projectIds], []);
    // Create a map of projectId to projectName for quick lookup
    const projectMap: { [key: string]: string } = {};
    projects?.forEach((project: any) => {
      projectMap[project.id] = project.get("title");
    });
    sanitizedRecords = sanitizedRecords.map((t: any, index: number) => {
      t.projectName = projectMap[t.projectId] || "Project 1";
      return t;
    });
    return sanitizedRecords;
  }

  public async getDepositsForToken(tokenId: string) {
    const pointer = {
      __type: "Pointer",
      className: "Token",
      objectId: tokenId,
    };

    let records = await ParseService.getRecords("TokenDeposit", ["token"], [pointer], ["*"]);
    let sanitizedRecords = [];

    if (records && records.length > 0) {
      sanitizedRecords = JSON.parse(JSON.stringify(records));
      sanitizedRecords.forEach((r: any) => {
        r.amount = formatUnits(String(r.amount), 6);
      });
    }

    return sanitizedRecords;
  }

  public async getWithdrawals(tokenIds: string[]) {
    const pointers = tokenIds.map((tokenId) => {
      return {
        __type: "Pointer",
        className: "Token",
        objectId: tokenId,
      };
    });

    let records = await ParseService.getRecords("TokenWithdrawal", ["token"], [pointers], ["*"]);
    let sanitizedRecords = [];

    if (records && records.length > 0) {
      sanitizedRecords = JSON.parse(JSON.stringify(records || []));
      sanitizedRecords.forEach((r: any) => {
        r.amount = formatUnits(String(r.amount), 6);
      });
    }
    return sanitizedRecords;
  }

  public async getWithdrawalsForToken(tokenId: string) {
    const pointer = {
      __type: "Pointer",
      className: "Token",
      objectId: tokenId,
    };

    let records = await ParseService.getRecords("TokenWithdrawal", ["token"], [pointer], ["*"]);
    let sanitizedRecords = [];

    if (records && records.length > 0) {
      sanitizedRecords = JSON.parse(JSON.stringify(records));
      sanitizedRecords.forEach((r: any) => {
        r.amount = formatUnits(String(r.amount), 6);
      });
    }
    return sanitizedRecords;
  }

  public async getRetiredTokensForUser(address: string) {
    const tokens = await this.getTokensForUser(address);
    const tokenIds = tokens.map((t: any) => t.tokenId);
    const retiredTokens = await ParseService.getRecords("CarbonCreditsRetired__e", ["tokenId"], [tokenIds], ["*"]);

    const retiredTokenIds = retiredTokens?.map((t: any) => t.attributes.tokenId);

    const filteredTokens = tokens?.filter((t: any) => retiredTokenIds?.includes(t.tokenId));

    return filteredTokens || [];
  }

  public async getPortfolioPerformance(walletAddress: string) {
    let records = await ParseService.getRecords("CustomerPortfolioSnapshot", ["customerAddress"], [walletAddress], ["*"]);
    let sanitizedRecords = [];

    if (records && records.length > 0) {
      sanitizedRecords = JSON.parse(JSON.stringify(records || []));
      sanitizedRecords.forEach((r: any) => {
        r.timestamp = new Date(r.timestamp.iso);
      });
    }

    return sanitizedRecords;
  }

  /**
   * get the customer visible events for the user
   * @param user
   */
  public async getCustomerEvents(address: string) {
    //fixme: filter by customer id!!!
    // ERC721ATransfer(recipient or sender onlu),
    // ClaimsSet (my claims only),
    // TreasuryDeposited (my tokens only) ,
    // LlMinted (my tokens only)
    // IdentityCreated
    // IdentityAdded
    const eventTypes = ["CarbonCreditsRetired", "ERC721ATransfer", "Sales"];
    const myTokens = (await this.getTokensForUser(address)).map((t: any) => t.tokenId);

    let records = await ParseService.getRecords(
      "Event",
      ["event", "tokenId"],
      [eventTypes, myTokens],
      ["*"],
      undefined,
      undefined,
      undefined,
      "desc"
    );
    let sanitizedRecords = [];

    if (records && records.length > 0) {
      sanitizedRecords = JSON.parse(JSON.stringify(records || []));
    }

    return sanitizedRecords;
  }

  /**
   *
   * @param registration
   */
  public async submitRegistration(registration: any) {
    // Ensure username is set
    registration.username = registration.username || registration.email;

    try {
      // Create the user
      const user = await ParseService.createUser(registration);

      // Set public ACL and save the user
      await ParseService.setPublicAcl(user);

      return user;
    } catch (error) {
      // Handle error
      console.error("Error during registration:", error);
      throw error;
    }
  }

  // /**
  //  *
  //  * @param amount
  //  * @param tokenId
  //  * @param walletAddress
  //  */
  // public async makeDeposit(
  //   amount: string,
  //   tokenId: string,
  //   walletAddress: string
  // ) {
  //   return await Parse.Cloud.run("depositToTreasury", {
  //     params: {
  //       amount: Number(amount),
  //       tokenId: Number(tokenId),
  //       vaultAccountId: walletAddress,
  //     },
  //   });
  // }

  public async getListings() {
    const records = await ParseService.getRecords("TokenListing", ["sold"], [false], ["*"], undefined, undefined, undefined, "desc");
    let sanitizedRecords = [];

    if (records && records.length > 0) {
      sanitizedRecords = JSON.parse(JSON.stringify(records || []));
    }

    const projectIds = sanitizedRecords.reduce((uniqueIds: any[], record: any) => {
      if (!uniqueIds.includes(record.token?.projectId)) {
        uniqueIds.push(record.token?.projectId);
      }
      return uniqueIds;
    }, []);

    const projects = await ParseService.getRecords("TokenProject", ["objectId"], [projectIds], []);
    // Create a map of projectId to projectName for quick lookup
    const projectMap: { [key: string]: string } = {};
    projects?.forEach((project: any) => {
      projectMap[project.id] = project.get("title");
    });
    sanitizedRecords = sanitizedRecords.map((t: any, index: number) => {
      if (t.token) {
        t.token["projectName"] = projectMap[t.token?.projectId] || "Project 1";
      }
      return t;
    });

    return sanitizedRecords;
  }

  /**
   *
   * @param walletAddress
   */

  public async getSales(walletAddress: string) {
    const records = await ParseService.getRecords("TokenSale", [], [], ["*"], undefined, undefined, undefined, "desc");
    let sanitizedRecords = [];

    if (records && records.length > 0) {
      sanitizedRecords = JSON.parse(JSON.stringify(records || []));
    }

    return sanitizedRecords;
  }

  public async getTokenActivity(objectId: string[]) {
    const pointers = objectId.map((objectId) => {
      return {
        __type: "Pointer",
        className: "Token",
        objectId: objectId,
      };
    });

    let records = await ParseService.getRecords("Event", ["tokens"], [pointers], ["*"]);

    let sanitizedRecords = [];

    if (records && records.length > 0) {
      sanitizedRecords = JSON.parse(JSON.stringify(records));
      sanitizedRecords.forEach((r: any) => {
        if (typeof r.amount !== "undefined") {
          r.amount = formatUnits(String(r.amount), 6);
        }
      });
    }
    return sanitizedRecords;
  }

  public async getRedemptionHistory(tokenId: number[]) {
    const records = await ParseService.getRecords("CarbonCreditsRetired__e", ["tokenId"], [tokenId], ["*"]);
    let sanitizedRecords = [];
    if (records && records.length > 0) {
      sanitizedRecords = JSON.parse(JSON.stringify(records || []));
    }
    return sanitizedRecords;
  }

  public async getAllRedemptionHistoryToken() {
    const records = await ParseService.getRecords("CarbonCreditsRetired__e", [], [], ["tokenId"]);
    // Extracting only the tokenId from each record using the get() method
    const sanitizedRecords = records?.map((record) => record.get("tokenId"));
    return sanitizedRecords;
  }

  public async initiateDfnsRegistration(username: string) {
    if (!username) {
      throw new Error("Username is required for registration.");
    }

    try {
      // Use Parse.Cloud.run to call registerInit
      const challenge = await Parse.Cloud.run("registerInit", { username });
      console.log("Received registration challenge:", challenge);

      return { challenge, error: null };
    } catch (error: any) {
      console.error("Error initiating registration:", error);
      return { challenge: null, error: error.message };
    }
  }

  public async completeDfnsRegistration(pendingRegistrationChallenge: any, windowOrigin: string) {
    if (!pendingRegistrationChallenge) {
      throw new Error("No pending registration challenge found.");
    }

    try {
      const webauthn = new WebAuthnSigner();
      const attestation = await webauthn.create(pendingRegistrationChallenge);

      const clientData: KeyClientData = {
        type: "key.create",
        challenge: base64url(pendingRegistrationChallenge.challenge),
        origin: windowOrigin,
        crossOrigin: false,
      };

      console.log("Client Data: ", clientData);

      // Create a recovery key credential
      const newRecoveryKey = await createRecoveryCredential(clientData, pendingRegistrationChallenge.user.name);

      console.log("New Recovery Key:", newRecoveryKey);

      // Use Parse.Cloud.run to call registerComplete
      const registration = await Parse.Cloud.run("registerComplete", {
        temporaryAuthenticationToken: pendingRegistrationChallenge.temporaryAuthenticationToken,
        signedChallenge: {
          firstFactorCredential: attestation,
          recoveryCredential: newRecoveryKey.credential,
        },
      });

      console.log("Registration complete:", registration);

      return {
        registration,
        recoveryKey: {
          secret: newRecoveryKey.recoveryKey.secret,
          credentialId: newRecoveryKey.recoveryKey.credentialId,
          encryptedPrivateKey: newRecoveryKey.credential.encryptedPrivateKey ?? "",
        },
        error: null,
      };
    } catch (error: any) {
      console.error("Error completing registration:", error);
      return { registration: null, recoveryKey: null, error: error.message };
    }
  }

  public async getUsdcBalance(walletId: string, dfns_token: string) {
    if (!walletId) {
      throw new Error("Wallet ID is required to get USDC balance.");
    }

    try {
      const balance = await Parse.Cloud.run("dfnsGetUSDC", {
        walletId,
        dfns_token,
      });

      return { balance, error: null };
    } catch (error: any) {
      console.error("Error getting USDC balance:", error);
      return { balance: null, error: error.message };
    }
  }

  // Dfns Token purchase methods

  public async initiateApproval(walletId: string, price: string, dfnsToken: string) {
    if (!walletId || !price || !dfnsToken) {
      throw new Error("Missing required parameters for approval.");
    }
    console.log("price", price);

    try {
      const initiateResponse = await Parse.Cloud.run("dfnsInitApproval", {
        price,
        walletId,
        dfns_token: dfnsToken,
      });
      console.log("Pending approval request:", initiateResponse);

      return { initiateResponse, error: null };
    } catch (error: any) {
      console.error("Error initiating approval:", error);
      return { initiateResponse: null, error: error.message };
    }
  }

  public async completeApproval(walletId: string, dfnsToken: string, challenge: any, requestBody: any) {
    if (!walletId || !dfnsToken || !challenge || !requestBody) {
      throw new Error("Missing required parameters for completing approval.");
    }

    try {
      const webauthn = new WebAuthnSigner();
      const assertion = await webauthn.sign(challenge);

      const completeResponse = await Parse.Cloud.run("dfnsCompleteApproval", {
        walletId,
        dfns_token: dfnsToken,
        signedChallenge: {
          challengeIdentifier: challenge.challengeIdentifier,
          firstFactor: assertion,
        },
        requestBody,
      });
      console.log("Approval complete:", completeResponse);

      return { completeResponse, error: null };
    } catch (error: any) {
      console.error("Error completing approval:", error);
      return { completeResponse: null, error: error.message };
    }
  }

  public async initiatePurchase(walletId: string, tokenId: string, dfnsToken: string) {
    if (!walletId || !tokenId || !dfnsToken) {
      throw new Error("Missing required parameters for purchase.");
    }

    try {
      const initiateResponse = await Parse.Cloud.run("dfnsInitiatePurchase", {
        tokenId,
        walletId,
        dfns_token: dfnsToken,
      });
      console.log("Pending purchase request:", initiateResponse);

      return { initiateResponse, error: null };
    } catch (error: any) {
      console.error("Error initiating purchase:", error);
      return { initiateResponse: null, error: error.message };
    }
  }

  public async completePurchase(walletId: string, dfnsToken: string, challenge: any, requestBody: any) {
    if (!walletId || !dfnsToken || !challenge || !requestBody) {
      throw new Error("Missing required parameters for completing purchase.");
    }

    try {
      const webauthn = new WebAuthnSigner();
      const assertion = await webauthn.sign(challenge);

      const completeResponse = await Parse.Cloud.run("dfnsCompletePurchase", {
        walletId,
        dfns_token: dfnsToken,
        signedChallenge: {
          challengeIdentifier: challenge.challengeIdentifier,
          firstFactor: assertion,
        },
        requestBody,
      });

      return { completeResponse, error: null };
    } catch (error: any) {
      console.error("Error completing purchase:", error);
      return { completeResponse: null, error: error.message };
    }
  }

  public async initiateRetire(walletId: string, tokenId: string, amount: string, dfnsToken: string) {
    if (!walletId || !tokenId || !amount || !dfnsToken) {
      throw new Error("Missing required parameters for retirement.");
    }

    try {
      const initiateResponse = await Parse.Cloud.run("dfnsInitRetireCredits", {
        walletId,
        tokenId,
        amount,
        dfns_token: dfnsToken,
      });

      console.log("Retirement initiation response:", initiateResponse);

      return { initiateResponse, error: null };
    } catch (error: any) {
      console.error("Error initiating retirement:", error);
      return { initiateResponse: null, error: error.message };
    }
  }

  public async completeRetire(walletId: string, dfnsToken: string, challenge: any, requestBody: any) {
    if (!walletId || !dfnsToken || !challenge || !requestBody) {
      throw new Error("Missing required parameters for completing retirement.");
    }

    try {
      const webauthn = new WebAuthnSigner();
      const assertion = await webauthn.sign(challenge);

      const completeResponse = await Parse.Cloud.run("dfnsCompleteRetireCredits", {
        walletId,
        dfns_token: dfnsToken,
        signedChallenge: {
          challengeIdentifier: challenge.challengeIdentifier,
          firstFactor: assertion,
        },
        requestBody,
      });

      console.log("Retirement completed:", completeResponse);

      return { completeResponse, error: null };
    } catch (error: any) {
      console.error("Error completing retirement:", error);
      return { completeResponse: null, error: error.message };
    }
  }

  public async transferUSDC(walletId: string, dfnsToken: string, recipient: string, amount: string) {
    if (!walletId || !dfnsToken || !recipient || !amount) {
      throw new Error("Missing required parameters for USDC transfer.");
    }

    try {
      // Step 1: Initiate the USDC transfer by calling dfnsInitTransferUSDC
      const { challenge, requestBody } = await Parse.Cloud.run("dfnsInitTransferUSDC", {
        walletId,
        dfns_token: dfnsToken,
        recipient,
        amount,
      });

      console.log("Transfer initiation successful. Challenge:", challenge);

      // Step 2: Sign the challenge using WebAuthn
      const webauthn = new WebAuthnSigner();
      const assertion = await webauthn.sign(challenge);

      console.log("Challenge signed successfully.");

      // Step 3: Complete the transfer by calling dfnsCompleteTransferUSDC
      const { transactionHash, broadcastResponse } = await Parse.Cloud.run("dfnsCompleteTransferUSDC", {
        walletId,
        dfns_token: dfnsToken,
        signedChallenge: {
          challengeIdentifier: challenge.challengeIdentifier,
          firstFactor: assertion,
        },
        requestBody,
      });

      console.log("USDC transfer completed successfully. Transaction Hash:", transactionHash);

      // Step 4: Return the transaction details
      return {
        message: "USDC transfer completed successfully",
        transactionHash,
        broadcastResponse,
      };
    } catch (error: any) {
      console.error("Error during USDC transfer:", error);
      throw new Error(`USDC transfer failed: ${error.message || error}`);
    }
  }

  // Dfns key recovery

  public async initiateRecovery(username: string, storedRecoveryKey: { credentialId: string }) {
    if (!username) {
      throw new Error("Username is required for recovery");
    }
    // Ensure that the stored recovery key is available
    if (!storedRecoveryKey || !storedRecoveryKey.credentialId) {
      throw new Error("Recovery key information is missing or could not be retrieved.");
    }
    try {
      // Call Parse.Cloud.run to initiate recovery
      const recoveryChallenge = await Parse.Cloud.run("recoverInit", {
        username,
        credentialId: storedRecoveryKey.credentialId,
      });

      return {
        recoveryChallenge,
        tempAuthToken: recoveryChallenge.temporaryAuthenticationToken,
        recoveryKey: storedRecoveryKey,
        error: null,
      };
    } catch (error: any) {
      console.error("Error initiating recovery:", error);
      return {
        recoveryChallenge: null,
        error: error.message,
      };
    }
  }

  public async completeRecovery(pendingRecoveryRequest: any, storedRecoveryKey: any) {
    if (!pendingRecoveryRequest) {
      throw new Error("No pending recovery request. Please initiate the recovery first.");
    }
    // Extract required data for recovery
    const username = pendingRecoveryRequest.username;
    if (!username) {
      throw new Error("Username is missing in the pending recovery request.");
    }
    const recoveryKeySecret = storedRecoveryKey?.secret;
    const credentialId = storedRecoveryKey?.credentialId;
    const encryptedRecoveryKey = pendingRecoveryRequest?.allowedRecoveryCredentials[0]?.encryptedRecoveryKey;

    if (!recoveryKeySecret || !credentialId || !encryptedRecoveryKey) {
      throw new Error("Recovery key data is missing or invalid");
    }
    try {
      // Step 1: Validate the recovery key
      await validateRecoveryKey(username, {
        recoveryKey: recoveryKeySecret,
        credentialId,
        encryptedKey: encryptedRecoveryKey,
      });

      // Step 2: Create the new recovery key before creating new credentials
      const clientData: KeyClientData = {
        type: "key.create",
        challenge: base64url(pendingRecoveryRequest.challenge),
        origin: window.location.origin,
        crossOrigin: false,
      };
      const newRecoveryKey = await createRecoveryCredential(clientData, username);
      // Step 3: Generate new attestation using WebAuthnSigner
      const webauthn = new WebAuthnSigner();
      const attestation = await webauthn.create(pendingRecoveryRequest);

      // Step 4: Form the new credentials package
      const newCredentials = {
        firstFactorCredential: attestation,
        recoveryCredential: newRecoveryKey.credential,
      };

      // Step 5: Sign the new credentials with the old recovery credential
      const signedRecoveryPackage = await signRecoveryCredentials(
        username,
        {
          recoveryKey: recoveryKeySecret,
          credentialId,
          encryptedKey: encryptedRecoveryKey,
        },
        newCredentials
      );
      // Step 6: Use Parse.Cloud.run to complete recovery
      const completeResponse = await Parse.Cloud.run("recoverComplete", {
        tempAuthToken: pendingRecoveryRequest.tempAuthToken,
        newCredentials,
        signedRecoveryPackage,
      });

      // Step 7: Return the new stored recovery key
      return {
        newStoredRecoveryKey: {
          secret: newRecoveryKey.recoveryKey.secret,
          credentialId: newRecoveryKey.recoveryKey.credentialId,
          encryptedPrivateKey: newRecoveryKey.credential.encryptedPrivateKey ?? "",
        },
        completeResponse,
        error: null,
      };
    } catch (error: any) {
      console.error("Error completing recovery:", error);
      return {
        completeResponse: null,
        error: error.message,
      };
    }
  }

  public async checkUserOnboarding(email: string) {
    if (!email) {
      throw new Error("Email is required to check onboarding status.");
    }
    try {
      // Use Parse.Cloud.run to call isUserOnboarded
      const response = await Parse.Cloud.run("isUserOnboarded", { email });
      const isOnboarded = response?.result;
      return { isOnboarded, error: null };
    } catch (error: any) {
      console.error("Error checking user onboarding status:", error);
      return { isOnboarded: null, error: error.message };
    }
  }
}

export default KronosCustomerService.instance;
