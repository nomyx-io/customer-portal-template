import React from "react";

interface ConfirmMessageProps {
  email: string;
}

const ConfirmMessage: React.FC<ConfirmMessageProps> = ({ email }) => {
  return (
    <div
      className="relative w-full h-[90vh] flex items-center justify-center bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage: "url('/images/nomyx_banner.svg')",
      }}
    >
      <div className="bg-[#3E81C833] bg-opacity-80 rounded-md shadow-lg p-16 text-center w-1/2">
        {/* Header */}
        <h1 className="text-2xl font-bold text-black mb-4">Check Your Email!</h1>
        {/* Paragraph */}
        <p className="text-black">
          We have sent an email to <b>{email}</b> with a verification link. Open your email and click the link to verify your account and complete
          your organization setup.
        </p>
      </div>
    </div>
  );
};

export default ConfirmMessage;
