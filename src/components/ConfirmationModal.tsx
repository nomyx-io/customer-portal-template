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
          <Button onClick={onCancel} className="text-blue-500 w-1/2">
            Cancel
          </Button>
          <Button type="primary" className="bg-blue-500 hover:bg-blue-600 w-1/2" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
