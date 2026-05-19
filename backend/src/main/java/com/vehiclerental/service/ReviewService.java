package com.vehiclerental.service;

import com.vehiclerental.model.Review;
import com.vehiclerental.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final VehicleService vehicleService;
    private final UserService userService;

    public ReviewService(ReviewRepository reviewRepository,
                         VehicleService vehicleService,
                         UserService userService) {
        this.reviewRepository = reviewRepository;
        this.vehicleService   = vehicleService;
        this.userService      = userService;
    }

    public Review create(Review review) {

        userService.getById(review.getUserId());

        vehicleService.getById(review.getVehicleId());

        validateRating(review.getRating());

        Review saved = reviewRepository.save(review);
        updateVehicleStats(review.getVehicleId());
        return saved;
    }

    public List<Review> getAll() {
        return reviewRepository.findAll();
    }

    public Review getById(String id) {
        return reviewRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Review not found: " + id));
    }

    public List<Review> getByVehicleId(String vehicleId) {
        vehicleService.getById(vehicleId);
        return reviewRepository.findByVehicleId(vehicleId);
    }

    public List<Review> getByUserId(String userId) {
        userService.getById(userId);
        return reviewRepository.findByUserId(userId);
    }

    public Review update(String id, Review updatedData) {
        Review existing = getById(id);

        if (updatedData.getComment() != null) {
            existing.setComment(updatedData.getComment());
        }
        if (updatedData.getRating() > 0) {
            validateRating(updatedData.getRating());
            existing.setRating(updatedData.getRating());
        }
        if (updatedData.getPhoto() != null) {
            existing.setPhoto(updatedData.getPhoto());
        }

        Review saved = reviewRepository.save(existing);
        updateVehicleStats(saved.getVehicleId());
        return saved;
    }

    public void delete(String id) {
        Review r = getById(id);
        String vId = r.getVehicleId();
        reviewRepository.deleteById(id);
        updateVehicleStats(vId);
    }

    private void validateRating(int rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5. Got: " + rating);
        }
    }

    private void updateVehicleStats(String vehicleId) {
        List<Review> vehicleReviews = reviewRepository.findByVehicleId(vehicleId);
        int count = vehicleReviews.size();
        double avg = 0.0;
        if (count > 0) {
            int sum = 0;
            for (Review r : vehicleReviews) {
                sum += r.getRating();
            }
            avg = (double) sum / count;
        }

        try {
            com.vehiclerental.model.Vehicle v = vehicleService.getById(vehicleId);
            v.setAverageRating(Math.round(avg * 10.0) / 10.0); // Round to 1 decimal
            v.setReviewCount(count);
            vehicleService.update(vehicleId, v);
        } catch (Exception e) {
            System.err.println("Error updating vehicle stats: " + e.getMessage());
        }
    }
}
