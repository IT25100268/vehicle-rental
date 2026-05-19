package com.vehiclerental.controller;

import com.vehiclerental.model.Notification;
import com.vehiclerental.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getAll(@RequestParam(required = false) String userId) {
        if (userId != null && !userId.isEmpty()) {
            return ResponseEntity.ok(notificationService.listForUser(userId, null));
        }
        return ResponseEntity.ok(notificationService.listAll());
    }

    @PostMapping("/broadcast")
    public ResponseEntity<Notification> broadcast(@RequestBody Map<String, String> payload) {
        String role = payload.getOrDefault("role", "USER");
        String type = payload.getOrDefault("type", "ADMIN_MESSAGE");
        String title = payload.getOrDefault("title", "System Announcement");
        String message = payload.get("message");
        return ResponseEntity.ok(notificationService.sendBroadcast(role, type, title, message));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Notification notification) {
        try {
            return ResponseEntity.ok(notificationService.create(notification));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> forUser(
        @PathVariable String userId,
        @RequestParam(value = "role", required = false) String role
    ) {
        return ResponseEntity.ok(notificationService.listForUser(userId, role));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable String id) {
        try {
            return ResponseEntity.ok(notificationService.markRead(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/unread")
    public ResponseEntity<?> markUnread(@PathVariable String id) {
        try {
            return ResponseEntity.ok(notificationService.markUnread(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
        @RequestParam(value = "userId", required = false) String userId,
        @RequestParam(value = "role", required = false) String role
    ) {
        notificationService.markAllRead(userId, role);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            notificationService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clear(
        @RequestParam(value = "userId", required = false) String userId,
        @RequestParam(value = "role", required = false) String role
    ) {
        notificationService.clearForUser(userId, role);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/user/{userId}/all")
    public ResponseEntity<Void> clearForUser(
        @PathVariable String userId,
        @RequestParam(value = "role", required = false) String role
    ) {
        notificationService.clearForUser(userId, role);
        return ResponseEntity.noContent().build();
    }
}
