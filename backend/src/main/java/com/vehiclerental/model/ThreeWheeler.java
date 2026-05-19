package com.vehiclerental.model;

public class ThreeWheeler extends Vehicle {
    private String routeType;
    private boolean isElectric;

    public ThreeWheeler() {
        super();
        this.setType("ThreeWheeler");
    }

    @Override
    public String getVehicleCategory() {
        return "ThreeWheeler";
    }

    public String getRouteType() {
        return routeType;
    }

    public void setRouteType(String routeType) {
        this.routeType = routeType;
    }

    public boolean isElectric() {
        return isElectric;
    }

    public void setElectric(boolean electric) {
        isElectric = electric;
    }
}
