package com.vehiclerental.repository;

import com.vehiclerental.model.PlatformFeedback;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@Repository
public class PlatformFeedbackRepository {
    private final List<PlatformFeedback> feedbackList = new ArrayList<>();
    private final String fileName = "feedback.txt";
    private final Path dataPath;

    public PlatformFeedbackRepository() {
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
        feedbackList.clear();
        if (!Files.exists(dataPath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(dataPath, StandardCharsets.UTF_8);
            for (String line : lines) {
                if (line != null && !line.trim().isEmpty()) {
                    PlatformFeedback f = mapToEntity(line.trim());
                    if (f != null) {
                        feedbackList.add(f);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading " + fileName + ": " + e.getMessage());
        }
    }

    public void saveAll() {
        List<String> lines = new ArrayList<>();
        for (PlatformFeedback f : feedbackList) {
            lines.add(mapToString(f));
        }
        try {
            Files.write(dataPath, lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error writing to " + fileName + ": " + e.getMessage());
        }
    }

    public PlatformFeedback save(PlatformFeedback feedback) {
        if (feedback.getId() == null || feedback.getId().isEmpty()) {
            feedback.setId(UUID.randomUUID().toString());
        }
        
        boolean found = false;
        for (int i = 0; i < feedbackList.size(); i++) {
            if (feedbackList.get(i).getId() != null && feedbackList.get(i).getId().equals(feedback.getId())) {
                feedbackList.set(i, feedback);
                found = true;
                break;
            }
        }
        
        if (!found) {
            feedbackList.add(feedback);
        }
        
        saveAll();
        return feedback;
    }

    public List<PlatformFeedback> findAll() {
        return new ArrayList<>(feedbackList);
    }

    public Optional<PlatformFeedback> findById(String id) {
        for (PlatformFeedback f : feedbackList) {
            if (f.getId().equals(id)) {
                return Optional.of(f);
            }
        }
        return Optional.empty();
    }

    public List<PlatformFeedback> findByUserId(String userId) {
        List<PlatformFeedback> filtered = new ArrayList<>();
        for (PlatformFeedback f : feedbackList) {
            if (userId != null && userId.equals(f.getUserId())) {
                filtered.add(f);
            }
        }
        return filtered;
    }

    public void deleteById(String id) {
        feedbackList.removeIf(f -> f.getId().equals(id));
        saveAll();
    }

    private PlatformFeedback mapToEntity(String line) {
        String[] parts = line.split("\\|", -1);
        // id|userId|userName|userEmail|category|rating|comment|createdAt
        if (parts.length < 6) return null;

        PlatformFeedback f = new PlatformFeedback();
        f.setId(parts[0]);
        f.setUserId(parts[1]);
        f.setUserName(unescape(parts[2]));
        f.setUserEmail(unescape(parts[3]));
        f.setCategory(unescape(parts[4]));
        
        try {
            f.setRating(parts[5].isEmpty() ? 0 : Integer.parseInt(parts[5]));
            if (parts.length > 6) f.setComment(unescape(parts[6]));
            if (parts.length > 7) f.setCreatedAt(unescape(parts[7]));
        } catch (NumberFormatException e) {
            System.err.println("Error parsing numeric data in PlatformFeedbackRepository: " + e.getMessage());
        }

        return f;
    }

    private String mapToString(PlatformFeedback f) {
        StringBuilder sb = new StringBuilder();
        sb.append(f.getId()).append("|")
          .append(f.getUserId()).append("|")
          .append(escape(f.getUserName())).append("|")
          .append(escape(f.getUserEmail())).append("|")
          .append(escape(f.getCategory())).append("|")
          .append(f.getRating()).append("|")
          .append(escape(f.getComment())).append("|")
          .append(escape(f.getCreatedAt()));
        return sb.toString();
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("|", "\\|");
    }

    private String unescape(String s) {
        if (s == null || s.isEmpty()) return "";
        return s.replace("\\|", "|");
    }
}
