package com.vehiclerental.model;

public class Van extends Vehicle {
    private String vanBodyType;
    private int passengerCapacity;

    public Van() {
        super();
        this.setType("Van");
    }

    @Override
    public String getVehicleCategory() {
        return "Van";
    }

    public String getVanBodyType() {
        return vanBodyType;
    }

    public void setVanBodyType(String vanBodyType) {
        this.vanBodyType = vanBodyType;
    }

    public int getPassengerCapacity() {
        return passengerCapacity;
    }

    public void setPassengerCapacity(int passengerCapacity) {
        this.passengerCapacity = passengerCapacity;
    }
}
