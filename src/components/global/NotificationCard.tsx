"use client";

import React from "react";

interface NotificationCardProps {
  title: string;
  children: React.ReactNode;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ title, children }) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="bg-nomyxDark1 bg-opacity-90 shadow-lg rounded-lg py-24 px-10 sm:px-28 w-full max-w-5xl my-10 mx-4 sm:mx-6 lg:mx-8">
        <h2 className="text-3xl text-center font-bold mb-6 text-nomyxWhite">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default NotificationCard;
