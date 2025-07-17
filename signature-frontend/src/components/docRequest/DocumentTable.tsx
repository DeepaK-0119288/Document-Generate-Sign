import React from "react";
import { Table, Space, Button, Tooltip } from "antd";
import { EyeOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import { signStatusDisplay } from "../../libs/constants";
import type { Request, Document, TemplateVariable } from "../../@types/interfaces/Request";

interface DocumentTableProps {
  request: Request | null;
  loading: boolean;
  userId: string | undefined;
  isOfficer: boolean;
  onPreview: (document: Document) => void;
  onDelete: (document: Document) => void;
  onReject: (documentId: string) => void;
}

const DocumentTable: React.FC<DocumentTableProps> = ({
  request,
  loading,
  userId,
  isOfficer,
  onPreview,
  onDelete,
  onReject,
}) => {
  const getColumns = (templateVariables: TemplateVariable[]) => {
    const excelFields = templateVariables
      .filter((variable) => variable.showOnExcel)
      .map((variable) => variable.name);

    const dynamicColumns = excelFields.map((field) => ({
      title: field,
      dataIndex: ["data", field],
      key: field,
      render: (value: any) => value || "-",
    }));

    return [
      ...dynamicColumns,
      {
        title: "Sign Date",
        dataIndex: "signedDate",
        key: "signedDate",
        render: (text: string) => (text ? new Date(text).toLocaleDateString() : "-"),
      },
      {
        title: "Request Status",
        dataIndex: "signStatus",
        key: "signStatus",
        render: (status: number, record: Document) => (
          <Tooltip
            title={
              status === 3                ? record.rejectionReason
                  ? `Reason: ${record.rejectionReason}`
                  : "No reason provided"
                : ""
            }
          >
            <span>{signStatusDisplay[status] || "Unknown"}</span>
          </Tooltip>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: any, record: Document) => (
          <Space>
            {record.signStatus === 2 && (
              <Button icon={<DownloadOutlined />} onClick={() => onPreview(record)}>
                Download
              </Button>
            )}
            {(record.signStatus === 0 || record.signStatus === 1 || record.signStatus === 4) && (
              <Button icon={<EyeOutlined />} onClick={() => onPreview(record)}>
                Preview
              </Button>
            )}
            {isOfficer &&
              request?.createdBy !== userId &&
              request?.status !== signStatusDisplay[4] &&
              request?.status !== signStatusDisplay[5] &&
              (record.signStatus === 0 || record.signStatus === 1) && (
                <Button danger onClick={() => onReject(record.id)}>
                  Reject
                </Button>
              )}
            {request?.createdBy === userId && record.signStatus === 0 && (
              <Button icon={<DeleteOutlined />} danger onClick={() => onDelete(record)}>
                Delete
              </Button>
            )}
          </Space>
        ),
      },
    ];
  };

  return (
    <Table
      columns={request ? getColumns(request.templateVariables || []) : []}
      dataSource={request?.documents || []}
      rowKey="id"
      loading={loading}
      locale={{ emptyText: "No documents uploaded yet" }}
    />
  );
};

export default DocumentTable;
