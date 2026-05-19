package com.vehiclerental.model;

public class Bike extends Vehicle {
    private int engineCC;
    private String bikeType;

    public Bike() {
        super();
        this.setType("Bike");
    }

    @Override
    public String getVehicleCategory() {
        return "Bike";
    }

    public int getEngineCC() {
        return engineCC;
    }

    public void setEngineCC(int engineCC) {
        this.engineCC = engineCC;
    }

    public String getBikeType() {
        return bikeType;
    }

    public void setBikeType(String bikeType) {
        this.bikeType = bikeType;
    }
}
