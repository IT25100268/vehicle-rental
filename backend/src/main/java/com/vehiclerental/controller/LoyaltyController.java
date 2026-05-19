package com.vehiclerental.controller;

import com.vehiclerental.model.Customer;
import com.vehiclerental.model.User;
import com.vehiclerental.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/loyalty")
@CrossOrigin(origins = "*")
public class LoyaltyController {

    private final UserService userService;

    public LoyaltyController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/points/{userId}")
    public ResponseEntity<?> getPoints(@PathVariable String userId) {
        User user = userService.getById(userId);
        if (user instanceof Customer) {
            Customer customer = (Customer) user;
            return ResponseEntity.ok(Map.of(
                "points", customer.getLoyaltyPoints(),
                "referralCode", customer.getReferralCode() != null ? customer.getReferralCode() : generateReferralCode(customer),
                "referralCount", customer.getReferralCount()
            ));
        }
        return ResponseEntity.badRequest().body("User is not a customer.");
    }

    @PostMapping("/redeem/{userId}")
    public ResponseEntity<?> redeemPoints(@PathVariable String userId, @RequestBody Map<String, Integer> body) {
        int pointsToRedeem = body.getOrDefault("points", 0);
        User user = userService.getById(userId);
        if (user instanceof Customer) {
            Customer customer = (Customer) user;
            if (customer.getLoyaltyPoints() >= pointsToRedeem) {
                customer.setLoyaltyPoints(customer.getLoyaltyPoints() - pointsToRedeem);
                userService.update(userId, customer);
                return ResponseEntity.ok(Map.of("message", "Points redeemed successfully.", "newPoints", customer.getLoyaltyPoints()));
            }
            return ResponseEntity.badRequest().body("Insufficient points.");
        }
        return ResponseEntity.badRequest().body("User is not a customer.");
    }

    private String generateReferralCode(Customer customer) {
        String code = "REF-" + customer.getName().substring(0, Math.min(3, customer.getName().length())).toUpperCase() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        customer.setReferralCode(code);
        userService.update(customer.getId(), customer);
        return code;
    }
}
