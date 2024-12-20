import { Modal } from "antd";

import CustomIframe from "../CustomIframe";

interface TosModalProps {
  tosLink: string;
  onComplete: (data?: any) => void;
}

const TosModal: React.FC<TosModalProps> = ({ tosLink, onComplete }) => (
  <Modal title="Terms of Service" open={true} footer={null} centered className="custom-modal" maskClosable={false} closable={false}>
    <CustomIframe src={tosLink} onComplete={onComplete} />
  </Modal>
);

export default TosModal;
