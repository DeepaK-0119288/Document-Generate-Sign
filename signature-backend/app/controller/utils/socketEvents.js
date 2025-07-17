export const emitRequestAssigned = (io, { requestId, officerId, createdBy, status }) => {
  io.emit("newRequestAssigned", {
    requestId,
    officerId,
    createdBy,
    status,
  });
};

export const emitRequestInProcess = (io, { requestId, current, total, createdBy, officerId }) => {
  io.emit("requestInProcess", {
    requestId,
    current,
    total,
    createdBy,
    officerId,
  });
};

export const emitRequestSigned = (io, { requestId, createdBy, officerId, status }) => {
  io.emit("requestSigned", {
    requestId,
    createdBy,
    officerId,
    status,
  });
};

export const emitRequestRejected = (io, { requestId, rejectionReason, createdBy, signStatus }) => {
  io.emit("requestRejected", {
    requestId,
    rejectionReason,
    createdBy,
    signStatus,
  });
};

export const emitDocumentRejected = (io, { createdBy, rejectionReason }) => {
  io.emit("documentRejected", {
    createdBy,
    rejectionReason,
  });
};

export const emitRequestDelegated = (io, { requestId, createdBy, officerId, signStatus }) => {
  io.emit("requestDelegated", {
    requestId,
    createdBy,
    officerId,
    signStatus,
  });
};

export const emitRequestDispatched = (io, { requestId, createdBy, officerId, signStatus }) => {
  io.emit("requestDispatched", {
    requestId,
    createdBy,
    officerId,
    signStatus,
  });
};