package com.vehiclerental.controller;

import com.vehiclerental.model.User;
import com.vehiclerental.service.AuthService;
import com.vehiclerental.util.SecurityUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    private Map<String, Object> userToResponseMap(User user) {
        @SuppressWarnings("unchecked")
        Map<String, Object> map = objectMapper.convertValue(user, Map.class);
        map.put("password", null);
        return map;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        try {
            User created = authService.register(user);
            return ResponseEntity.ok(userToResponseMap(created));
        } catch (IllegalArgumentException e) {
            logger.info("Signup failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error during signup", e);
            return ResponseEntity.status(500).body(Map.of("message", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            String email = credentials.get("email");
            String password = credentials.get("password");
            
            if (email == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required."));
            }

            User loggedIn = authService.login(email.trim(), password.trim());

            return ResponseEntity.ok(Map.of(
                "id", loggedIn.getId(),
                "name", loggedIn.getName(),
                "email", loggedIn.getEmail(),
                "role", loggedIn.getRole()
            ));
        } catch (IllegalArgumentException e) {
            logger.info("Login failed: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error during login", e);
            return ResponseEntity.status(500).body(Map.of("message", "Login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
            }
            String token = authService.forgotPassword(email.trim());
            return ResponseEntity.ok(Map.of(
                "message", "Reset link generated. Check your email.",
                "token", token
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error processing forgot password: " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String token       = body.get("token");
            String newPassword = body.get("newPassword");
            if (token == null || newPassword == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Token and new password are required."));
            }
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password has been reset successfully. You can now login."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error resetting password: " + e.getMessage()));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        try {
            String userId      = body.get("userId");
            String oldPassword = body.get("oldPassword");
            String newPassword = body.get("newPassword");
            if (userId == null || oldPassword == null || newPassword == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "userId, oldPassword, and newPassword are required."));
            }
            User updated = authService.changePassword(userId, oldPassword, newPassword);
            return ResponseEntity.ok(userToResponseMap(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error changing password: " + e.getMessage()));
        }
    }
}
