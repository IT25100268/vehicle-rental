package com.vehiclerental.controller;

import com.vehiclerental.model.PlatformFeedback;
import com.vehiclerental.service.PlatformFeedbackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "*")
public class PlatformFeedbackController {

    private final PlatformFeedbackService feedbackService;

    public PlatformFeedbackController(PlatformFeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PlatformFeedback feedback) {
        try {
            return ResponseEntity.ok(feedbackService.create(feedback));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<PlatformFeedback>> getAll() {
        return ResponseEntity.ok(feedbackService.getAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PlatformFeedback>> getByUser(@PathVariable String userId) {
        return ResponseEntity.ok(feedbackService.getByUserId(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            feedbackService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
