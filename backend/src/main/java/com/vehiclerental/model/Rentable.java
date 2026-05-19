package com.vehiclerental.model;

public interface Rentable {

    double calculateDailyRate();

    double calculateHourlyRate();

    boolean isAvailableForRent();

    String getVehicleCategory();

    default double calculateTotalForDays(int days) {
        int d = Math.max(1, days);
        return calculateDailyRate() * d;
    }

    default double calculateTotalForHours(int hours) {
        int h = Math.max(1, hours);
        return calculateHourlyRate() * h;
    }
}
