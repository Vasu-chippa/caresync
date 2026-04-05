import { apiClient } from '../../api/client';

export const ratingsApi = {
  create(payload) {
    return apiClient.post('/ratings', payload).then((res) => res.data.data);
  },
  
  update(ratingId, payload) {
    return apiClient.patch(`/ratings/${ratingId}`, payload).then((res) => res.data.data);
  },
  
  delete(ratingId) {
    return apiClient.delete(`/ratings/${ratingId}`).then((res) => res.data);
  },
  
  getByDoctor(doctorId, page = 1, limit = 10) {
    return apiClient
      .get(`/ratings/doctor/${doctorId}`, { params: { page, limit } })
      .then((res) => res.data.data);
  },
  
  getStats(doctorId) {
    return apiClient.get(`/ratings/doctor/${doctorId}/stats`).then((res) => res.data.data);
  },
};
