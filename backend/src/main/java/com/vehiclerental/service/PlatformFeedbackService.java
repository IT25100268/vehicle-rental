package com.vehiclerental.service;

import com.vehiclerental.model.PlatformFeedback;
import com.vehiclerental.repository.PlatformFeedbackRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlatformFeedbackService {

    private final PlatformFeedbackRepository feedbackRepository;

    public PlatformFeedbackService(PlatformFeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    public PlatformFeedback create(PlatformFeedback feedback) {
        validateFeedback(feedback);
        return feedbackRepository.save(feedback);
    }

    public List<PlatformFeedback> getAll() {
        return feedbackRepository.findAll();
    }

    public List<PlatformFeedback> getByUserId(String userId) {
        return feedbackRepository.findByUserId(userId);
    }

    public void delete(String id) {
        if (feedbackRepository.findById(id).isEmpty()) {
            throw new IllegalArgumentException("Feedback not found");
        }
        feedbackRepository.deleteById(id);
    }

    private void validateFeedback(PlatformFeedback f) {
        if (f.getRating() < 1 || f.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
        if (f.getCategory() == null || f.getCategory().trim().isEmpty()) {
            throw new IllegalArgumentException("Category is required");
        }
        if (f.getComment() == null || f.getComment().trim().isEmpty()) {
            throw new IllegalArgumentException("Comment is required");
        }
    }
}
