import { useQuery } from '@tanstack/react-query';
import { doctorsApi } from './api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDoctors = () => {
  return useQuery({
    queryKey: ['doctors', 'list'],
    queryFn: doctorsApi.list,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDoctorProfile = () => {
  return useQuery({
    queryKey: ['doctors', 'me'],
    queryFn: doctorsApi.me,
    staleTime: 60 * 1000,
  });
};

export const useUpdateDoctorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: doctorsApi.updateMe,
    onSuccess: (profile) => {
      queryClient.setQueryData(['doctors', 'me'], profile);
      queryClient.invalidateQueries({ queryKey: ['doctors', 'list'] });
    },
  });
};
