/**
 * AuthService
 * 
 * Legacy wrapper for authApi.
 * Communicates with the Spring Boot backend.
 */

import authApi from '../api/authApi';

export const register = authApi.register;
export const login = authApi.login;
export const logout = authApi.logout;
export const getCurrentUser = authApi.getCurrentUser;
export const forgotPassword = authApi.forgotPassword;
export const resetPassword = authApi.resetPassword;
export const changePassword = authApi.changePassword;
