import { useState, useEffect } from 'react';
import { message } from 'antd';
import { Officer } from '../@types/interfaces/Requests';
import { requestClient } from '../store';

export const useOfficers = () => {
  const [officers, setOfficers] = useState<Officer[]>([]);

  const fetchOfficers = async () => {
    try {
      const data = await requestClient.getOfficers();
      setOfficers(data);
    } catch (error) {
      message.error('Failed to fetch officers. Please try again later.');
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  return { officers, fetchOfficers };
};