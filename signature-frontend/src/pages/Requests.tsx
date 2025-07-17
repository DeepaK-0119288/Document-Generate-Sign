import React, { useState } from "react";
import { Button, Input } from "antd";
import MainAreaLayout from "../components/main-layout/main-layout";
import RequestTable from "../components/Requests/RequestTable";
import SendDrawer from "../components/Requests/SendDrawer";
import CreateDrawer from "../components/Requests/CreateDrawer";
import SignDrawer from "../components/Requests/SignDrawer";
import RejectDrawer from "../components/Requests/RejectDrawer";
import { useRequests } from "../hooks/useRequests";
import { useOfficers } from "../hooks/useOfficers";
import { useSignatures } from "../hooks/useSignatures";
import { useSocketEvents } from "../hooks/useSocketEvents";
import { useRequestActions } from "../hooks/useRequestActions";
import { Request } from "../@types/interfaces/Requests";

const Requests: React.FC = () => {
  const {
    filteredRequests,
    searchQuery,
    loading,
    handleSearch,
    fetchRequests,
  } = useRequests();
  const { officers } = useOfficers();
  const { signatures, fetchSignatures } = useSignatures();
  const {
    createRequest,
    sendForSignature,
    cloneRequest,
    deleteRequest,
    signRequest,
    dispatchRequest,
    rejectRequest,
    printRequest,
    downloadAll,
    delegateRequest,
  } = useRequestActions();
  useSocketEvents(fetchRequests);

  const [isSendDrawerOpen, setIsSendDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isSignDrawerOpen, setIsSignDrawerOpen] = useState(false);
  const [isRejectDrawerOpen, setIsRejectDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [signingRequestId, setSigningRequestId] = useState<string | null>(null);

  const handleSend = (record: Request) => {
    setSelectedRequest(record);
    setIsSendDrawerOpen(true);
  };

  const handleSign = (record: Request) => {
    setSelectedRequest(record);
    setIsSignDrawerOpen(true);
    fetchSignatures();
  };

  const handleReject = (record: Request) => {
    setSelectedRequest(record);
    setIsRejectDrawerOpen(true);
  };

  return (
    <MainAreaLayout
      title="Requests"
      extra={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Input.Search
            placeholder="Search by title"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Button type="primary" onClick={() => setIsCreateDrawerOpen(true)}>
            New Request for Signature
          </Button>
        </div>
      }
    >
      <RequestTable
        requests={filteredRequests}
        loading={loading}
        onSend={handleSend}
        onSign={handleSign}
        onReject={handleReject}
        signingRequestId={signingRequestId}
        onClone={async (id) => {
          await cloneRequest(id);
          fetchRequests();
        }}
        onDelete={async (id) => {
          await deleteRequest(id);
          fetchRequests();
        }}
        onDispatch={async (id) => {
          await dispatchRequest(id);
          fetchRequests();
        }}
        onPrint={printRequest}
        onDownload={downloadAll}
        onDelegate={async (id) => {
          await delegateRequest(id);
          fetchRequests();
        }}
      />
      <SendDrawer
        open={isSendDrawerOpen}
        onClose={() => {
          setIsSendDrawerOpen(false);
          setSelectedRequest(null);
        }}
        officers={officers}
        onSubmit={async (officerId) => {
          const success = await sendForSignature(
            selectedRequest!.id,
            officerId
          );
          if (success) fetchRequests();
          return success;
        }}
        selectedRequest={selectedRequest}
        loading={loading}
      />
      <CreateDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onSubmit={async (values) => {
          const success = await createRequest(values);
          if (success) fetchRequests();
          return success;
        }}
        loading={loading}
      />
      <SignDrawer
        open={isSignDrawerOpen}
        onClose={() => {
          setIsSignDrawerOpen(false);
          setSelectedRequest(null);
          setSigningRequestId(null);
        }}
        signatures={signatures}
        onSubmit={async (signatureId) => {
          setSigningRequestId(selectedRequest!.id);
          const success = await signRequest(selectedRequest!.id, signatureId);
          if (success) fetchRequests();
          return success;
        }}
        selectedRequest={selectedRequest}
        loading={signingRequestId === selectedRequest?.id}
      />
      <RejectDrawer
        open={isRejectDrawerOpen}
        onClose={() => {
          setIsRejectDrawerOpen(false);
          setSelectedRequest(null);
        }}
        onSubmit={async (rejectionReason) => {
          const success = await rejectRequest(
            selectedRequest!.id,
            rejectionReason
          );
          if (success) fetchRequests();
          return success;
        }}
        selectedRequest={selectedRequest}
        loading={loading}
      />
    </MainAreaLayout>
  );
};

export default Requests;
