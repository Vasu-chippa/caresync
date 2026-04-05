import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from './api';
import {
  clearAccessToken,
  getAccessToken,
  hasRefreshFailed,
  markRefreshFailed,
} from './session';

let bootstrapPromise = null;

const ensureAccessToken = async () => {
  if (getAccessToken()) {
    return true;
  }

  if (hasRefreshFailed()) {
    return false;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = authApi
      .refresh()
      .then(() => Boolean(getAccessToken()))
      .catch(() => {
        clearAccessToken();
        markRefreshFailed();
        return false;
      })
      .finally(() => {
        bootstrapPromise = null;
      });
  }

  return bootstrapPromise;
};

export const useMe = (options = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['auth', 'me'],
    enabled,
    queryFn: async () => {
      const hasAccessToken = await ensureAccessToken();

      if (!hasAccessToken) {
        throw new Error('Unauthenticated');
      }

      return authApi.me();
    },
    retry: false,
    staleTime: 30 * 1000,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
};

export const useSessions = () => {
  return useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: authApi.sessions,
    staleTime: 10 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth', 'me'], updatedUser);
    },
  });
};

export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    },
  });
};
