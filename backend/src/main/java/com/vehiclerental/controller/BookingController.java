package com.vehiclerental.controller;

import com.vehiclerental.model.Booking;
import com.vehiclerental.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;
    private final com.vehiclerental.service.PricingService pricingService;

    public BookingController(BookingService bookingService, com.vehiclerental.service.PricingService pricingService) {
        this.bookingService = bookingService;
        this.pricingService = pricingService;
    }

    @PostMapping
    public ResponseEntity<?> book(@RequestBody Booking booking) {
        try {
            return ResponseEntity.ok(bookingService.book(booking));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> userBookings(@PathVariable String userId) {
        return ResponseEntity.ok(bookingService.getBookingsForUser(userId));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> all() {
        return ResponseEntity.ok(bookingService.getAll());
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        try {
            String reason = body != null ? body.get("reason") : "Not specified";
            return ResponseEntity.ok(bookingService.cancelBooking(id, reason));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            String newStatus = body.get("status");
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Status field is required.");
            }

            if ("CANCELLED".equals(newStatus.trim())) {
                String reason = body.getOrDefault("reason", "Not specified");
                return ResponseEntity.ok(bookingService.cancelBooking(id, reason));
            }
            return ResponseEntity.ok(bookingService.updateStatus(id, newStatus.trim()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/edit")
    public ResponseEntity<?> edit(@PathVariable String id, @RequestBody Booking editData) {
        try {
            return ResponseEntity.ok(bookingService.editBooking(id, editData));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/calculate-price")
    public ResponseEntity<?> calculatePrice(@RequestBody Booking booking) {
        try {
            pricingService.applyPricing(booking);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/pay-edit")
    public ResponseEntity<?> payEdit(@PathVariable String id) {
        try {
            return ResponseEntity.ok(bookingService.completeEditPayment(id));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
