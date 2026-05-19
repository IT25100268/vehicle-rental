import api from './index.jsx';

const feedbackApi = {
  create: (feedback) => api.post('/feedback', feedback),
  getAll: () => api.get('/feedback').then(res => res.data),
  getByUser: (userId) => api.get(`/feedback/user/${userId}`).then(res => res.data),
  delete: (id) => api.delete(`/feedback/${id}`),
};

export default feedbackApi;
