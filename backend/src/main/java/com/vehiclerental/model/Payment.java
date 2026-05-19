package com.vehiclerental.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Payment {

    private String id;
    private String bookingId;
    private double amount;
    private String method;
    private String status;
    private String timestamp;
    private double refundAmount;
    private double cancellationFee;

    public Payment() {
        this.id = UUID.randomUUID().toString();
        this.timestamp = LocalDateTime.now().toString();
    }

    public Payment(double amount, String method, String status) {
        this();
        this.amount = amount;
        this.method = method;
        this.status = status;
    }

    public String getPaidAt() {
        return timestamp;
    }

    public void setPaidAt(String paidAt) {
        this.timestamp = paidAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public double getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(double refundAmount) {
        this.refundAmount = refundAmount;
    }

    public double getCancellationFee() {
        return cancellationFee;
    }

    public void setCancellationFee(double cancellationFee) {
        this.cancellationFee = cancellationFee;
    }
}
