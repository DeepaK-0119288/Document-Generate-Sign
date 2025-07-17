import { message } from 'antd';
import { requestClient } from '../store';
import { AxiosError } from 'axios';

export const useRequestActions = () => {
  const handleError = (error: unknown, fallbackMsg: string) => {
    if (error instanceof AxiosError) {
      message.error(error.response?.data?.error || fallbackMsg);
      return;
    }
    if (error instanceof Error) {
      message.error(error.message);
      return;
    }
    message.error(fallbackMsg);
  };

  const createRequest = async (values: { title: string; description: string; templateFile: any }) => {
    try {
      const templateFile = values.templateFile?.[0]?.originFileObj;
      if (!templateFile) throw new Error('Please upload a template file');
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      if (!allowedTypes.includes(templateFile.type)) {
        message.error('Invalid file type. Please upload a .doc or .docx file.');
        return;
      }
      await requestClient.createRequest({
        title: values.title,
        description: values.description,
        templateFile,
      });
      message.success('Request created successfully!');
      return true;
    } catch (error) {
      handleError(error, 'Failed to create request');
      return false;
    }
  };

  const sendForSignature = async (requestId: string, officerId: string) => {
    try {
      await requestClient.sendForSignature(requestId, { officerId });
      message.success('Request sent for signature!');
      return true;
    } catch (error) {
      handleError(error, 'Failed to send request for signature');
      return false;
    }
  };

  const cloneRequest = async (id: string) => {
    try {
      await requestClient.cloneRequest(id);
      message.success('Request cloned successfully!');
      return true;
    } catch (error) {
      handleError(error, 'Failed to className="custom-table" request');
      return false;
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      await requestClient.deleteRequest(id);
      message.success('Request deleted successfully!');
      return true;
    } catch (error) {
      handleError(error, 'Failed to delete request');
      return false;
    }
  };

  const signRequest = async (requestId: string, signatureId: string) => {
    try {
      await requestClient.signRequest(requestId, signatureId);
      message.success('Request signed successfully!');
      return true;
    } catch (error) {
      handleError(error, 'Failed to sign request');
      return false;
    }
  };

  const dispatchRequest = async (id: string) => {
    try {
      await requestClient.dispatchRequest(id);
      message.success('Request dispatched successfully!');
      return true;
    } catch (error) {
      handleError(error, 'Failed to dispatch request');
      return false;
    }
  };

  const rejectRequest = async (requestId: string, rejectionReason: string) => {
    try {
      await requestClient.rejectRequest(requestId, rejectionReason);
      message.success('Request rejected successfully!');
      return true;
    } catch (error) {
      handleError(error, 'Failed to reject request');
      return false;
    }
  };

  const printRequest = async (requestId: string) => {
    try {
      const pdfBlob = await requestClient.printRequest(requestId);
      const url = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          printWindow.onbeforeunload = () => URL.revokeObjectURL(url);
        };
      } else {
        message.error('Failed to open print window');
      }
      return true;
    } catch (error) {
      handleError(error, 'Failed to print documents');
      return false;
    }
  };

  const downloadAll = async (requestId: string, requestTitle: string) => {
    try {
      const zipBlob = await requestClient.downloadZip(requestId);
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${requestTitle}_signed_documents.zip`;
      link.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      handleError(error, 'Failed to download ZIP');
      return false;
    }
  };

  const delegateRequest = async (id: string) => {
    try {
      await requestClient.delegateRequest(id);
      message.success('Request delegated successfully!');
      return true;
    } catch (error) {
      handleError(error, 'Failed to delegate request');
      return false;
    }
  };

  return {
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
  };
};