import React from "react";
import { Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";

interface UploadButtonProps {
  uploading: boolean;
  onUpload: (files: File[]) => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({ uploading, onUpload }) => {
  return (
    <Upload
      accept=".xlsx,.xls"
      multiple
      showUploadList={false}
      beforeUpload={() => false}
      fileList={[]}
      onChange={({ fileList }) =>
        onUpload(fileList.map((file) => file.originFileObj as File))
      }
    >
      <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
        Bulk Upload Excel Files
      </Button>
    </Upload>
  );
};

export default UploadButton;
