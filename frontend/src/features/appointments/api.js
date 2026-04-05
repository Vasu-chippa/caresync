import { apiClient } from '../../api/client';

export const appointmentsApi = {
  getAvailability({ doctorId, date }) {
    return apiClient
      .get('/appointments/availability', { params: { doctorId, date } })
      .then((res) => res.data.data);
  },

  bookAppointment(payload) {
    return apiClient.post('/appointments/book', payload).then((res) => res.data.data);
  },

  listAppointments(params) {
    return apiClient.get('/appointments', { params }).then((res) => ({
      items: res.data.data,
      meta: res.data.meta,
    }));
  },

  cancelAppointment(payload) {
    return apiClient.delete('/appointments/cancel', { data: payload }).then((res) => res.data.data);
  },

  respondAppointment(payload) {
    return apiClient.patch('/appointments/respond', payload).then((res) => res.data.data);
  },
};
