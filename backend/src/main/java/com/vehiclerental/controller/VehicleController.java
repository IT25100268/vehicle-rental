package com.vehiclerental.controller;

import com.vehiclerental.model.Vehicle;
import com.vehiclerental.service.VehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
public class VehicleController {
    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public ResponseEntity<List<Vehicle>> list() {
        return ResponseEntity.ok(vehicleService.getAll());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Vehicle>> available() {
        return ResponseEntity.ok(vehicleService.getAvailable());
    }

    @PostMapping("/compare")
    public ResponseEntity<List<Vehicle>> compare(@RequestBody List<String> vehicleIds) {
        List<Vehicle> out = new ArrayList<>();
        if (vehicleIds != null) {
            for (String id : vehicleIds) {
                try {
                    out.add(vehicleService.getById(id));
                } catch (IllegalArgumentException ignored) {

                }
            }
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> get(@PathVariable String id) {
        return ResponseEntity.ok(vehicleService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Vehicle> create(@RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(vehicleService.create(vehicle));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> update(@PathVariable String id, @RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(vehicleService.update(id, vehicle));
    }

    @PutMapping("/{id}/maintenance")
    public ResponseEntity<Vehicle> setMaintenance(
        @PathVariable String id,
        @RequestBody Vehicle maintenanceData
    ) {
        return ResponseEntity.ok(vehicleService.updateMaintenance(id, maintenanceData));
    }

    @PutMapping("/{id}/available")
    public ResponseEntity<Vehicle> setAvailable(@PathVariable String id) {
        return ResponseEntity.ok(vehicleService.setAvailability(id, true));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Vehicle> updateStatus(
        @PathVariable String id,
        @RequestParam String status
    ) {
        return ResponseEntity.ok(vehicleService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        vehicleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
