import { apiClient } from '../../api/client';

export const prescriptionsApi = {
  create(payload) {
    return apiClient.post('/prescriptions', payload).then((res) => res.data.data);
  },
  update({ prescriptionId, payload }) {
    return apiClient.patch(`/prescriptions/${prescriptionId}`, payload).then((res) => res.data.data);
  },
  list(params) {
    return apiClient.get('/prescriptions', { params }).then((res) => ({
      items: res.data.data,
      meta: res.data.meta,
    }));
  },
};
