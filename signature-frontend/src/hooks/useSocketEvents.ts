import { useEffect } from 'react';
import { message } from 'antd';
import socket from '../client/socket';
import { useAppStore1 } from '../store/store';
import { useAppStore } from '../store';

export const useSocketEvents = (fetchRequests: () => Promise<void>) => {
  const { setSigningProgress } = useAppStore1();
  const { session } = useAppStore();
  const userId = session?.userId;

  useEffect(() => {
    socket.on('newRequestAssigned', async (data) => {
      if (userId === data.officerId) {
        message.info(`New request assigned: ${data.title}`);
        await fetchRequests();
      }
    });

    socket.on('documentRejected', async (data) => {
      if (userId === data.createdBy) {
        message.info(`Document Rejected - Reason: ${data.rejectionReason}`);
        await fetchRequests();
      }
    });

    socket.on('requestRejected', async (data) => {
      if (userId === data.createdBy) {
        message.info(`Request rejected: ${data.rejectionReason}`);
        await fetchRequests();
      }
    });

    socket.on('requestDelegated', async (data) => {
      if (userId === data.createdBy) {
        message.info('Request delegated successfully!');
        await fetchRequests();
      }
    });

    socket.on('requestInProcess', async (data) => {
      if (userId === data.createdBy || userId === data.officerId) {
        setSigningProgress(data.requestId, { current: data.current, total: data.total });
        // await fetchRequests();
      }
    });

    socket.on('requestSigned', async (data) => {
      if (userId === data.createdBy || userId === data.officerId) {
        await fetchRequests();
      }
    });

    socket.on('requestDispatched', async (data) => {
      if (userId === data.createdBy || userId === data.officerId) {
        await fetchRequests();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      message.error('Failed to connect to real-time updates. Please refresh the page.');
    });

    return () => {
      socket.off('newRequestAssigned');
      socket.off('documentRejected');
      socket.off('requestRejected');
      socket.off('requestDelegated');
      socket.off('requestInProgress');
      socket.off('requestSigned');
      socket.off('requestDispatched');
      socket.off('connect_error');
    };
  }, [userId, fetchRequests, setSigningProgress]);
};