package com.vehiclerental.controller;

import com.vehiclerental.model.Booking;
import com.vehiclerental.service.BookingService;
import com.vehiclerental.repository.LogisticsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logistics")
@CrossOrigin(origins = "*")
public class LogisticsController {

    private final BookingService bookingService;
    private final LogisticsRepository logisticsRepository;

    public LogisticsController(BookingService bookingService, LogisticsRepository logisticsRepository) {
        this.bookingService = bookingService;
        this.logisticsRepository = logisticsRepository;
    }

    @GetMapping("/tracking/{vehicleId}")
    public ResponseEntity<Map<String, Object>> getVehicleLocation(@PathVariable String vehicleId) {
        List<String> lines = logisticsRepository.readAllLines();
        for (String line : lines) {
            String[] parts = line.split("\\|", -1);
            if (parts.length >= 5 && vehicleId.equals(parts[0])) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("vehicleId", parts[0]);
                row.put("latitude", Double.parseDouble(parts[1]));
                row.put("longitude", Double.parseDouble(parts[2]));
                row.put("speed", Double.parseDouble(parts[3]));
                row.put("lastUpdated", parts[4]);
                return ResponseEntity.ok(row);
            }
        }
        return ResponseEntity.ok(generateSampleLocation(vehicleId));
    }

    @GetMapping("/invoices/{userId}")
    public ResponseEntity<List<Booking>> getUserInvoices(@PathVariable String userId) {
        List<Booking> userBookings = bookingService.getBookingsForUser(userId);
        return ResponseEntity.ok(userBookings);
    }

    private Map<String, Object> generateSampleLocation(String vehicleId) {
        Map<String, Object> loc = new LinkedHashMap<>();
        loc.put("vehicleId", vehicleId);
        loc.put("latitude", 6.9271 + (Math.random() - 0.5) * 0.1);
        loc.put("longitude", 79.8612 + (Math.random() - 0.5) * 0.1);
        loc.put("speed", Math.random() * 60);
        loc.put("lastUpdated", LocalDateTime.now().toString());
        return loc;
    }
}
