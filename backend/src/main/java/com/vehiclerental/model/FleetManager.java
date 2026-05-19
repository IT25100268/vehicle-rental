package com.vehiclerental.model;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class FleetManager {

    private String id;
    private String name;
    private String location;

    private List<Vehicle> vehicles = new ArrayList<>();

    public FleetManager() {
        this.id = UUID.randomUUID().toString();
    }

    public FleetManager(String name, String location) {
        this();
        this.name = name;
        this.location = location;
    }

    public void addVehicle(Vehicle vehicle) {
        if (vehicle != null) {
            this.vehicles.add(vehicle);
        }
    }

    public int getFleetSize() {
        return vehicles.size();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocation() { return location; }
    public void setLocation(String loc) { this.location = loc; }

    public List<Vehicle> getVehicles() { return vehicles; }
    public void setVehicles(List<Vehicle> vehicles) { this.vehicles = vehicles; }
}
