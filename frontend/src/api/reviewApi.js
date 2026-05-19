import api from './index';

export const reviewApi = {
  create: (review) => api.post('/reviews', review).then((r) => r.data),
  getAll: async () => {
    const response = await api.get('/reviews');
    return Array.isArray(response.data) ? response.data : (response.data?.reviews || []);
  },
  getByVehicle: async (vehicleId) => {
    const response = await api.get(`/reviews/vehicle/${vehicleId}`);
    return Array.isArray(response.data) ? response.data : (response.data?.reviews || []);
  },
  getByUser: async (userId) => {
    const response = await api.get(`/reviews/user/${userId}`);
    return Array.isArray(response.data) ? response.data : (response.data?.reviews || []);
  },
  update: (id, review) => api.put(`/reviews/${id}`, review).then((r) => r.data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export default reviewApi;
