import api from './index';

/** Mirrors backend {@code Notification} and {@code /api/notifications} routes. */
export const notificationApi = {
  listForUser: async (userId, role) => {
    const res = await api.get('/notifications', {
      params: { userId, role },
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  create: (notification) => api.post('/notifications', notification).then((r) => r.data),

  markRead: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data),

  markUnread: (id) => api.put(`/notifications/${id}/unread`).then((r) => r.data),

  markAllRead: (userId, role) =>
    api.put('/notifications/read-all', null, {
      params: { userId, role },
    }),

  delete: (id) => api.delete(`/notifications/${id}`),

  clearAllForUser: (userId, role) =>
    api.delete('/notifications/clear', {
      params: { userId, role },
    }),

  broadcast: (payload) => api.post('/notifications/broadcast', payload).then((r) => r.data),
};

export default notificationApi;
