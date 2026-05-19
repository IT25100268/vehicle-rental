package com.vehiclerental.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "vehicleCategory",
    defaultImpl = Car.class
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = Bike.class, name = "Bike"),
    @JsonSubTypes.Type(value = Car.class, name = "Car"),
    @JsonSubTypes.Type(value = ThreeWheeler.class, name = "ThreeWheeler"),
    @JsonSubTypes.Type(value = Van.class, name = "Van")
})
public abstract class Vehicle implements Rentable {

    protected String id;
    private String make;
    private String model;
    private int year;
    private double pricePerDay;
    private double pricePerHour;
    
    private String type;
    private String location;
    private boolean available;
    private List<String> photos;
    private String description;
    private String color;
    private String fuelType;
    private String vin;
    private int seatingCapacity;

    private String vehicleStatus = "AVAILABLE";
    private String maintenanceReason;
    private String maintenanceStartDate;
    private String maintenanceEndDate;
    private double averageRating = 0.0;
    private int reviewCount = 0;

    public Vehicle() {
        this.id = UUID.randomUUID().toString();
        this.available = true;
    }

    public Vehicle(String id, String make, String model, int year, double pricePerDay, double pricePerHour, String type, String location) {
        this.id = id;
        this.make = make;
        this.model = model;
        this.year = year;
        this.pricePerDay = pricePerDay;
        this.pricePerHour = pricePerHour;
        this.type = type;
        this.location = location;
        this.available = true;
    }

    @Override
    public abstract String getVehicleCategory();

    @Override
    public double calculateDailyRate() {
        return pricePerDay;
    }

    @Override
    public double calculateHourlyRate() {
        return pricePerHour;
    }

    @Override
    public boolean isAvailableForRent() {
        return "AVAILABLE".equalsIgnoreCase(vehicleStatus);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public boolean isAvailable() {
        return isAvailableForRent();
    }

    public void setAvailable(boolean available) {
        this.available = available;
        if (available && !"RENTED".equalsIgnoreCase(vehicleStatus)) {
            this.vehicleStatus = "AVAILABLE";
        } else if (!available && "AVAILABLE".equalsIgnoreCase(vehicleStatus)) {
            this.vehicleStatus = "UNAVAILABLE";
        }
    }

    public List<String> getPhotos() {
        return photos;
    }

    public void setPhotos(List<String> photos) {
        this.photos = photos;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getFuelType() {
        return fuelType;
    }

    public void setFuelType(String fuelType) {
        this.fuelType = fuelType;
    }

    public String getVin() {
        return vin;
    }

    public void setVin(String vin) {
        this.vin = vin;
    }

    public int getSeatingCapacity() {
        return seatingCapacity;
    }

    public void setSeatingCapacity(int seatingCapacity) {
        this.seatingCapacity = seatingCapacity;
    }

    public String getVehicleStatus() {
        return vehicleStatus;
    }

    public void setVehicleStatus(String vehicleStatus) {
        this.vehicleStatus = vehicleStatus;
        this.available = "AVAILABLE".equalsIgnoreCase(vehicleStatus);
    }

    public String getMaintenanceReason() {
        return maintenanceReason;
    }

    public void setMaintenanceReason(String maintenanceReason) {
        this.maintenanceReason = maintenanceReason;
    }

    public String getMaintenanceStartDate() {
        return maintenanceStartDate;
    }

    public void setMaintenanceStartDate(String maintenanceStartDate) {
        this.maintenanceStartDate = maintenanceStartDate;
    }

    public String getMaintenanceEndDate() {
        return maintenanceEndDate;
    }

    public void setMaintenanceEndDate(String maintenanceEndDate) {
        this.maintenanceEndDate = maintenanceEndDate;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public int getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(int reviewCount) {
        this.reviewCount = reviewCount;
    }
}
