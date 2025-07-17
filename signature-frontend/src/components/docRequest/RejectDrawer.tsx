import React from "react";
import { Drawer, Form, Input, Button } from "antd";

interface RejectDrawerProps {
  open: boolean;
  onClose: () => void;
  form: any; // Ant Design Form instance
  onReject: () => void;
  loading: boolean;
}

const RejectDrawer: React.FC<RejectDrawerProps> = ({
  open,
  onClose,
  form,
  onReject,
  loading,
}) => {
  return (
    <Drawer
      title="Reject Document"
      open={open}
      onClose={onClose}
      footer={null}
      width={400}
    >
      <Form form={form} layout="vertical" onFinish={onReject}>
        <Form.Item
          label="Rejection Reason"
          name="rejectionReason"
          rules={[{ required: true, message: "Please enter a rejection reason" }]}
        >
          <Input.TextArea placeholder="Enter the reason for rejection" rows={4} style={{ resize: 'none' }} />
        </Form.Item>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
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
 