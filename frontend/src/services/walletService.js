import api from '../api';

const BASE_URL = '/wallet';

export const getWalletInfo = async (userId) => {
  try {
    const response = await api.get(`${BASE_URL}/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet info:', error);
    return { loyaltyPoints: 0, rentalCredit: 0.0, referralReward: 0.0, updatedAt: '' };
  }
};

export const getWalletHistory = async (userId) => {
  try {
    const response = await api.get(`${BASE_URL}/history/${userId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching wallet history:', error);
    return [];
  }
};

export const addCredit = async (userId, amount, description) => {
  try {
    const response = await api.post(`${BASE_URL}/add-credit`, { userId, amount, description });
    return response.data;
  } catch (error) {
    console.error('Error adding credit:', error);
    throw error;
  }
};

export const useCredit = async (userId, amount, description) => {
  try {
    const response = await api.post(`${BASE_URL}/use-credit`, { userId, amount, description });
    return response.data;
  } catch (error) {
    console.error('Error using credit:', error);
    throw error;
  }
};
