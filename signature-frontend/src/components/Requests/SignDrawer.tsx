import React from 'react';
import { Button, Drawer, Form, Select } from 'antd';
import { Request, Signature } from '../../@types/interfaces/Requests';
// import { backendUrl } from '../config';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

interface SignDrawerProps {
  open: boolean;
  onClose: () => void;
  signatures: Signature[];
  onSubmit: (signatureId: string) => Promise<boolean>;
  selectedRequest: Request | null;
  loading: boolean;
}

const SignDrawer: React.FC<SignDrawerProps> = ({ open, onClose, signatures, onSubmit, loading }) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const success = await onSubmit(values.signatureId);
      if (success) {
        form.resetFields();
        onClose();
      }
    } catch (error) {
      console.error('SignDrawer submit error:', error);
    }
  };

  return (
    <Drawer
      title="Sign Request"
      open={open}
      onClose={onClose}
      footer={null}
      width={400}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Select Signature"
          name="signatureId"
          rules={[{ required: true, message: 'Please select a signature' }]}
        >
          <Select
            placeholder="Select a signature"
            style={{ width: '100%' }}
            options={signatures.map((sig) => ({
              value: sig.id,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={`${backendUrl}${sig.url}`}
                    alt={sig.name}
                    style={{ width: 40, height: 40, objectFit: 'contain', border: '1px solid #ddd' }}
                  />
                  <span>{sig.name}</span>
                </div>
              ),
            }))}
          />
        </Form.Item>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Sign
          </Button>
        </div>
      </Form>
    </Drawer>
  );
};

export default SignDrawer;