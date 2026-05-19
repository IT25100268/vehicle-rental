import api from './index';

/** Admin console — paths match {@code AdminController} ({@code /api/admin/...}). */
export const adminApi = {
  getStats: () => api.get('/admin/stats'),

  getUsers: () => api.get('/admin/users').then((r) => (Array.isArray(r.data) ? r.data : [])),

  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  getVehicles: () => api.get('/admin/vehicles').then((r) => (Array.isArray(r.data) ? r.data : [])),

  createVehicle: (vehicle) => api.post('/admin/vehicles', vehicle).then((r) => r.data),

  updateVehicle: (id, vehicle) => api.put(`/admin/vehicles/${id}`, vehicle).then((r) => r.data),

  deleteVehicle: (id) => api.delete(`/admin/vehicles/${id}`),

  getBookings: () => api.get('/admin/bookings').then((r) => (Array.isArray(r.data) ? r.data : [])),

  deleteBooking: (id) => api.delete(`/admin/bookings/${id}`),

  getSupportTickets: () => api.get('/admin/messages').then((r) => (Array.isArray(r.data) ? r.data : [])),

  replySupportTicket: (id, message) =>
    api.post(`/admin/reply/${id}`, { message }).then((r) => r.data),

  getReviews: () => api.get('/admin/reviews').then((r) => (Array.isArray(r.data) ? r.data : [])),

  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),

  getFleet: () => api.get('/admin/fleet').then((r) => (Array.isArray(r.data) ? r.data : [])),

  addAdmin: (adminUser) => api.post('/admin/add-admin', adminUser).then((r) => r.data),
};

export default adminApi;
