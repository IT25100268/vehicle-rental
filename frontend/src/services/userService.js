/**
 * UserService
 * 
 * Legacy wrapper for userApi.
 * Communicates with the Spring Boot backend.
 */

import userApi from '../api/userApi';

export const getAllUsers = userApi.getAll;
export const getById = userApi.getById;
export const updateUser = userApi.update;
export const deleteUser = userApi.delete;

// Compatibility helper
export const findUserByEmail = async (email) => {
  const users = await userApi.getAll();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};
