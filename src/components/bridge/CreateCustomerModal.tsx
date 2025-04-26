import { ChangeEvent } from "react";

import { Modal, Input, Button } from "antd";

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  emailAddress: string;
  onCustomerNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onEmailAddressChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onAddCustomer: () => void;
  isDisabled: boolean;
  isLoading: boolean;
}

const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  customerName,
  emailAddress,
  onCustomerNameChange,
  onEmailAddressChange,
  onAddCustomer,
  isDisabled,
  isLoading,
}) => (
  <Modal title="Create Customer Account" open={isOpen} onCancel={onClose} footer={null} centered className="rounded-lg custom-modal">
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col">
        <label className="text-gray-800 font-medium dark:text-gray-300">
          <span className="text-nomyx-danger-light dark:text-nomyx-danger-dark">*</span> Customer Name
        </label>
        <Input placeholder="Type Name" value={customerName} onChange={onCustomerNameChange} />
      </div>
      <div className="flex flex-col">
        <label className="text-gray-800 font-medium dark:text-gray-300">
          <span className="text-nomyx-danger-light dark:text-nomyx-danger-dark">*</span> Email Address
        </label>
        <Input placeholder="Type Email" value={emailAddress} onChange={onEmailAddressChange} />
      </div>
      <div className="flex justify-between mt-4">
        <Button onClick={onClose} className="text-blue-500">
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onAddCustomer}
          className="bg-blue-500 hover:bg-blue-600 disabled:text-gray-500"
          disabled={isDisabled}
          loading={isLoading}
        >
          Add Customer
        </Button>
      </div>
    </div>
  </Modal>
);

export default CreateCustomerModal;
