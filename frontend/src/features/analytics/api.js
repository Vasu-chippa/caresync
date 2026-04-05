import { apiClient } from '../../api/client';

export const analyticsApi = {
  getAdmin(days = 14) {
    return apiClient.get('/analytics/admin', { params: { days } }).then((res) => res.data.data);
  },
  getAdminEarnings(days = 30) {
    return apiClient.get('/analytics/admin/earnings', { params: { days } }).then((res) => res.data.data);
  },
  getDoctor(days = 14) {
    return apiClient.get('/analytics/doctor', { params: { days } }).then((res) => res.data.data);
  },
};
