import { useState } from 'react';
import { message } from 'antd';
import { Signature } from '../@types/interfaces/Requests';
import { requestClient } from '../store';

export const useSignatures = () => {
  const [signatures, setSignatures] = useState<Signature[]>([]);

  const fetchSignatures = async () => {
    try {
      const data = await requestClient.getSignatures();
      setSignatures(
        data.map((item) => ({
          id: item.id,
          name: item.userId,
          url: item.url,
          createdAt: item.createdBy,
        }))
      );
    } catch (error: any) {
      if (!error.message.includes('404')) {
        message.error('Failed to fetch signatures');
      }
      setSignatures([]);
    }
  };

  return { signatures, fetchSignatures };
};