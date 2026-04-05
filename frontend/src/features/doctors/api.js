import { apiClient } from '../../api/client';

export const doctorsApi = {
  list() {
    return apiClient.get('/doctors').then((res) => res.data.data || []);
  },
  me() {
    return apiClient.get('/doctors/me').then((res) => res.data.data.profile);
  },
  updateMe(payload) {
    return apiClient.patch('/doctors/me', payload).then((res) => res.data.data.profile);
  },
};
