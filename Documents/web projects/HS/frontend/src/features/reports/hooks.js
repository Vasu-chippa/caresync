import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from './api';

export const useReports = (params) => {
  const queryKey = useMemo(() => ['reports', 'list', params], [params]);

  return useQuery({
    queryKey,
    queryFn: () => reportsApi.listReports(params),
    staleTime: 30 * 1000,
  });
};

export const useUploadReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reportsApi.uploadReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'list'] });
    },
  });
};

export const useDownloadReport = () => {
  return useMutation({
    mutationFn: ({ reportId, fileName }) => reportsApi.downloadReport(reportId, fileName),
  });
};
