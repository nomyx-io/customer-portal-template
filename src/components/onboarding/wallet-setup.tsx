import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { Radio } from "antd/es"; // Importing only what you need
import PubSub from "pubsub-js"; // Ensure you have PubSub imported
import {
  NomyxEvent,
  Registration,
  WalletPreference,
  RecoveryKey,
} from "@/utils/Constants";
import KronosCustomerService from "@/services/KronosCustomerService";
import { toast } from "react-toastify";
import GenerateUserRecoveryKit, {
  UserRecoveryKitRef,
} from "./GenerateUserRecoveryKit";

interface WalletSetupProps {
  setActiveTab: (tabKey: string) => void; // Function to set the active tab
  setRegistration: React.Dispatch<React.SetStateAction<Registration>>;
  onSubmit: () => void; // Callback for handling form submission
  email?: string;
}

const WalletSetup: React.FC<WalletSetupProps> = ({
  setActiveTab,
  setRegistration,
  onSubmit,
  email,
}) => {
  const [walletPreference, setWalletPreference] = useState<WalletPreference>(
    WalletPreference.MANAGED
  ); // Local state for wallet preference
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [dfnsWalletAddress, setDfnsWalletAddress] = useState<string | null>(
    null
  );
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const ethereumAccount = useAccount();

  useEffect(() => {
    // Initialize registration wallet preference when component loads
    setRegistration((prev) => ({
      ...prev,
      walletPreference: WalletPreference.MANAGED, // Default preference on load
    }));
  }, [setRegistration]);

  useEffect(() => {
    if (ethereumAccount.address) {
      setWalletAddress(ethereumAccount.address);
    }
    const subscription = PubSub.subscribe(NomyxEvent.WalletLinked, async () => {
      const walletAddress = ethereumAccount.address; // Fetch wallet address
      if (walletAddress) {
        setRegistration((prev) => ({
          ...prev,
          walletAddress,
          //username: walletAddress,
          //password: walletAddress,
        }));
      }
    });
    return () => {
      PubSub.unsubscribe(subscription); // Clean up the subscription
    };
  }, [ethereumAccount.address, walletPreference, setRegistration]);

  const handleBack = () => {
    setActiveTab("idVerification"); // Set to the previous tab key
  };

  const handleNext = () => {
    onSubmit(); // Call the submission handler
  };

  const handleWalletPreferenceChange = (value: WalletPreference) => {
    setWalletPreference(value); // Update local state
    setRegistration((prev) => ({
      ...prev,
      walletPreference: value, // Update registration with the new preference
    }));
  };

  const isNextButtonDisabled = () => {
    if (walletPreference === WalletPreference.PRIVATE) {
      return !walletAddress; // Disabled if PRIVATE and walletAddress is not available
    }
    if (walletPreference === WalletPreference.MANAGED) {
      return !dfnsWalletAddress;
    }
  };

  const dfnsRegistration = async () => {
    const { challenge, error } =
      await KronosCustomerService.initiateDfnsRegistration(email || "");
    if (error) {
      toast.error(error);
    } else {
      const { registration, recoveryKey, error } =
        await KronosCustomerService.completeDfnsRegistration(
          challenge,
          window.location.origin
        );

      if (error) {
        toast.error(error);
      } else {
        setDfnsWalletAddress(registration.wallets[0].address);
        setRegistration((prev) => ({
          ...prev,
          walletAddress: registration.wallets[0].address,
          walletId: registration.wallets[0].id,
          recoveryKey: recoveryKey || undefined,
        }));
        setCredentialId(recoveryKey?.credentialId || null);
        setSecret(recoveryKey?.secret || null);
      }
    }
  };

  // Create a ref to hold the UserRecoveryKit instance
  const userRecoveryKitRef = useRef<UserRecoveryKitRef | null>(null);

  // Function to handle PDF download
  const handleDownloadRecoveryFile = () => {
    if (userRecoveryKitRef.current) {
      userRecoveryKitRef.current.generatePDF(); // Call the PDF generation function
    }
  };

  return (
    <div className="font-poppins flex flex-col min-h-[75vh]">
      <div className="flex flex-col justify-center items-center flex-grow">
        <h2 className="text-2xl font-extrabold text-[#1F1F1F] text-center">
          Let&apos;s Create Your Wallet
        </h2>
        <p className="text-base mt-4 text-[#1F1F1F] text-center max-w-[600px]">
          A wallet will be created for you and linked to your <br />
          <b>{email}</b>
        </p>

        <div className="mt-5 mb-5 wallet-setup-radio-group">
          <Radio.Group
            value={walletPreference} // Set the value from local state
            buttonStyle="solid"
            onChange={(e) =>
              handleWalletPreferenceChange(e.target.value as WalletPreference)
            } // Handle change
          >
            <Radio.Button value={WalletPreference.MANAGED}>
              Create your Wallet
            </Radio.Button>
            <Radio.Button value={WalletPreference.PRIVATE}>
              Connect your Wallet
            </Radio.Button>
          </Radio.Group>
        </div>

        {walletPreference === WalletPreference.MANAGED && (
          <div className="text-center mt-5">
            {!dfnsWalletAddress ? (
              <button
                onClick={dfnsRegistration}
                className="bg-[#47a1ff] text-white px-4 py-2 rounded-full font-bold"
              >
                Create Wallet
              </button>
            ) : (
              <>
                <p className="text-base mt-4 text-[#1F1F1F]">
                  Your wallet has been successfully created, and your signature
                  saved.
                </p>
                <p className="text-base mt-6 text-[#1F1F1F]">
                  Your recovery file has been generated. Please print
                  and store it in a safe place. This file is essential for
                  recovering your account in the event of any issues. Do not
                  share it with anyone
                </p>
                <GenerateUserRecoveryKit
                  ref={userRecoveryKitRef} // Pass the ref to the child component
                  username={email || ""}
                  credentialId={credentialId || ""}
                  secret={secret || ""}
                />
                <button
                  onClick={handleDownloadRecoveryFile} // Call the download handler
                  className="bg-blue-500 text-white px-4 py-2 mt-4 rounded"
                >
                  Print
                </button>
              </>
            )}
          </div>
        )}

        {walletPreference === WalletPreference.PRIVATE && (
          <div className="connect-wallet">
            <w3m-button /> {/* Ensure this is your wallet connection button */}
          </div>
        )}
      </div>

      {/* Buttons container at the bottom */}
      <div className="flex justify-between p-4 mt-auto">
        <button onClick={handleBack} className="text-blue-500">
          Back
        </button>
        <button
          onClick={handleNext}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={isNextButtonDisabled()} // Disable condition based on preference
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default WalletSetup;
