package com.vehiclerental.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Booking {

    private String id;
    private String userId;
    private String vehicleId;
    private User user;
    private Vehicle vehicle;

    private String userName;
    private String userEmail;
    private String vehicleName;
    private String vehiclePhoto;
    private String vehicleType;

    private String startDate;
    private String endDate;
    private int bookingDays;
    private int bookingHours;
    
    private String rentalMode = "DAILY";

    private double pricePerDay;
    private double pricePerHour;
    private double totalPrice;
    private double cancellationFee;
    private String status;

    private Payment payment;
    private String cancellationReason;
    private String cancelledAt;

    private String editedAt;
    private double originalTotalPrice;
    private double additionalAmountDue;
    private double rentalCreditAmount;
    private String editStatus = "NOT_EDITED";

    public Booking() {
        this.id = UUID.randomUUID().toString();
        this.status = "PENDING";
    }

    public String getBookingSummary() {
        return String.format(
            "Booking %s: %s rented by %s",
            id,
            vehicle != null ? vehicle.getMake() : vehicleName != null ? vehicleName : vehicleId,
            user != null ? user.getName() : userName != null ? userName : userId
        );
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(String vehicleId) {
        this.vehicleId = vehicleId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getVehicleName() {
        return vehicleName;
    }

    public void setVehicleName(String vehicleName) {
        this.vehicleName = vehicleName;
    }

    public String getVehiclePhoto() {
        return vehiclePhoto;
    }

    public void setVehiclePhoto(String vehiclePhoto) {
        this.vehiclePhoto = vehiclePhoto;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public int getBookingDays() {
        return bookingDays;
    }

    public void setBookingDays(int bookingDays) {
        this.bookingDays = bookingDays;
    }

    public int getBookingHours() {
        return bookingHours;
    }

    public void setBookingHours(int bookingHours) {
        this.bookingHours = bookingHours;
    }

    public String getRentalMode() {
        return rentalMode;
    }

    public void setRentalMode(String rentalMode) {
        this.rentalMode = rentalMode;
    }

    public double getPricePerDay() {
        return pricePerDay;
    }

    public void setPricePerDay(double pricePerDay) {
        this.pricePerDay = pricePerDay;
    }

    public double getPricePerHour() {
        return pricePerHour;
    }

    public void setPricePerHour(double pricePerHour) {
        this.pricePerHour = pricePerHour;
    }

    public double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public double getCancellationFee() {
        return cancellationFee;
    }

    public void setCancellationFee(double cancellationFee) {
        this.cancellationFee = cancellationFee;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Payment getPayment() {
        return payment;
    }

    public void setPayment(Payment payment) {
        this.payment = payment;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(String cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public String getEditedAt() {
        return editedAt;
    }

    public void setEditedAt(String editedAt) {
        this.editedAt = editedAt;
    }

    public double getOriginalTotalPrice() {
        return originalTotalPrice;
    }

    public void setOriginalTotalPrice(double originalTotalPrice) {
        this.originalTotalPrice = originalTotalPrice;
    }

    public double getAdditionalAmountDue() {
        return additionalAmountDue;
    }

    public void setAdditionalAmountDue(double additionalAmountDue) {
        this.additionalAmountDue = additionalAmountDue;
    }

    public double getRentalCreditAmount() {
        return rentalCreditAmount;
    }

    public void setRentalCreditAmount(double rentalCreditAmount) {
        this.rentalCreditAmount = rentalCreditAmount;
    }

    public String getEditStatus() {
        return editStatus;
    }

    public void setEditStatus(String editStatus) {
        this.editStatus = editStatus;
    }
}
