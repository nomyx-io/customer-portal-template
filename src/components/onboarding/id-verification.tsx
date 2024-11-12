import React, { useEffect, useState } from "react";

import { Button, Modal } from "antd";
import dynamic from "next/dynamic";
import PubSub from "pubsub-js";
import { toast } from "react-toastify";

import { Registration, NomyxEvent } from "@/utils/Constants";

interface IDVerificationProps {
  setActiveTab: (tabKey: string) => void; // Function to set the active tab
  setRegistration: React.Dispatch<React.SetStateAction<Registration>>;
  registration: Registration;
  onPersonaVerified: (inquiryId: string) => void; // Callback for handling form submission
}

const IDVerification: React.FC<IDVerificationProps> = ({ setActiveTab, setRegistration, registration, onPersonaVerified }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [verificationCompleted, setVerificationCompleted] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const subscription = PubSub.subscribe(NomyxEvent.PersonaVerified, (event, data) => {
      if (data.status === "failed") {
        toast.error("Persona verification failed: " + data?.failure_description);
        console.error("Persona verification failed:", data);
      } else if (data.status === "completed") {
        setRegistration((prev) => ({
          ...prev,
          personaReferenceId: data.inquiryId,
        }));
        onPersonaVerified(data.inquiryId);
        setVerificationCompleted(true);
      }
      setModalVisible(false);
    });
    return () => {
      PubSub.unsubscribe(subscription);
    };
  }, [registration.personaReferenceId, onPersonaVerified, setRegistration]); // Add setRegistration as a dependency

  const handleNext = () => {
    setActiveTab("walletSetup"); // Replace with the actual next tab key
  };

  const handleBack = () => {
    setActiveTab("terms"); // Switch to the Terms & Conditions tab
  };

  const handleKYC = () => {
    setTemplateId(process.env.NEXT_PUBLIC_PERSONA_KYC_TEMPLATEID || "");
    setModalVisible(true); // Open the modal
  };

  const handleKYB = () => {
    setTemplateId(process.env.NEXT_PUBLIC_PERSONA_KYB_TEMPLATEID || "");
    setModalVisible(true); // Open the modal
  };

  const handleModalClose = () => {
    setModalVisible(false); // Close the modal
    setVerificationCompleted(false); // Reset the verification completed state
  };

  const Persona = dynamic(() => import("@/components/Persona"), {
    ssr: false,
  });

  return (
    <div className="font-poppins flex flex-col min-h-[75vh]">
      <div className="flex flex-col justify-center items-center flex-grow">
        {!verificationCompleted && (
          <>
            <h2 className="text-2xl font-extrabold text-[#1F1F1F] text-center">Please verify your identity</h2>
            <p className="text-base mt-4 text-[#1F1F1F] text-center max-w-[600px]">
              We will use Persona to verify your identity. Click the &apos;KYC&apos; button for individual verification and the &apos;KYB&apos; button
              for business verification to proceed!
            </p>
            <div className="flex space-x-4 mt-8">
              <Button type="primary" onClick={handleKYC}>
                KYC
              </Button>
              <Button type="primary" onClick={handleKYB}>
                KYB
              </Button>
            </div>
          </>
        )}
        {verificationCompleted && (
          <>
            <h2 className="text-2xl font-extrabold text-[#1F1F1F] text-center">Your identity is verified!</h2>
            <p className="text-base mt-4 text-[#1F1F1F] text-center max-w-[600px]">Proceed to the next step.</p>
          </>
        )}
      </div>
      <Modal
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={950}
        className="!p-0 id-verification-modal"
        style={{
          maxWidth: "90%", // Makes modal responsive on smaller screens
          margin: "0 auto",
          height: "750px", // Set fixed height
          overflowY: "auto", // Allow vertical scrolling if content exceeds height
        }}
        maskClosable={false}
      >
        <div className="p-4">
          {/* Render the Persona component inside the modal */}
          {templateId && <Persona templateId={templateId} />}
        </div>
      </Modal>

      {/* Buttons container at the bottom */}
      <div className="flex justify-between p-4 mt-auto">
        <button onClick={handleBack} className="text-blue-500">
          Back
        </button>
        <button onClick={handleNext} className="bg-blue-500 text-white px-4 py-2 rounded" disabled={!verificationCompleted}>
          Next
        </button>
      </div>
    </div>
  );
};

export default IDVerification;
