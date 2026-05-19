package com.vehiclerental.repository;

import com.vehiclerental.model.Notification;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@Repository
public class NotificationRepository {
    private final List<Notification> notifications = new ArrayList<>();
    private final String fileName = "notifications.txt";
    private final Path dataPath;

    public NotificationRepository() {
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
        notifications.clear();
        if (!Files.exists(dataPath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(dataPath, StandardCharsets.UTF_8);
            for (String line : lines) {
                if (line != null && !line.trim().isEmpty()) {
                    Notification n = mapToEntity(line.trim());
                    if (n != null) {
                        notifications.add(n);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading " + fileName + ": " + e.getMessage());
        }
    }

    public synchronized void saveAll() {
        List<String> lines = new ArrayList<>();
        for (Notification n : notifications) {
            lines.add(mapToString(n));
        }
        try {
            Files.write(dataPath, lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error writing to " + fileName + ": " + e.getMessage());
        }
    }

    public synchronized Notification save(Notification n) {
        if (n.getId() == null || n.getId().isEmpty()) {
            n.setId(UUID.randomUUID().toString());
        }
        
        boolean found = false;
        for (int i = 0; i < notifications.size(); i++) {
            if (notifications.get(i).getId() != null && notifications.get(i).getId().equals(n.getId())) {
                notifications.set(i, n);
                found = true;
                break;
            }
        }
        
        if (!found) {
            notifications.add(n);
        }
        
        saveAll();
        return n;
    }

    public synchronized List<Notification> findAll() {
        return new ArrayList<>(notifications);
    }

    public synchronized Optional<Notification> findById(String id) {
        for (Notification n : notifications) {
            if (n.getId().equals(id)) {
                return Optional.of(n);
            }
        }
        return Optional.empty();
    }

    public synchronized List<Notification> findForUser(String userId, String role) {
        List<Notification> filtered = new ArrayList<>();
        for (Notification n : notifications) {
            boolean match = false;
            if (n.getUserId() != null && !n.getUserId().isEmpty()) {
                if (n.getUserId().equals(userId)) match = true;
            } else if (n.getTargetRole() != null && !n.getTargetRole().isEmpty()) {
                if (n.getTargetRole().equalsIgnoreCase(role)) match = true;
            } else if (n.getUserId() == null && n.getTargetRole() == null) {
                match = true;
            }
            if (match) filtered.add(n);
        }

        Collections.sort(filtered, new Comparator<Notification>() {
            @Override
            public int compare(Notification n1, Notification n2) {
                String c1 = n1.getCreatedAt();
                String c2 = n2.getCreatedAt();
                if (c1 == null && c2 == null) return 0;
                if (c1 == null) return 1;
                if (c2 == null) return -1;
                return c2.compareTo(c1);
            }
        });
        
        return filtered;
    }

    public synchronized void deleteById(String id) {
        notifications.removeIf(n -> n.getId() != null && n.getId().equals(id));
        saveAll();
    }

    public synchronized void deleteAllForUser(String userId, String role) {
        notifications.removeIf(n -> {
            boolean matchesUser = false;
            if (userId != null && !userId.isEmpty() && n.getUserId() != null) {
                matchesUser = userId.equalsIgnoreCase(n.getUserId());
            }
            
            boolean matchesRole = false;
            if (role != null && !role.isEmpty() && n.getTargetRole() != null) {
                matchesRole = role.equalsIgnoreCase(n.getTargetRole());
            }
            
            boolean matchesGeneral = (n.getUserId() == null || n.getUserId().trim().isEmpty()) 
                                  && (n.getTargetRole() == null || n.getTargetRole().trim().isEmpty());
            
            return matchesUser || matchesRole || matchesGeneral;
        });
        saveAll();
    }

    private Notification mapToEntity(String line) {
        String[] parts = line.split("\\|", -1);
        if (parts.length < 5) return null;

        Notification n = new Notification();
        n.setId(parts[0]);
        n.setUserId(unescape(parts[1]));
        n.setTargetRole(unescape(parts[2]));
        n.setTitle(unescape(parts[3]));
        n.setMessage(unescape(parts[4]));

        if (parts.length > 5) n.setType(unescape(parts[5]));
        if (parts.length > 6) n.setRead(Boolean.parseBoolean(parts[6]));
        if (parts.length > 7) n.setCreatedAt(unescape(parts[7]));
        if (parts.length > 8) n.setStatus(unescape(parts[8]));
        if (parts.length > 9) n.setRelatedEntityId(unescape(parts[9]));
        if (parts.length > 10) n.setRelatedEntityType(unescape(parts[10]));

        return n;
    }

    private String mapToString(Notification n) {
        StringBuilder sb = new StringBuilder();
        sb.append(n.getId()).append("|")
          .append(escape(n.getUserId())).append("|")
          .append(escape(n.getTargetRole())).append("|")
          .append(escape(n.getTitle())).append("|")
          .append(escape(n.getMessage())).append("|")
          .append(escape(n.getType())).append("|")
          .append(n.isRead()).append("|")
          .append(escape(n.getCreatedAt())).append("|")
          .append(escape(n.getStatus())).append("|")
          .append(escape(n.getRelatedEntityId())).append("|")
          .append(escape(n.getRelatedEntityType()));
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
