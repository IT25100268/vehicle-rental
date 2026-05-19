package com.vehiclerental.controller;

import com.vehiclerental.model.Booking;
import com.vehiclerental.model.Payment;
import com.vehiclerental.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final BookingService bookingService;

    public PaymentController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> paymentsForUser(@PathVariable String userId) {
        List<Map<String, Object>> rows = bookingService.getBookingsForUser(userId).stream()
            .filter(b -> b.getPayment() != null)
            .map(b -> {
                Payment p = b.getPayment();
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("bookingId", b.getId());
                row.put("payment", p);
                row.put("bookingStatus", b.getStatus());
                row.put("totalPrice", b.getTotalPrice());
                return row;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> paymentForBooking(@PathVariable String bookingId) {
        try {
            Booking b = bookingService.getById(bookingId);
            if (b.getPayment() == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(b.getPayment());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
