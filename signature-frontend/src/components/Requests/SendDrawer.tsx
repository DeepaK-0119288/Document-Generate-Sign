import React from 'react';
import { Button, Drawer, Form, Select } from 'antd';
import { Request, Officer } from '../../@types/interfaces/Requests';

interface SendDrawerProps {
  open: boolean;
  onClose: () => void;
  officers: Officer[];
  onSubmit: (officerId: string) => Promise<boolean>;
  selectedRequest: Request | null;
  loading: boolean;
}

const SendDrawer: React.FC<SendDrawerProps> = ({ open, onClose, officers, onSubmit, selectedRequest, loading }) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const success = await onSubmit(values.officerId);
      if (success) {
        form.resetFields();
        onClose();
      }
    } catch (error) {
      console.error('SendDrawer submit error:', error);
    }
  };

  return (
    <Drawer
      title="Send for Signature"
      open={open}
      onClose={onClose}
      footer={null}
      width={400}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Select Officer"
          name="officerId"
          rules={[{ required: true, message: 'Please select an officer' }]}
        >
          <Select
            placeholder="Select an officer"
            disabled={officers.length === 0}
            options={officers.map((officer) => ({
              value: officer.id,
              label: officer.name,
            }))}
          />
        </Form.Item>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading} disabled={officers.length === 0}>
            Send
          </Button>
        </div>
      </Form>
    </Drawer>
  );
};

export default SendDrawer;