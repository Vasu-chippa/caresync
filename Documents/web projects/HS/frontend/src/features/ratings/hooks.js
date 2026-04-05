import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ratingsApi } from './api';

export const useCreateRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ratingsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ratings', 'doctor', data.doctorId] });
      queryClient.invalidateQueries({ queryKey: ['ratings', 'stats', data.doctorId] });
    },
  });
};

export const useUpdateRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ratingId, payload }) => ratingsApi.update(ratingId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ratings', 'doctor', data.doctorId] });
      queryClient.invalidateQueries({ queryKey: ['ratings', 'stats', data.doctorId] });
    },
  });
};

export const useDeleteRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ratingsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
    },
  });
};

export const useRatingsByDoctor = (doctorId, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['ratings', 'doctor', doctorId, page, limit],
    queryFn: () => ratingsApi.getByDoctor(doctorId, page, limit),
    enabled: !!doctorId,
    staleTime: 60 * 1000,
  });
};

export const useDoctorRatingStats = (doctorId) => {
  return useQuery({
    queryKey: ['ratings', 'stats', doctorId],
    queryFn: () => ratingsApi.getStats(doctorId),
    enabled: !!doctorId,
    staleTime: 60 * 1000,
  });
};
