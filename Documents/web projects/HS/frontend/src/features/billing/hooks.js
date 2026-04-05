import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi } from './api';

export const useInvoices = (params) => {
  const queryKey = useMemo(() => ['billing', 'invoices', params], [params]);

  return useQuery({
    queryKey,
    queryFn: () => billingApi.listInvoices(params),
    staleTime: 30 * 1000,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingApi.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'invoices'] });
    },
  });
};

export const useMarkInvoicePaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingApi.markPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'invoices'] });
    },
  });
};
