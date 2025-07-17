import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as templateServices from "../services/templates.js";
import { SendForSignatureSchema } from "../schema/request.js";
import { userServices } from "../services/index.js";
import { roles, status, signStatus } from "../constants/index.js";
import { validateRequest, processDocument } from "./utils/signature.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const sendForSignature = async (req, res, next) => {
  try {
    const id = req.params.id;
    const request = await templateServices.findOne({
      id,
      signStatus: signStatus.unsigned,
      createdBy: req.session.userId,
      status: status.active,
    });

    if (!request) { return res.status(404).json({ error: "Request not found or unauthorized" });}

    if (request.data.length === 0) {return res.status(400).json({ error: "Cannot send request without documents" });}

    const body = await SendForSignatureSchema.safeParseAsync(req.body);
    if (!body.success) {
      return res.status(400).json({
        error: "Invalid payload",
        detailed: body.error,
      });
    }

    const { officerId } = body.data;
    const officer = await userServices.findOne({id: officerId,role: roles.officer,status: status.active,});

    if (!officer) {
      return res.status(400).json({ error: "Invalid officer" });
    }

    const updatedTemplate = await templateServices.updateOne(
      { id },
      {
        $set: {
          signStatus: signStatus.readForSign,
          assignedTo: officerId,
          updatedBy: req.session.userId,
          updatedAt: new Date(),
          "data.$[].signStatus": signStatus.readForSign,
        },
      }
    );

    const io = req.app.get("io");
    io.emit("newRequestAssigned", { requestId: id,officerId: officerId,createdBy: req.session.userId,status: signStatus.readForSign,});

    return res.json({
      status: updatedTemplate.signStatus,
    });
  } catch (error) {
    console.error("POST /api/requests/:id/send error:", error);
    next(error);
  }
};

export const signRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const { courtName, request, signature } = await validateRequest(req);

    await templateServices.updateOne(
      { id },
      {
        $set: {
          signStatus: signStatus.inProcess,
          updatedAt: new Date(),
          updatedBy: userId,
          "data.$[].signStatus": signStatus.inProcess,
        },
      }
    );

    const io = req.app.get("io");
    const totalNonRejected = request.data.filter((doc) => doc.signStatus !== signStatus.rejected).length;
    io.emit("requestInProcess", {
      createdBy: request.createdBy,
      officerId: request.assignedTo,
      requestId: id,
      current: 0,
      total: totalNonRejected,
    });

    const docxPath = path.resolve(__dirname, "../../", request.url);
    if (!fs.existsSync(docxPath)) {
      return res.status(404).json({ error: "Template file not found" });
    }

    const signedDir = path.resolve(__dirname, "../Uploads/signed", id);
    const qrCodeDir = path.resolve(__dirname, "../Uploads/qrcodes", id);
    await fs.promises.mkdir(signedDir, { recursive: true });
    await fs.promises.mkdir(qrCodeDir, { recursive: true });

    // Process documents
    let currentDocumentCount = 0;
    const signedDocuments = [];
    for (const document of request.data) {
      const updatedDocument = await processDocument(
        document,
        docxPath,
        signedDir,
        qrCodeDir,
        courtName,
        signature.url,
        io,
        id,
        totalNonRejected
      );
      signedDocuments.push(updatedDocument);
      currentDocumentCount++;
      io.emit("requestInProcess", {
        requestId: id,
        current: currentDocumentCount,
        total: totalNonRejected,
        createdBy: request.createdBy,
        officerId: request.assignedTo,
      });
    }

    await templateServices.updateOne(
      { id },
      {
        $set: {
          data: signedDocuments,
          signStatus: signStatus.Signed,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      }
    );

    io.emit("requestSigned", {
      requestId: id,
      createdBy: request.createdBy,
      officerId: request.assignedTo,
      status: signStatus.Signed,
    });

    return res.json({
      message: "Request signed successfully",
      signedDocuments: signedDocuments.map((doc) => ({
        id: doc.id.toString(),
        name: doc.data && doc.data.name ? doc.data.name : "Document",
        signedPath: `/Uploads/signed/${id}/${doc.id}_signed.pdf`,
        qrCodePath: `/Uploads/qrcodes/${id}/${doc.id}_qrcode.png`,
        signedDate: doc.signedDate,
      })),
    });
  } catch (error) {
    console.error("POST /api/requests/:id/sign error:", error);
    next(error);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { rejectionReason } = req.body;

    if (!rejectionReason ||typeof rejectionReason !== "string" ||rejectionReason.trim().length === 0) {
      return res.status(400).json({
          error: "Rejection reason is required and must be a non-empty string",
        });
    }

    const userId = req.session.userId;

    if (!userId) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const template = await templateServices.findOne({
      id,
      signStatus: signStatus.readForSign,
      assignedTo: userId,
      status: status.active,
    });

    if (!template) {
        return res.status(404).json({ error: "Request not found or unauthorized" });
    }

    const rejectedDocuments = template.data.map((doc) => ({
      ...doc,
      signStatus: signStatus.rejected,
      rejectionReason: rejectionReason.trim(),
      rejectedDate: new Date(),
    }));

    const updatedTemplate = await templateServices.updateOne(
      { id },
      {
        $set: {
          data: rejectedDocuments,
          signStatus: signStatus.rejected,
          rejectionReason: rejectionReason.trim(),
          updatedBy: userId,
          updatedAt: new Date(),
        },
      }
    );

    //('Updated template with rejectionReason:', updatedTemplate);
    const io = req.app.get("io");
    io.emit("requestRejected", {
      requestId: id,
      rejectionReason: rejectionReason.trim(),
      createdBy: updatedTemplate.createdBy,
      signStatus: signStatus.rejected,
    });

    return res.json({
      status: signStatus.rejected,
      rejectionReason: rejectionReason.trim(),
    });
  } catch (error) {
    console.error("POST /api/requests/:id/reject error:", error);
    next(error);
  }
};

