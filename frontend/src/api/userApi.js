import api from './index';

/** Users + wishlist — matches {@code UserController} ({@code /api/users}). */
export const userApi = {
  getAll: () => api.get('/users').then((r) => (Array.isArray(r.data) ? r.data : [])),

  getById: (id) => api.get(`/users/${id}`).then((r) => r.data),

  update: (id, userData) => api.put(`/users/${id}`, userData).then((r) => r.data),

  delete: (id) => api.delete(`/users/${id}`),

  changePassword: (id, oldPassword, newPassword) =>
    api.put(`/users/${id}/change-password`, { oldPassword, newPassword }),

  getWishlistVehicles: (userId) =>
    api.get(`/users/${userId}/wishlist`).then((r) => (Array.isArray(r.data) ? r.data : [])),

  toggleWishlist: (userId, vehicleId) =>
    api.post(`/users/${userId}/wishlist/toggle`, { vehicleId }).then((r) => r.data),
};

export default userApi;
