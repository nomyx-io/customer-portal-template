"use client";

import React from "react";

interface NotificationCardProps {
  title: string;
  children: React.ReactNode;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ title, children }) => {
  return (
    <div
      className="relative w-full h-[90vh] flex items-center justify-center bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage: "url('/images/nomyx_banner.svg')",
      }}
    >
      <div className="bg-nomyxDark1 bg-opacity-90 shadow-lg rounded-lg p-16 text-center w-1/2">
        <h2 className="text-3xl text-center font-bold mb-6 text-nomyxWhite">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default NotificationCard;
