import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from './api';

export const useAdminAnalytics = (days = 14) => {
  return useQuery({
    queryKey: ['analytics', 'admin', days],
    queryFn: () => analyticsApi.getAdmin(days),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminEarnings = (days = 30) => {
  return useQuery({
    queryKey: ['analytics', 'admin', 'earnings', days],
    queryFn: () => analyticsApi.getAdminEarnings(days),
    staleTime: 2 * 60 * 1000,
  });
};

export const useDoctorAnalytics = (days = 14) => {
  return useQuery({
    queryKey: ['analytics', 'doctor', days],
    queryFn: () => analyticsApi.getDoctor(days),
    staleTime: 5 * 60 * 1000,
  });
};
