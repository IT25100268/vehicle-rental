import api from './index';

export const authApi = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response;
  },

  register: async (userData) => {
    const type = userData.type || 'Customer';
    const role = userData.role || (type === 'Admin' ? 'ADMIN' : 'USER');
    const response = await api.post('/auth/signup', {
      ...userData,
      type,
      role,
    });
    return response;
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  },

  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),

  changePassword: (userId, oldPassword, newPassword) =>
    api.put('/auth/change-password', { userId, oldPassword, newPassword }),
};

export default authApi;
