package com.vehiclerental.service;

import com.vehiclerental.model.*;
import com.vehiclerental.repository.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AdminService {

    private final UserRepository    userRepository;
    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository  reviewRepository;

    public AdminService(UserRepository userRepository,
                        VehicleRepository vehicleRepository,
                        BookingRepository bookingRepository,
                        ReviewRepository reviewRepository) {
        this.userRepository    = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.bookingRepository = bookingRepository;
        this.reviewRepository  = reviewRepository;
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        List<User>    users    = userRepository.findAll();
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<Booking> bookings = bookingRepository.findAll();
        List<Review>  reviews  = reviewRepository.findAll();

        stats.put("totalUsers",    users.size());
        stats.put("totalVehicles", vehicles.size());
        stats.put("totalBookings", bookings.size());
        stats.put("totalReviews",  reviews.size());

        double totalRevenue = 0.0;
        int activeBookings = 0;
        int completedBookings = 0;
        int cancelledBookings = 0;

        for (Booking b : bookings) {
            String status = b.getStatus();
            if ("COMPLETED".equals(status) || "CONFIRMED".equals(status)) {
                totalRevenue += b.getTotalPrice();
            }
            
            if ("ACTIVE".equals(status)) {
                activeBookings++;
            } else if ("COMPLETED".equals(status)) {
                completedBookings++;
            } else if ("CANCELLED".equals(status)) {
                cancelledBookings++;
            }
        }
        
        stats.put("totalRevenue", totalRevenue);
        stats.put("activeBookings", activeBookings);
        stats.put("completedBookings", completedBookings);
        stats.put("cancelledBookings", cancelledBookings);

        int availableCount = 0;
        for (Vehicle v : vehicles) {
            if (v.isAvailable()) {
                availableCount++;
            }
        }
        stats.put("availableVehicles", availableCount);

        int pendingCount = 0;
        for (Booking b : bookings) {
            if ("PENDING".equals(b.getStatus())) {
                pendingCount++;
            }
        }
        stats.put("pendingBookings", pendingCount);

        return stats;
    }

    public List<FleetManager> getFleetByLocation() {
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        Map<String, List<Vehicle>> byLocation = new HashMap<>();

        for (Vehicle v : allVehicles) {
            String loc = v.getLocation() != null ? v.getLocation() : "Unknown";
            if (!byLocation.containsKey(loc)) {
                byLocation.put(loc, new ArrayList<>());
            }
            byLocation.get(loc).add(v);
        }

        List<FleetManager> fleetManagers = new ArrayList<>();
        for (Map.Entry<String, List<Vehicle>> entry : byLocation.entrySet()) {
            FleetManager fleet = new FleetManager(
                entry.getKey() + " Fleet",
                entry.getKey()
            );
            for (Vehicle v : entry.getValue()) {
                fleet.addVehicle(v);
            }
            fleetManagers.add(fleet);
        }
        
        return fleetManagers;
    }

    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUser(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new IllegalArgumentException("Admin accounts cannot be deleted for security reasons.");
        }
        userRepository.deleteById(userId);
    }
}
