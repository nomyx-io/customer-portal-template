import { useCallback, useEffect } from "react";

import { Checkbox } from "antd";

import { Registration } from "@/utils/Constants";

// @ts-ignore
import platformTerms from "../../../public/legal/platformTerms.html";

interface TermsConditionsProps {
  setActiveTab: (tabKey: string) => void; // Function to set the active tab
  setRegistration: React.Dispatch<React.SetStateAction<Registration>>;
  agreed: boolean; // Get the checkbox state from props
  setAgreed: React.Dispatch<React.SetStateAction<boolean>>; // Function to update the checkbox state
}

const TermsConditions: React.FC<TermsConditionsProps> = ({ setActiveTab, setRegistration, agreed, setAgreed }) => {
  const handleNext = () => {
    setActiveTab("idVerification"); // Switch to ID Verification tab
  };

  const handleBack = () => {
    setActiveTab("about"); // Switch to About Us tab
  };

  const handleAcceptTerms = useCallback(
    (accepted: boolean) => {
      const acceptedDate = accepted ? new Date() : null; // Use the date only if accepted
      setRegistration((prev) => ({
        ...prev,
        termsAccepted: acceptedDate,
      }));
    },
    [setRegistration]
  );

  useEffect(() => {
    handleAcceptTerms(agreed); // Update registration based on agreed state
  }, [agreed, handleAcceptTerms]);

  return (
    <div className="font-poppins relative flex flex-col h-full auth-pages">
      <h2 className="text-2xl font-extrabold text-white text-center">Please review and accept the terms and conditions!</h2>
      <div className="min-h-[60vh] p-4">
        {/* Load external HTML content */}
        <iframe title="HTML Content" srcDoc={platformTerms} width="100%" style={{ border: "none", background: "white", height: "60vh" }} />
      </div>
      <Checkbox
        checked={agreed} // Use the agreed state from props
        onChange={(e) => setAgreed(e.target.checked)} // Update parent state
        className="text-nomyxGray1 mb-4 mt-3"
      >
        I have read and agree to the terms
      </Checkbox>
      {/* Buttons container at the bottom */}
      <div className="flex justify-between mt-auto">
        <button onClick={handleBack} className="text-blue-500 font-semibold">
          Back
        </button>
        {/* Next button positioned at the bottom right */}
        <button
          onClick={handleNext}
          className={`bg-nomyx-main1-light text-white px-4 py-2 rounded ${agreed ? "" : "opacity-50 cursor-not-allowed"}`}
          disabled={!agreed} // Disable the button if not agreed
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TermsConditions;
