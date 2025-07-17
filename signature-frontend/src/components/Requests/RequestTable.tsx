import React from "react";
import { Button, Dropdown, Menu, message, Tag, Tooltip } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import CustomTable from "../CustomTable";
import { Request } from "../../@types/interfaces/Requests";
import { signStatus, signStatusDisplay, roles } from "../../libs/constants";
import { useAppStore1 } from "../../store/store";
import { useAppStore } from "../../store/index";

interface RequestTableProps {
  requests: Request[];
  loading: boolean;
  onSend: (record: Request) => void;
  onSign: (record: Request) => void;
  onReject: (record: Request) => void;
  signingRequestId?: string | null;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
  onDispatch: (id: string) => void;
  onPrint: (id: string) => void;
  onDownload: (id: string, title: string) => void;
  onDelegate: (id: string) => void;
}

const RequestTable: React.FC<RequestTableProps> = ({
  requests,
  loading,
  onSend,
  onSign,
  onReject,
  signingRequestId,
  onClone,
  onDelete,
  onDispatch,
  onPrint,
  onDownload,
  onDelegate,
}) => {
  const { signingProgress } = useAppStore1();
  const { session } = useAppStore();
  const navigate = useNavigate();
  const userRole = session?.role;
  const userId = session?.userId;
  const isReader = userRole === roles.reader;

  const getActions = (record: Request) => {
    const menuItems: any[] = [
      { key: "clone", label: "Clone", onClick: () => onClone(record.id) },
    ];

    // Debug logging to inspect values
    console.log("Record:", {
      id: record.id,
      rawStatus: record.rawStatus,
      createdBy: record.createdBy,
      userId,
      isDelegated: record.rawStatus === signStatus.delegated,
      isCreatedByUser: record.createdBy === userId,
    });

    if (record.rawStatus === signStatus.unsigned) {
      menuItems.push(
        {
          key: "send",
          label: "Send for Signature",
          disabled: record.documentCount === 0,
          onClick: () => onSend(record),
        },
        {
          key: "delete",
          label: "Delete",
          danger: true,
          onClick: () => onDelete(record.id),
        }
      );
    } else if (
      record.rawStatus === signStatus.delegated &&
      record.createdBy === userId
    ) {
      menuItems.push({
        key: "sign",
        label: "Sign",
        disabled: signingRequestId === record.id,
        onClick: () => onSign(record),
      });
    } else if (
      record.rawStatus === signStatus.readForSign &&
      !isReader &&
      record.createdBy !== userId
    ) {
      menuItems.push(
        {
          key: "sign",
          label: "Sign",
          disabled: signingRequestId === record.id,
          onClick: () => onSign(record),
        },
        {
          key: "reject",
          label: "Reject",
          danger: true,
          onClick: () => onReject(record),
        },
        {
          key: "delegate",
          label: "Delegate",
          onClick: () => onDelegate(record.id),
        }
      );
    } else if (
      record.rawStatus === signStatus.Signed ||
      record.rawStatus === signStatus.dispatched
    ) {
      menuItems.push(
        { key: "print", label: "Print", onClick: () => onPrint(record.id) },
        {
          key: "download",
          label: "Download All (ZIP)",
          onClick: () => onDownload(record.id, record.title),
        }
      );

      if (
        record.createdBy === userId &&
        record.rawStatus === signStatus.Signed
      ) {
        menuItems.push({
          key: "dispatch",
          label: "Dispatch",
          onClick: () => onDispatch(record.id),
        });
      }
      if (
        record.createdBy === userId &&
        record.rawStatus === signStatus.dispatched
      ) {
        menuItems.push(
          {
            key: "dispatchRegister",
            label: "Dispatch Register",
            onClick: () =>
              message.info("Dispatch Register feature is not implemented yet."),
          },
          {
            key: "dispatchSlip",
            label: "Dispatch Slip",
            onClick: () =>
              message.info("Dispatch Slip feature is not implemented yet."),
          }
        );
      }
    }

    return (
      <Dropdown
        overlay={
          <Menu
            items={menuItems.map((item) => ({
              ...item,
              onClick: item.onClick,
            }))}
          />
        }
        trigger={["click"]}
      >
        <Button icon={<MoreOutlined />} />
      </Dropdown>
    );
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Request) => (
        <Button
          type="link"
          onClick={() => navigate(`/dashboard/template/${record.id}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Number of Documents",
      dataIndex: "documentCount",
      key: "documentCount",
      render: (count: number, record: Request) => (
        <Button
          type="link"
          onClick={() => navigate(`/dashboard/request/${record.id}`)}
        >
          {count}
        </Button>
      ),
    },
    {
      title: "Rejected Documents",
      dataIndex: "rejectedCount",
      key: "rejectedCount",
      render: (count: number, record: Request) => (
        <Button
          type="link"
          onClick={() => navigate(`/dashboard/request/${record.id}/rejected`)}
          disabled={count === 0}
        >
          {count}
        </Button>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      title: "Request Status",
      dataIndex: "status",
      key: "status",
      render: (_: string, record: Request) => {
        let displayStatus = record.status;
        if (record.rawStatus === signStatus.readForSign) {
          if (record.createdBy === userId) {
            displayStatus = "Waiting for Signature";
          } else if (record.assignedTo === userId) {
            displayStatus = signStatusDisplay[signStatus.readForSign];
          }
        } else if (isReader && record.rawStatus === signStatus.Signed) {
          displayStatus = signStatusDisplay[signStatus.readyForDispatch];
        }
        const isInProcess =
          displayStatus === signStatusDisplay[signStatus.inProcess];
        const progress = signingProgress[record.id];
        return (
          <Tooltip
            title={
              record.rawStatus === signStatus.rejected && record.rejectionReason
                ? `Reason: ${record.rejectionReason}`
                : isInProcess && progress
                  ? `Signing ${progress.current} of ${progress.total} documents`
                  : ""
            }
          >
            <Tag
              color={
                displayStatus === signStatusDisplay[signStatus.unsigned]
                  ? "blue"
                  : displayStatus ===
                        signStatusDisplay[signStatus.readForSign] ||
                      displayStatus === "Waiting for Signature"
                    ? "orange"
                    : displayStatus === signStatusDisplay[signStatus.rejected]
                      ? "volcano"
                      : displayStatus ===
                          signStatusDisplay[signStatus.delegated]
                        ? "blue"
                        : displayStatus ===
                            signStatusDisplay[signStatus.inProcess]
                          ? "cyan"
                          : displayStatus ===
                              signStatusDisplay[signStatus.Signed]
                            ? "green"
                            : displayStatus ===
                                signStatusDisplay[signStatus.readyForDispatch]
                              ? "lime"
                              : displayStatus ===
                                  signStatusDisplay[signStatus.dispatched]
                                ? "purple"
                                : "default"
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {displayStatus || "Unknown"}
                {isInProcess &&
                  progress &&
                  `(${progress.current}/${progress.total})`}
              </div>
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Request) => getActions(record),
    },
  ];

  return (
    <CustomTable
      serialNumberConfig={{ name: "", show: true }}
      columns={columns}
      data={requests}
      loading={loading}
    />
  );
};

export default RequestTable;
