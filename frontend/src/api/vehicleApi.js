import api from './index';

/** Vehicle CRUD + compare — field names match backend {@code Vehicle}. */
export const vehicleApi = {
  getAll: async () => {
    const res = await api.get('/vehicles');
    return Array.isArray(res.data) ? res.data : [];
  },

  getAvailable: async () => {
    const res = await api.get('/vehicles/available');
    return Array.isArray(res.data) ? res.data : [];
  },

  getById: async (id) => {
    const res = await api.get(`/vehicles/${id}`);
    return res.data;
  },

  /** POST body: list of vehicle ids */
  compare: async (vehicleIds) => {
    const res = await api.post('/vehicles/compare', vehicleIds ?? []);
    return Array.isArray(res.data) ? res.data : [];
  },

  create: async (vehicle) => {
    const payload = {
      ...vehicle,
      vehicleCategory: vehicle.vehicleCategory || vehicle.type,
    };
    const res = await api.post('/vehicles', payload);
    return res.data;
  },

  update: async (id, vehicle) => {
    const res = await api.put(`/vehicles/${id}`, vehicle);
    return res.data;
  },

  updateMaintenance: async (id, maintenanceData) => {
    const res = await api.put(`/vehicles/${id}/maintenance`, maintenanceData);
    return res.data;
  },

  setAvailable: async (id) => {
    const res = await api.put(`/vehicles/${id}/available`);
    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await api.put(`/vehicles/${id}/status`, null, {
      params: { status }
    });
    return res.data;
  },

  delete: (id) => api.delete(`/vehicles/${id}`),
};

export default vehicleApi;
