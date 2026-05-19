import api from './index';

/** Support tickets under {@code /api/support} (backend {@link com.vehiclerental.model.SupportTicket}). */
export const supportApi = {
  create: (ticket) => api.post('/support', ticket).then((r) => r.data),

  getAll: () => api.get('/support').then((r) => (Array.isArray(r.data) ? r.data : [])),

  getById: (id) => api.get(`/support/${id}`).then((r) => r.data),

  getByUser: (userId) => api.get(`/support/user/${userId}`).then((r) => (Array.isArray(r.data) ? r.data : [])),

  getByStatus: (status) => api.get(`/support/status/${status}`).then((r) => (Array.isArray(r.data) ? r.data : [])),

  reply: (id, message, sender = 'USER') =>
    api.put(`/support/${id}/reply`, { message, sender }).then((r) => r.data),

  adminReply: (id, message) =>
    api.put(`/support/${id}/admin-reply`, { message }).then((r) => r.data),

  resolve: (id) => api.put(`/support/${id}/resolve`).then((r) => r.data),

  update: (id, ticket) => api.put(`/support/${id}`, ticket).then((r) => r.data),

  delete: (id) => api.delete(`/support/${id}`),
};

export default supportApi;
