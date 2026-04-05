import { apiClient } from '../../api/client';
import { clearAccessToken, clearRefreshFailed, setAccessToken } from './session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const normalizeUser = (user) => {
  if (!user) {
    return user;
  }

  const avatarUrl = user.avatarUrl
    ? user.avatarUrl.startsWith('http')
      ? user.avatarUrl
      : `${API_ORIGIN}${user.avatarUrl}`
    : null;

  return {
    ...user,
    avatarUrl,
  };
};

export const authApi = {
  requestRegisterOtp(payload) {
    return apiClient.post('/auth/register/otp', payload).then((res) => res.data.data);
  },

  verifyRegisterOtp(payload) {
    return apiClient.post('/auth/register/verify', payload).then((res) => res.data.data);
  },

  login(payload) {
    return apiClient.post('/auth/login', payload).then((res) => {
      const token = res.data?.data?.tokens?.accessToken;
      if (token) {
        setAccessToken(token);
      }
      const data = res.data.data;
      return {
        ...data,
        user: normalizeUser(data?.user),
      };
    });
  },

  refresh() {
    return apiClient.post('/auth/refresh', {}).then((res) => {
      const token = res.data?.data?.tokens?.accessToken;
      if (token) {
        setAccessToken(token);
        clearRefreshFailed();
      }
      return res.data.data;
    });
  },

  logout() {
    return apiClient.post('/auth/logout', {}).then((res) => {
      clearAccessToken();
      clearRefreshFailed();
      return res.data.data;
    });
  },

  me() {
    return apiClient.get('/auth/me').then((res) => normalizeUser(res.data.data.user));
  },

  updateProfile(formData) {
    return apiClient
      .patch('/auth/me', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => normalizeUser(res.data.data.user));
  },

  sessions() {
    return apiClient.get('/auth/sessions').then((res) => res.data.data.sessions || []);
  },

  revokeSession(sessionId) {
    return apiClient.delete('/auth/sessions/revoke', { data: { sessionId } }).then((res) => res.data.data);
  },
};
