import api from './index';

/** Bookings — matches {@code BookingController} ({@code /api/bookings}). */
export const bookingApi = {
  getAll: async () => {
    const res = await api.get('/bookings');
    return Array.isArray(res.data) ? res.data : [];
  },

  getByUser: async (userId) => {
    const res = await api.get(`/bookings/user/${userId}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  create: (bookingData) => api.post('/bookings', bookingData).then((r) => r.data),

  cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }).then((r) => r.data),

  updateStatus: (id, status, reason) =>
    api.put(`/bookings/${id}/status`, { status, reason }).then((r) => r.data),

  edit: (id, editData) => api.put(`/bookings/${id}/edit`, editData).then((r) => r.data),
  payEdit: (id) => api.post(`/bookings/${id}/pay-edit`).then((r) => r.data),
  calculatePrice: (bookingData) => api.post('/bookings/calculate-price', bookingData).then((r) => r.data),
};

export default bookingApi;
