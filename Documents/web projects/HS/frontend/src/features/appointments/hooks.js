import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from './api';

export const useDoctorAvailability = ({ doctorId, date }) => {
  const enabled = Boolean(doctorId && date);

  return useQuery({
    queryKey: ['appointments', 'availability', doctorId, date],
    queryFn: () => appointmentsApi.getAvailability({ doctorId, date }),
    enabled,
    staleTime: 60 * 1000,
  });
};

export const useBookAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appointmentsApi.bookAppointment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['appointments', 'availability', variables.doctorId, variables.date],
      });
      queryClient.invalidateQueries({
        queryKey: ['appointments', 'list'],
      });
    },
  });
};

export const useAppointmentsList = (params) => {
  const queryKey = useMemo(() => ['appointments', 'list', params], [params]);

  return useQuery({
    queryKey,
    queryFn: () => appointmentsApi.listAppointments(params),
    staleTime: 30 * 1000,
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appointmentsApi.cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'list'] });
    },
  });
};

export const useRespondAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: appointmentsApi.respondAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'list'] });
    },
  });
};
