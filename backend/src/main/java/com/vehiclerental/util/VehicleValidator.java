package com.vehiclerental.util;

import com.vehiclerental.model.Vehicle;

public class VehicleValidator {

    private VehicleValidator() {}

    public static void validateVehicle(Vehicle vehicle) {
        if (vehicle == null) {
            throw new IllegalArgumentException("Vehicle cannot be null.");
        }

        validateMake(vehicle.getMake());
        validateModel(vehicle.getModel());
        validateYear(vehicle.getYear());
        validateType(vehicle.getType());
        validatePricing(vehicle.getPricePerDay(), vehicle.getPricePerHour());
        validateLocation(vehicle.getLocation());

        if (vehicle.getVin() != null && !vehicle.getVin().isEmpty()) {
            validateVin(vehicle.getVin());
        }
    }

    public static void validateMake(String make) {
        if (make == null || make.trim().isEmpty()) {
            throw new IllegalArgumentException("Vehicle make is required (e.g. 'Toyota', 'Honda').");
        }
        if (make.trim().length() < 2) {
            throw new IllegalArgumentException("Vehicle make must be at least 2 characters.");
        }
    }

    public static void validateModel(String model) {
        if (model == null || model.trim().isEmpty()) {
            throw new IllegalArgumentException("Vehicle model is required (e.g. 'Corolla', 'Civic').");
        }
    }

    public static void validateYear(int year) {
        int currentYear = java.time.Year.now().getValue();
        if (year < 1990 || year > currentYear + 1) {
            throw new IllegalArgumentException(
                "Vehicle year must be between 1990 and " + (currentYear + 1) + "."
            );
        }
    }

    public static void validateType(String type) {
        if (type == null || type.trim().isEmpty()) {
            throw new IllegalArgumentException(
                "Vehicle type is required. Must be: Car, Bike, Van, or ThreeWheeler."
            );
        }
        switch (type.trim()) {
            case "Car", "Bike", "Van", "ThreeWheeler" -> {  }
            default -> throw new IllegalArgumentException(
                "Invalid vehicle type: '" + type + "'. Must be: Car, Bike, Van, or ThreeWheeler."
            );
        }
    }

    public static void validatePricing(double pricePerDay, double pricePerHour) {
        if (pricePerDay < 0) {
            throw new IllegalArgumentException("Price per day cannot be negative.");
        }
        if (pricePerHour < 0) {
            throw new IllegalArgumentException("Price per hour cannot be negative.");
        }
        if (pricePerDay > 0 && pricePerHour > 0 && pricePerDay < pricePerHour) {
            throw new IllegalArgumentException(
                "Price per day (LKR " + pricePerDay + ") should be greater than price per hour (LKR " + pricePerHour + ")."
            );
        }
    }

    public static void validateLocation(String location) {
        if (location == null || location.trim().isEmpty()) {
            throw new IllegalArgumentException("Vehicle location is required (e.g. 'Colombo', 'Kandy').");
        }
    }

    public static void validateVin(String vin) {
        if (vin == null || vin.trim().isEmpty()) {
            return;
        }
        String trimmed = vin.trim();
        if (trimmed.length() < 5 || trimmed.length() > 17) {
            throw new IllegalArgumentException(
                "VIN must be between 5 and 17 characters. Got: '" + vin + "'"
            );
        }
        if (!trimmed.matches("[A-Za-z0-9]+")) {
            throw new IllegalArgumentException(
                "VIN must contain only letters and numbers (no spaces or special characters)."
            );
        }
    }

    public static boolean isValidType(String type) {
        if (type == null) return false;
        return switch (type.trim()) {
            case "Car", "Bike", "Van", "ThreeWheeler" -> true;
            default -> false;
        };
    }
}
