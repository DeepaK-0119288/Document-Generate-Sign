import React from "react";
import { useParams } from "react-router";
import MainAreaLayout from "../components/main-layout/main-layout";
import DocumentTable from "../components/docRequest/DocumentTable";
import UploadButton from "../components/docRequest/UploadButton";
import DownloadTemplateButton from "../components/docRequest/DownloadTemplateButton";
import RejectDrawer from "../components/docRequest/RejectDrawer";
import { useRequest } from "../hooks/useRequest";
import { useDocumentActions } from "../hooks/useDocumentActions";
import { useAppStore } from "../store/index";

const Request: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { session } = useAppStore();
  const { request, loading, fetchRequest } = useRequest(id);
  const {
    uploading,
    handleUpload,
    handleDeleteDocument,
    handleRejectDocument,
    isRejectDrawerOpen,
    setIsRejectDrawerOpen,
    setSelectedDocumentId,
    rejectForm,
  } = useDocumentActions(id, fetchRequest);

  return (
    <MainAreaLayout
      title={`Request: ${request?.title || "Loading..."}`}
      extra={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {request?.status === "Draft" && (
            <UploadButton uploading={uploading} onUpload={handleUpload} />
          )}
          <DownloadTemplateButton request={request} />
        </div>
      }
    >
      <DocumentTable
        request={request}
        loading={loading}
        userId={session?.userId}
        isOfficer={session?.role === 2}
        onPreview={handleDeleteDocument}
        onDelete={handleDeleteDocument}
        onReject={(documentId: string) => {
          setSelectedDocumentId(documentId);
          setIsRejectDrawerOpen(true);
        }}
      />
      <RejectDrawer
        open={isRejectDrawerOpen}
        onClose={() => {
          setIsRejectDrawerOpen(false);
          setSelectedDocumentId(null);
          rejectForm.resetFields();
        }}
        form={rejectForm}
        onReject={handleRejectDocument}
        loading={loading}
      />
    </MainAreaLayout>
  );
};

export default Request;
