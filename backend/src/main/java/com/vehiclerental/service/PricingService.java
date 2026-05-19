package com.vehiclerental.service;

import com.vehiclerental.model.*;
import org.springframework.stereotype.Service;

@Service
public class PricingService {

    public static final double BIKE_HOURLY  = 350.0;
    public static final double BIKE_DAILY   = 2500.0;

    public static final double THREE_WHEELER_HOURLY = 500.0;
    public static final double THREE_WHEELER_DAILY  = 3500.0;

    public static final double CAR_HOURLY   = 900.0;
    public static final double CAR_DAILY    = 5500.0;

    public static final double VAN_HOURLY   = 1400.0;
    public static final double VAN_DAILY    = 9000.0;

    public static final double CANCELLATION_FEE_RATE = 0.10;

    public double getHourlyRate(String vehicleType) {
        if (vehicleType == null) return CAR_HOURLY;
        return switch (vehicleType.trim()) {
            case "Bike"          -> BIKE_HOURLY;
            case "ThreeWheeler"  -> THREE_WHEELER_HOURLY;
            case "Van"           -> VAN_HOURLY;
            default              -> CAR_HOURLY;
        };
    }

    public double getDailyRate(String vehicleType) {
        if (vehicleType == null) return CAR_DAILY;
        return switch (vehicleType.trim()) {
            case "Bike"          -> BIKE_DAILY;
            case "ThreeWheeler"  -> THREE_WHEELER_DAILY;
            case "Van"           -> VAN_DAILY;
            default              -> CAR_DAILY;
        };
    }

    public double calculateDailyTotal(String vehicleType, int days) {
        int d = Math.max(1, days);
        return getDailyRate(vehicleType) * d;
    }

    public double calculateHourlyTotal(String vehicleType, int hours) {
        int h = Math.max(1, hours);
        return getHourlyRate(vehicleType) * h;
    }

    public double calculateCancellationFee(double totalPrice) {
        return totalPrice * CANCELLATION_FEE_RATE;
    }

    public double calculateLateFee(String vehicleType, int extraHours) {
        if (extraHours <= 0) return 0.0;
        return getHourlyRate(vehicleType) * extraHours;
    }

    public void applyPricing(Booking booking) {
        String vType = booking.getVehicleType() != null ? booking.getVehicleType() : "Car";
        booking.setPricePerDay(getDailyRate(vType));
        booking.setPricePerHour(getHourlyRate(vType));

        double total;
        String mode = booking.getRentalMode();
        if ("HOURLY".equalsIgnoreCase(mode)) {
            int hours = Math.max(1, booking.getBookingHours());
            total = calculateHourlyTotal(vType, hours);
        } else {
            int days = Math.max(1, booking.getBookingDays());
            total = calculateDailyTotal(vType, days);
        }

        booking.setTotalPrice(total);
        booking.setCancellationFee(calculateCancellationFee(total));
    }
}
