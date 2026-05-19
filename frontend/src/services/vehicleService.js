/**
 * Thin re-exports over vehicleApi for legacy imports.
 */
import vehicleApi from '../api/vehicleApi';

export const getAllVehicles = vehicleApi.getAll;
export const getAvailableVehicles = vehicleApi.getAvailable;
export const getVehicleById = vehicleApi.getById;
export const compareVehicles = vehicleApi.compare;
export const addVehicle = vehicleApi.create;
export const updateVehicle = vehicleApi.update;
export const deleteVehicle = vehicleApi.delete;
