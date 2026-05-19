package com.vehiclerental.service;

import com.vehiclerental.model.*;
import com.vehiclerental.repository.MaintenanceRepository;
import com.vehiclerental.repository.VehicleRepository;
import com.vehiclerental.util.VehicleValidator;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository repository;
    private final MaintenanceRepository maintenanceRepository;
    private final PricingService pricingService;
    private final NotificationService notificationService;

    public VehicleService(VehicleRepository repository, 
                          MaintenanceRepository maintenanceRepository,
                          PricingService pricingService, 
                          NotificationService notificationService) {
        this.repository = repository;
        this.maintenanceRepository = maintenanceRepository;
        this.pricingService = pricingService;
        this.notificationService = notificationService;
    }

    public Vehicle create(Vehicle vehicle) {
        VehicleValidator.validateVehicle(vehicle);

        if (vehicle.getVehicleStatus() == null) {
            vehicle.setVehicleStatus("AVAILABLE");
        }
        
        applyDefaultPricing(vehicle);

        Vehicle saved = repository.save(vehicle);

        notificationService.sendBroadcast(
            "USER",
            "VEHICLE_ADDED",
            "New Vehicle Alert!",
            "A new " + saved.getMake() + " " + saved.getModel() + " is now available for booking in " + saved.getLocation() + "."
        );

        return saved;
    }

    public List<Vehicle> getAll() {
        return repository.findAll();
    }

    public List<Vehicle> getAvailable() {
        return repository.findAvailable();
    }

    public Vehicle getById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + id));
    }

    public List<Vehicle> getByType(String type) {
        VehicleValidator.validateType(type);
        return repository.findByType(type);
    }

    public Vehicle update(String id, Vehicle updatedData) {
        Vehicle existing = getById(id);

        existing.setMake(updatedData.getMake());
        existing.setModel(updatedData.getModel());
        existing.setYear(updatedData.getYear());
        existing.setType(updatedData.getType());
        existing.setLocation(updatedData.getLocation());
        existing.setDescription(updatedData.getDescription());
        existing.setColor(updatedData.getColor());
        existing.setFuelType(updatedData.getFuelType());
        existing.setSeatingCapacity(updatedData.getSeatingCapacity());

        if (updatedData.getPhotos() != null) {
            existing.setPhotos(updatedData.getPhotos());
        }

        if (updatedData.getPricePerDay() > 0) {
            existing.setPricePerDay(updatedData.getPricePerDay());
        }
        if (updatedData.getPricePerHour() > 0) {
            existing.setPricePerHour(updatedData.getPricePerHour());
        }

        String oldStatus = existing.getVehicleStatus();
        existing.setVehicleStatus(updatedData.getVehicleStatus());
        
        if (updatedData.getMaintenanceReason() != null) {
            existing.setMaintenanceReason(updatedData.getMaintenanceReason());
        }
        if (updatedData.getMaintenanceStartDate() != null) {
            existing.setMaintenanceStartDate(updatedData.getMaintenanceStartDate());
        }
        if (updatedData.getMaintenanceEndDate() != null) {
            existing.setMaintenanceEndDate(updatedData.getMaintenanceEndDate());
        }

        Vehicle saved = repository.save(existing);

        if (!saved.getVehicleStatus().equals(oldStatus)) {
            handleStatusChangeNotifications(saved, oldStatus);
        }

        return saved;
    }

    private void handleStatusChangeNotifications(Vehicle saved, String oldStatus) {
        String type = "VEHICLE_STATUS_UPDATE";
        String title = "Vehicle Status Changed";
        String msg = "The " + saved.getMake() + " " + saved.getModel() + " status is now: " + saved.getVehicleStatus().replace("_", " ") + ".";
        
        notificationService.sendBroadcast("ADMIN", type, title, msg);
        
        if ("UNDER_MAINTENANCE".equalsIgnoreCase(saved.getVehicleStatus())) {
             notificationService.sendBroadcast("USER", "VEHICLE_MAINTENANCE", "Maintenance Alert", 
                 "The " + saved.getMake() + " " + saved.getModel() + " is temporarily unavailable due to maintenance.");
        } else if ("AVAILABLE".equalsIgnoreCase(saved.getVehicleStatus()) && !"AVAILABLE".equals(oldStatus)) {
             notificationService.sendBroadcast("USER", "VEHICLE_AVAILABLE", "Vehicle Back!", 
                 "Great news! The " + saved.getMake() + " " + saved.getModel() + " is now available for booking.");
        }
    }

    public Vehicle setAvailability(String id, boolean available) {
        Vehicle vehicle = getById(id);
        vehicle.setAvailable(available);
        return repository.save(vehicle);
    }

    public Vehicle updateMaintenance(String id, Vehicle maintenanceData) {
        Vehicle vehicle = getById(id);
        String oldStatus = vehicle.getVehicleStatus();
        
        vehicle.setVehicleStatus("UNDER_MAINTENANCE");
        vehicle.setMaintenanceReason(maintenanceData.getMaintenanceReason());
        vehicle.setMaintenanceStartDate(maintenanceData.getMaintenanceStartDate());
        vehicle.setMaintenanceEndDate(maintenanceData.getMaintenanceEndDate());
        
        Vehicle saved = repository.save(vehicle);
        syncMaintenance(saved);
        
        if (!"UNDER_MAINTENANCE".equals(oldStatus)) {
            notificationService.sendBroadcast(
                "USER",
                "VEHICLE_MAINTENANCE",
                "Vehicle Under Maintenance",
                "The " + saved.getMake() + " " + saved.getModel() + " is now under maintenance." + 
                (saved.getMaintenanceEndDate() != null ? " Expected back on " + saved.getMaintenanceEndDate() : "")
            );
        }
        
        return saved;
    }

    public Vehicle updateStatus(String id, String status) {
        Vehicle vehicle = getById(id);
        String oldStatus = vehicle.getVehicleStatus();
        
        vehicle.setVehicleStatus(status);
        
        if ("AVAILABLE".equals(status)) {
            vehicle.setMaintenanceReason(null);
            vehicle.setMaintenanceStartDate(null);
            vehicle.setMaintenanceEndDate(null);
        }
        
        Vehicle saved = repository.save(vehicle);
        syncMaintenance(saved);
        
        if ("AVAILABLE".equals(status) && !"AVAILABLE".equals(oldStatus)) {
            notificationService.sendBroadcast(
                "USER",
                "VEHICLE_AVAILABLE",
                "Vehicle Available!",
                "Great news! The " + saved.getMake() + " " + saved.getModel() + " is back and available for booking."
            );
        }
        
        return saved;
    }

    public void delete(String id) {
        getById(id);
        repository.deleteById(id);
    }

    public Vehicle save(Vehicle vehicle) {
        Vehicle saved = repository.save(vehicle);
        if ("UNDER_MAINTENANCE".equals(saved.getVehicleStatus())) {
            syncMaintenance(saved);
        }
        return saved;
    }

    private void syncMaintenance(Vehicle vehicle) {
        MaintenanceRecord record = new MaintenanceRecord(
            vehicle.getId(),
            vehicle.getVehicleStatus(),
            vehicle.getMaintenanceReason(),
            vehicle.getMaintenanceStartDate(),
            vehicle.getMaintenanceEndDate()
        );
        maintenanceRepository.save(record);
    }

    private void applyDefaultPricing(Vehicle vehicle) {
        if (vehicle.getPricePerDay() > 0 && vehicle.getPricePerHour() > 0) {
            return;
        }

        String type = vehicle.getType();
        if (type == null || type.isEmpty()) {
            type = vehicle.getVehicleCategory();
            vehicle.setType(type);
        }

        vehicle.setPricePerDay(pricingService.getDailyRate(type));
        vehicle.setPricePerHour(pricingService.getHourlyRate(type));
    }
}