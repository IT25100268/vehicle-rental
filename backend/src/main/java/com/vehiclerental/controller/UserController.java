package com.vehiclerental.controller;

import com.vehiclerental.model.User;
import com.vehiclerental.model.Vehicle;
import com.vehiclerental.service.UserService;
import com.vehiclerental.service.VehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final VehicleService vehicleService;

    public UserController(UserService userService, VehicleService vehicleService) {
        this.userService = userService;
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAll() {
        List<User> users = userService.getAll();
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            User user = userService.getById(id);
            user.setPassword(null);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/wishlist")
    public ResponseEntity<List<Vehicle>> getWishlistVehicles(@PathVariable String id) {
        User user = userService.getById(id);
        List<Vehicle> vehicles = user.getWishlist().stream()
            .map(vid -> {
                try {
                    return vehicleService.getById(vid);
                } catch (IllegalArgumentException e) {
                    return null;
                }
            })
            .filter(v -> v != null)
            .collect(Collectors.toList());
        return ResponseEntity.ok(vehicles);
    }

    @PostMapping("/{id}/wishlist/toggle")
    public ResponseEntity<List<String>> toggleWishlist(
        @PathVariable String id,
        @RequestBody Map<String, String> body
    ) {
        String vehicleId = body != null ? body.get("vehicleId") : null;
        if (vehicleId == null || vehicleId.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        User user = userService.getById(id);
        List<String> wishlist = user.getWishlist();
        if (wishlist.contains(vehicleId)) {
            wishlist.remove(vehicleId);
        } else {
            wishlist.add(vehicleId);
        }
        user.setWishlist(wishlist);
        userService.save(user);
        return ResponseEntity.ok(wishlist);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody User user) {
        try {
            User updated = userService.update(id, user);
            updated.setPassword(null);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable String id,
                                             @RequestBody Map<String, String> body) {
        try {
            String oldPass = body.get("oldPassword");
            String newPass = body.get("newPassword");

            if (oldPass == null || newPass == null) {
                return ResponseEntity.badRequest().body("oldPassword and newPassword are required.");
            }

            userService.changePassword(id, oldPass, newPass);
            return ResponseEntity.ok("Password changed successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            userService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
