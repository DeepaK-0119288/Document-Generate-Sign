import { useState } from "react";
import { Form, message } from "antd";
import { requestClient } from "../store";
import * as XLSX from "xlsx";
import mongoose from "mongoose";
import { signStatus } from "../libs/constants";
import type { Document } from "../@types/interfaces/Request";

export const useDocumentActions = (
  id: string | undefined,
  fetchRequest: () => Promise<void>
) => {
  const [uploading, setUploading] = useState(false);
  const [isRejectDrawerOpen, setIsRejectDrawerOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [rejectForm] = Form.useForm();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleUpload = async (fileList: File[]) => {
    if (!id) return;
    try {
      setUploading(true);
      const dataEntries: any[] = [];
      for (const file of fileList) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        rows.forEach((row) => {
          const rowData: Record<string, any> = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index] || "";
          });
          dataEntries.push({
            id: new mongoose.Types.ObjectId().toString(),
            url: file.name,
            data: rowData,
            signStatus: signStatus.unsigned,
            createdAt: new Date().toLocaleString(),
          });
        });
      }

      await requestClient.uploadDocuments(id, fileList, dataEntries);
      message.success("Documents uploaded successfully!");
      await fetchRequest();
    } catch (error) {
      console.error("handleUpload error:", error);
      // handleError(error, "Failed to upload documents");
    } finally {
      setUploading(false);
    }
  };

  const handlePreviewDocument = (document: Document) => {
    if (!id) return;
    const url =
      document.signStatus === signStatus.Signed
        ? `${backendUrl}/Uploads/signed/${id}/${document.id}_signed.pdf`
        : `${backendUrl}/api/requests/${id}/documents/${document.id}/preview`;
    window.open(url, "_blank");
  };

  const handleDeleteDocument = async (document: Document) => {
    if (!id) return;
    try {
      await requestClient.deleteDocument(id, document.id);
      message.success("Document deleted successfully!");
      await fetchRequest();
    } catch (error) {
      console.error("deleteDocument error:", error);
      message.info("Document deletion is not allowed while the request is in process.");
    }
  };

  const handleRejectDocument = async () => {
    if (!id || !selectedDocumentId) return;
    try {
      const values = await rejectForm.validateFields();
      await requestClient.rejectDocument(id, selectedDocumentId, values.rejectionReason);
      message.success("Document rejected successfully!");
      await fetchRequest();
      setIsRejectDrawerOpen(false);
      setSelectedDocumentId(null);
      rejectForm.resetFields();
    } catch (error) {
      console.error("handleRejectDocument error:", error);
      // handleError(error, "Failed to reject document");
    }
  };

  return {
    uploading,
    handleUpload,
    handlePreviewDocument,
    handleDeleteDocument,
    handleRejectDocument,
    isRejectDrawerOpen,
    setIsRejectDrawerOpen,
    selectedDocumentId,
    setSelectedDocumentId,
    rejectForm,
  };
};
