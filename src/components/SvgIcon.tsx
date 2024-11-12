import React from "react";

interface SvgIconProps {
  color: string;
}

const SvgIcon: React.FC<SvgIconProps> = ({ color }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4a90e2" stopOpacity="1" />
          <stop offset="100%" stopColor="#5e248c" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="15" ry="15" fill="url(#gradient)" />
      <text x="50%" y="50%" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="40" fill="white" dominantBaseline="middle" textAnchor="middle">
        KC
      </text>
    </svg>
  );
};

export default SvgIcon;
