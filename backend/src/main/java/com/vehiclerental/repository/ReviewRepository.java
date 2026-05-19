package com.vehiclerental.repository;

import com.vehiclerental.model.Review;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@Repository
public class ReviewRepository {
    private final List<Review> reviews = new ArrayList<>();
    private final String fileName = "reviews.txt";
    private final Path dataPath;

    public ReviewRepository() {
        Path cwd = Paths.get(System.getProperty("user.dir")).normalize();
        Path dir = cwd.resolve("data");
        if (!Files.exists(dir)) {
            dir = cwd.resolve("backend").resolve("data");
        }
        this.dataPath = dir.resolve(fileName);
        
        try {
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }
        } catch (IOException e) {
            System.err.println("Error creating data directory: " + e.getMessage());
        }
        
        load();
    }

    public void load() {
        reviews.clear();
        if (!Files.exists(dataPath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(dataPath, StandardCharsets.UTF_8);
            for (String line : lines) {
                if (line != null && !line.trim().isEmpty()) {
                    Review r = mapToEntity(line.trim());
                    if (r != null) {
                        reviews.add(r);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading " + fileName + ": " + e.getMessage());
        }
    }

    public void saveAll() {
        List<String> lines = new ArrayList<>();
        for (Review r : reviews) {
            lines.add(mapToString(r));
        }
        try {
            Files.write(dataPath, lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error writing to " + fileName + ": " + e.getMessage());
        }
    }

    public Review save(Review review) {
        if (review.getId() == null || review.getId().isEmpty()) {
            review.setId(UUID.randomUUID().toString());
        }
        
        boolean found = false;
        for (int i = 0; i < reviews.size(); i++) {
            if (reviews.get(i).getId() != null && reviews.get(i).getId().equals(review.getId())) {
                reviews.set(i, review);
                found = true;
                break;
            }
        }
        
        if (!found) {
            reviews.add(review);
        }
        
        saveAll();
        return review;
    }

    public List<Review> findAll() {
        return new ArrayList<>(reviews);
    }

    public Optional<Review> findById(String id) {
        for (Review r : reviews) {
            if (r.getId().equals(id)) {
                return Optional.of(r);
            }
        }
        return Optional.empty();
    }

    public List<Review> findByVehicleId(String vehicleId) {
        List<Review> filtered = new ArrayList<>();
        for (Review r : reviews) {
            if (vehicleId != null && vehicleId.equals(r.getVehicleId())) {
                filtered.add(r);
            }
        }
        return filtered;
    }

    public List<Review> findByUserId(String userId) {
        List<Review> filtered = new ArrayList<>();
        for (Review r : reviews) {
            if (userId != null && userId.equals(r.getUserId())) {
                filtered.add(r);
            }
        }
        return filtered;
    }

    public void deleteById(String id) {
        for (int i = 0; i < reviews.size(); i++) {
            if (reviews.get(i).getId().equals(id)) {
                reviews.remove(i);
                break;
            }
        }
        saveAll();
    }

    private Review mapToEntity(String line) {
        String[] parts = line.split("\\|", -1);
        if (parts.length < 5) return null;

        Review r = new Review();
        r.setId(parts[0]);
        r.setUserId(parts[1]);
        r.setUserName(unescape(parts[2]));
        r.setVehicleId(parts[3]);
        
        try {
            r.setRating(parts[4].isEmpty() ? 0 : Integer.parseInt(parts[4]));
            if (parts.length > 5) r.setComment(unescape(parts[5]));
            if (parts.length > 6) r.setPhoto(unescape(parts[6]));
            if (parts.length > 7) r.setCreatedAt(unescape(parts[7]));
        } catch (NumberFormatException e) {
            System.err.println("Error parsing numeric data in ReviewRepository: " + e.getMessage());
        }

        return r;
    }

    private String mapToString(Review r) {
        StringBuilder sb = new StringBuilder();
        sb.append(r.getId()).append("|")
          .append(r.getUserId()).append("|")
          .append(escape(r.getUserName())).append("|")
          .append(r.getVehicleId()).append("|")
          .append(r.getRating()).append("|")
          .append(escape(r.getComment())).append("|")
          .append(escape(r.getPhoto())).append("|")
          .append(escape(r.getCreatedAt()));
        return sb.toString();
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("|", "\\|");
    }

    private String unescape(String s) {
        if (s == null || s.isEmpty()) return null;
        return s.replace("\\|", "|");
    }
}
