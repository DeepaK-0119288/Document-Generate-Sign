import React from 'react';
import { Button, Drawer, Form, Input } from 'antd';
import { Request } from '../../@types/interfaces/Requests';

interface RejectDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rejectionReason: string) => Promise<boolean>;
  selectedRequest: Request | null;
  loading: boolean;
}

const RejectDrawer: React.FC<RejectDrawerProps> = ({ open, onClose, onSubmit, selectedRequest, loading }) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const success = await onSubmit(values.rejectionReason);
      if (success) {
        form.resetFields();
        onClose();
      }
    } catch (error) {
      console.error('RejectDrawer submit error:', error);
    }
  };

  return (
    <Drawer
      title="Reject Request"
      open={open}
      onClose={onClose}
      footer={null}
      width={400}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Rejection Reason"
          name="rejectionReason"
          rules={[{ required: true, message: 'Please enter a rejection reason' }]}
        >
          <Input.TextArea placeholder="Enter the reason for rejection" rows={4} style={{ resize: 'none' }} />
        </Form.Item>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Reject
          </Button>
        </div>
      </Form>
    </Drawer>
  );
};

export default RejectDrawer;