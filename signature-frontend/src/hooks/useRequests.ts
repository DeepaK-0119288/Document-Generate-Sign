import { useState, useEffect } from 'react';
import { message } from 'antd';
import { Request } from '../@types/interfaces/Requests';
import { requestClient } from '../store';
import { signStatus, signStatusDisplay } from '../libs/constants';

export const useRequests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await requestClient.getRequests();
      const sortedRequests = (data as Request[]).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const mappedData = sortedRequests.map((req: any) => ({
        ...req,
        rawStatus: req.status
          ? Number(
              Object.keys(signStatusDisplay).find(
                (key) => signStatusDisplay[key as unknown as keyof typeof signStatusDisplay] === req.status
              )
            )
          : signStatus.unsigned,
      }));
      setRequests(mappedData);
      setFilteredRequests(mappedData);
    } catch (error) {
      message.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const filtered = requests.filter((request) =>
      request.title.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredRequests(filtered);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return { requests, filteredRequests, searchQuery, loading, handleSearch, fetchRequests };
};