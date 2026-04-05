import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { prescriptionsApi } from './api';

export const usePrescriptionList = (params) => {
  const queryKey = useMemo(() => ['prescriptions', 'list', params], [params]);

  return useQuery({
    queryKey,
    queryFn: () => prescriptionsApi.list(params),
    staleTime: 30 * 1000,
  });
};

export const useCreatePrescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: prescriptionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', 'list'] });
    },
  });
};

export const useUpdatePrescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: prescriptionsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', 'list'] });
    },
  });
};
