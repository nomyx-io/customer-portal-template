import React from "react";

interface ConfirmMessageProps {
  email: string;
}

const ConfirmMessage: React.FC<ConfirmMessageProps> = ({ email }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b bg-black h-screen w-full">
      <div className="bg-[#F1F5F9] bg-opacity-80 rounded-md shadow-lg p-8 text-center w-1/2">
        {/* Header */}
        <div className="p-20">
          <h1 className="text-2xl font-bold text-[#1F1F1F] mb-4">
            Check Your Email!
          </h1>

          {/* Paragraph */}
          <p className="text-[#1F1F1F]">
            We have sent an email to <b>{email}</b> with a verification link,
            open your email and click the link to verify your account and
            complete your organization setup
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmMessage;
