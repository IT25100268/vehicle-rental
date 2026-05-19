import api from './index';

/** Read-only payment views from bookings ({@code /api/payments}). */
export const paymentApi = {
  listByUser: (userId) =>
    api.get(`/payments/user/${userId}`).then((r) => (Array.isArray(r.data) ? r.data : [])),

  getByBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`).then((r) => r.data),
};

export default paymentApi;