export const getDocumentData = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const template = await templateServices.findOne(
      { "data.id": documentId },
      { "data.$": 1, templateName: 1, description: 1 }
    );

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const document = template.data[0];
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    return res.json({
      documentId: document.id.toString(),
      templateName: template.templateName,
      description: template.description || "",
      data:
        document.data instanceof Map
          ? Object.fromEntries(document.data)
          : document.data || {},
      signedDate: document.signedDate?.toLocaleString(),
      signedPath: document.signedPath || "",
      qrCodePath: document.qrCodePath || "",
    });
  } catch (error) {
    console.error("GET /api/documents/:documentId error:", error);
    next(error);
  }
};

export const rejectDocument = async (req, res, next) => {
  try {
    const { id, documentId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason ||typeof rejectionReason !== "string" ||rejectionReason.trim().length === 0) {
      return res.status(400).json({  error: "Rejection reason is required and must be a non-empty string",});
    }

    const request = await templateServices.findOne({
      id,
      signStatus: signStatus.readForSign,
      assignedTo: req.session.userId,
      status: status.active,
      "data.id": documentId,
    });

    if (!request) {return res.status(404).json({ error: "Request not found or unauthorized" });}

    const updatedDocument = await templateServices.updateOne(
      {
        id,
        "data.id": documentId,
      },
      {
        $set: {
          "data.$.signStatus": signStatus.rejected,
          "data.$.rejectionReason": rejectionReason.trim(),
          "data.$.rejectedDate": new Date(),
          updatedBy: req.session.userId,
          updatedAt: new Date(),
        },
      }
    );

    const io = req.app.get("io");
    io.emit("documentRejected", {
      createdBy: request.createdBy,
      rejectionReason: rejectionReason.trim(),
    });

    return res.json({
      message: "Document rejected successfully",
      documentId,
      rejectionReason: rejectionReason.trim(),
    });
  } catch (error) {
    console.error(
      "POST /api/requests/:requestId/documents/:documentId/reject error:",
      error
    );
    next(error);
  }
};

export const delegateRequest = async (req, res, next) => {
  try {
    const id = req.params.id;
    const template = await templateServices.findOne({
      id,
      signStatus: signStatus.readForSign,
      assignedTo: req.session.userId,
      status: status.active,
    });

    if (!template) {return res.status(404).json({ error: "Request not found or unauthorized" });}

    const readerId = template.createdBy;

    const updatedRequest = await templateServices.updateOne(
      { id },
      {
        $set: {
          signStatus: signStatus.delegated,
          delegatedTo: readerId,
          updatedBy: req.session.userId,
          updatedAt: new Date(),
          "data.$[elem].signStatus": signStatus.delegated,
        },
      },
      {
        arrayFilters: [{ "elem.signStatus": { $ne: signStatus.rejected } }],
      }
    );

    const io = req.app.get("io");
    io.emit("requestDelegated", {
      requestId: id,
      createdBy: updatedRequest.createdBy,
      officerId: updatedRequest.assignedTo,
      signStatus: signStatus.delegated,
    });

    return res.json({
      status: updatedRequest.signStatus,
    });
  } catch (error) {
    console.error("POST /api/requests/:id/delegate error:", error);
    next(error);
  }
};

export const dispatchRequest = async (req, res, next) => {
  try {
    const id = req.params.id;
    const template = await templateServices.findOne({
      id,
      // signStatus: signStatus.signed,
      signStatus: 5,
      createdBy: req.session.userId,
      status: status.active,
    });

    if (!template) {return res.status(404).json({ error: "Request not found or unauthorized" });}

    const updatedRequest = await templateServices.updateOne(
      { id },
      {
        $set: {
          signStatus: signStatus.dispatched,
          updatedBy: req.session.userId,
          updatedAt: new Date(),
        },
      }
    );

    const io = req.app.get("io");
    io.emit("requestDispatched", {
      requestId: id,
      createdBy: updatedRequest.createdBy,
      officerId: updatedRequest.assignedTo,
      signStatus: signStatus.dispatched,
    });

    return res.json({
      status: updatedRequest.signStatus,
    });
  } catch (error) {
    console.error("POST /api/requests/:id/delegate error:", error);
    next(error);
  }
};
