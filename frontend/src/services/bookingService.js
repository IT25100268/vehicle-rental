/**
 * BookingService
 * 
 * Legacy wrapper for bookingApi.
 * Communicates with the Spring Boot backend.
 */

import bookingApi from '../api/bookingApi';

export const getAllBookings = bookingApi.getAll;
export const getBookingsByUser = bookingApi.getByUser;
export const createBooking = bookingApi.create;
export const cancelBooking = bookingApi.cancel;
export const updateBookingStatus = bookingApi.updateStatus;
