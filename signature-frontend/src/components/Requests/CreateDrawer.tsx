import React from 'react';
import { Button, Drawer, Form, Input, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

interface CreateDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { title: string; description: string; templateFile: any }) => Promise<boolean> | any;
  loading: boolean;
}

const CreateDrawer: React.FC<CreateDrawerProps> = ({ open, onClose, onSubmit, loading }) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const success = await onSubmit(values);
      if (success) {
        form.resetFields();
        onClose();
      }
    } catch (error) {
      console.error('CreateDrawer submit error:', error);
    }
  };

  return (
    <Drawer
      title="Create New Request"
      open={open}
      onClose={onClose}
      footer={null}
      width={400}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: 'Please enter a title' }]}
        >
          <Input placeholder="Enter request title" />
        </Form.Item>
        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <Input placeholder="Enter request description" />
        </Form.Item>
        <Form.Item
          label="Template File"
          name="templateFile"
          valuePropName="fileList"
          getValueFromEvent={(e) => (Array.isArray(e) ? e : e.fileList)}
          rules={[{ required: true, message: 'Please upload a template file' }]}
        >
          <Upload accept=".doc,.docx" maxCount={1} beforeUpload={() => false}>
            <Button icon={<UploadOutlined />}>Upload Template File</Button>
          </Upload>
        </Form.Item>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create
          </Button>
        </div>
      </Form>
    </Drawer>
  );
};

export default CreateDrawer;