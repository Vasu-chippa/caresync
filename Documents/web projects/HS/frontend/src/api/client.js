import axios from 'axios';
import {
  clearAccessToken,
  clearRefreshFailed,
  getAccessToken,
  getRefreshInFlight,
  hasRefreshFailed,
  markRefreshFailed,
  setAccessToken,
  setRefreshInFlight,
} from '../features/auth/session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const requestUrl = originalRequest?.url || '';

    const shouldTryRefresh =
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !hasRefreshFailed() &&
      !requestUrl.includes('/auth/login') &&
      !requestUrl.includes('/auth/register') &&
      !requestUrl.includes('/auth/refresh') &&
      !requestUrl.includes('/auth/logout');

    if (shouldTryRefresh) {
      originalRequest._retry = true;

      let refreshPromise = getRefreshInFlight();

      if (!refreshPromise) {
        refreshPromise = apiClient
          .post('/auth/refresh', {})
          .then((res) => {
            const token = res.data?.data?.tokens?.accessToken;
            if (token) {
              setAccessToken(token);
              clearRefreshFailed();
            }
            return token;
          })
          .catch((refreshError) => {
            clearAccessToken();
            markRefreshFailed();
            throw refreshError;
          })
          .finally(() => {
            setRefreshInFlight(null);
          });

        setRefreshInFlight(refreshPromise);
      }

      const refreshedToken = await refreshPromise;

      if (refreshedToken) {
        originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
      }

      return apiClient(originalRequest);
    }

    const serverData = error?.response?.data;
    const detailFields = serverData?.error?.fields;
    const detailText = Array.isArray(detailFields)
      ? detailFields.map((field) => `${field.field}: ${field.message}`).join('; ')
      : null;

    const message =
      (serverData?.message && detailText ? `${serverData.message} - ${detailText}` : serverData?.message) ||
      (error?.request ? 'Cannot connect to server. Please ensure backend is running.' : null) ||
      'Request failed';

    return Promise.reject(new Error(message));
  }
);
