package com.vehiclerental.model;

public class Customer extends User {

    private String driverLicenseNumber;
    private int loyaltyPoints;
    private String referralCode;
    private int referralCount;

    public Customer() {
        super();
        setRole("USER");
    }

    public Customer(String name, String email, String password) {
        super(name, email, password, "USER");
        this.loyaltyPoints = 0;
        this.referralCount = 0;
    }

    public String getDriverLicenseNumber() {
        return driverLicenseNumber;
    }

    public void setDriverLicenseNumber(String driverLicenseNumber) {
        this.driverLicenseNumber = driverLicenseNumber;
    }

    public void addLoyaltyPoints(int points) {
        if (points > 0) {
            this.loyaltyPoints += points;
        }
    }

    public int getLoyaltyPoints() {
        return loyaltyPoints;
    }

    public void setLoyaltyPoints(int loyaltyPoints) {
        this.loyaltyPoints = loyaltyPoints;
    }

    public String getReferralCode() {
        return referralCode;
    }

    public void setReferralCode(String referralCode) {
        this.referralCode = referralCode;
    }

    public int getReferralCount() {
        return referralCount;
    }

    public void setReferralCount(int referralCount) {
        this.referralCount = referralCount;
    }
}
