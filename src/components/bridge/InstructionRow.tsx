import React from "react";

import { Tooltip } from "antd";
import { InfoCircle } from "iconsax-react";

type InstructionRowProps = {
  label: string;
  value?: string;
  copyId: string;
  copyFn: (text: string, message: string) => JSX.Element;
  tooltipTitle?: string;
  copyMessage: string;
};

const InstructionRow: React.FC<InstructionRowProps> = ({ label, value, copyId, copyFn, tooltipTitle, copyMessage }) => {
  return (
    <div className="flex items-center">
      <span className="min-w-[150px] flex items-center gap-1">
        <strong>{label}:</strong>
        {tooltipTitle && (
          <Tooltip title={tooltipTitle}>
            <InfoCircle size="16" color="red" className="cursor-pointer flex-shrink-0" />
          </Tooltip>
        )}
      </span>
      <span>{value}</span>
      <span className="flex-grow" />
      {copyFn(copyId, copyMessage)}
    </div>
  );
};

export default InstructionRow;
