import React from "react";

import { Modal, Button } from "antd";

interface ConfirmationModalProps {
  title: string;
  bodyText: string;
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, bodyText, visible, onCancel, onConfirm }) => {
  return (
    <Modal
      title={<h2 className="text-center text-xl font-semibold text-gray-800">{title}</h2>}
      open={visible}
      onCancel={onCancel}
      footer={null}
      centered
      className="custom-modal"
    >
      <div className="flex flex-col items-center justify-center">
        <p className="text-gray-600 text-center mb-6">{bodyText}</p>
        <div className="flex gap-4 w-full">
          <button
            onClick={onCancel}
            className="w-1/2 text-blue-500 border border-blue-500 hover:bg-transparent hover:text-blue-500 focus:ring-0 bg-transparent text-xs px-4 py-2 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-1/2 bg-blue-500 text-white  hover:bg-blue-600 focus:ring focus:ring-blue-300 text-xs px-4 py-2 rounded-md"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
