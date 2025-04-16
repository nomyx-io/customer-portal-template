"use client";

import { useState } from "react";

import { Card, Descriptions, Button, Row, Col, Typography, Image, Modal } from "antd";

const { Title, Paragraph } = Typography;

interface StockDetailsProps {
  visible: boolean;
  onClose: () => void;
}

const StockDetails: React.FC<StockDetailsProps> = ({ visible, onClose }) => {
  return (
    <Modal open={visible} onCancel={onClose} footer={null} width={900}>
      <Row gutter={[16, 16]}>
        {/* Stock Image */}
        <Col span={24} className="flex justify-center">
          <Image
            src="/path/to/your/image.jpg" // Update with your actual image path
            alt="Stock Image"
            width={300}
            height={200}
            className="rounded-lg"
          />
        </Col>

        {/* Stock Title & Description */}
        <Col span={24}>
          <Title level={3}>Stock 0012548 - Token ID 500</Title>
          <Paragraph>
            Description text, Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis at tincidunt ex. Vivamus varius nulla eget nisl interdum
            sollicitudin eget at turpis.
          </Paragraph>
        </Col>

        {/* Full Description */}
        <Col span={24}>
          <Card title="Full Description" bordered={false}>
            <Paragraph>
              <strong>WI-Fi6e chip sets</strong> - Qualcomm FastConnect 6900 <br />
              <strong>QTY</strong> - 100,000 <br />
              <strong>Country of Origin</strong> - China <br />
              <strong>Pallet Number</strong> - 5001 <br />
              <strong>Serial Number Range</strong> - 5344559 - 63445599 <br />
              <strong>Airway Bill Number/Bill of Landing</strong>: FZA312353
            </Paragraph>
          </Card>
        </Col>

        {/* Stock Information */}
        <Col span={24}>
          <Card title="Stock Information" bordered={false}>
            <Descriptions column={2}>
              <Descriptions.Item label="Type of Investment">Venture</Descriptions.Item>
              <Descriptions.Item label="Stage">Early</Descriptions.Item>
              <Descriptions.Item label="Market">US</Descriptions.Item>
              <Descriptions.Item label="Fund Size">$5 M</Descriptions.Item>
              <Descriptions.Item label="Generation">03</Descriptions.Item>
              <Descriptions.Item label="Economics">2% - 20%</Descriptions.Item>
              <Descriptions.Item label="Opening Date">09-03-2025</Descriptions.Item>
              <Descriptions.Item label="Closing Date">09-03-2026</Descriptions.Item>
              <Descriptions.Item label="Target Return (Gross)">3-4 X</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Close Button */}
        <Col span={24} className="flex justify-end">
          <Button onClick={onClose} type="default">
            Close
          </Button>
        </Col>
      </Row>
    </Modal>
  );
};

// Example Usage
const StockPage: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(true);

  return (
    <div className="p-6">
      <Button type="primary" onClick={() => setModalVisible(true)}>
        Open Stock Details
      </Button>

      <StockDetails visible={modalVisible} onClose={() => setModalVisible(false)} />
    </div>
  );
};

export default StockPage;
