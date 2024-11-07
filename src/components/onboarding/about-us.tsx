// AboutUs.tsx
import React from 'react';

// Define the props type for AboutUs
interface AboutUsProps {
  setActiveTab: (tab: string) => void; // Function to change the active tab
}

const AboutUs: React.FC<AboutUsProps> = ({ setActiveTab }) => {
  // Function to handle the button click
  const handleNextClick = () => {
    setActiveTab("terms"); // Set the active tab to "Terms & Conditions"
  };

  return (
    <div className="font-poppins flex justify-center items-center min-h-[75vh] relative px-8 py-8">
      <div className="max-w-[600px] text-center">
        <h2 className="text-2xl font-extrabold text-[#1F1F1F]">
          We&apos;re glad you&apos;re here!
        </h2>
        <p className="text-base mt-4 text-[#1F1F1F]">
          Behavioral finance studies how the psychology of investors or managers
          affects financial decisions and markets and is relevant when making a
          decision that can impact either negatively or positively on one of their
          areas. With more in-depth research into behavioral finance, it is possible
          to bridge what actually happens in financial markets with analysis based
          on financial theory.
        </p>
      </div>
      {/* Next button positioned at the bottom right */}
      <button
        className="absolute bottom-5 right-5 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleNextClick}
      >
        Next
      </button>
    </div>
  );
};

export default AboutUs;
