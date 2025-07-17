import { useState, useEffect } from "react";
import { requestClient } from "../store";
// import { handleError } from "../utils/errorUtils";
import { Request } from "../@types/interfaces/Request";

export const useRequest = (id: string | undefined) => {
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRequest = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await requestClient.getRequest(id);
      setRequest({
        ...data,
        createdBy: data.createdBy ?? "",
        documents: (data.documents || []).map((doc: any) => ({
          ...doc,
          signStatus: doc.signStatus,
          data: doc.data || {},
          rejectionReason: doc.rejectionReason,
        })),
        templateVariables: data.templateVariables || [],
      });
    } catch (error) {
    //   handleError(error, "Failed to fetch request");
    console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  return { request, loading, fetchRequest };
};
