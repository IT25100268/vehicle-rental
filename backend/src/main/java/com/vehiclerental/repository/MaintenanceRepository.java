package com.vehiclerental.repository;

import com.vehiclerental.model.MaintenanceRecord;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@Repository
public class MaintenanceRepository {
    private final List<MaintenanceRecord> records = new ArrayList<>();
    private final String fileName = "maintenance.txt";
    private final Path dataPath;

    public MaintenanceRepository() {
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
        records.clear();
        if (!Files.exists(dataPath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(dataPath, StandardCharsets.UTF_8);
            for (String line : lines) {
                if (line != null && !line.trim().isEmpty()) {
                    MaintenanceRecord r = mapToEntity(line.trim());
                    if (r != null) {
                        records.add(r);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading " + fileName + ": " + e.getMessage());
        }
    }

    public void saveAll() {
        List<String> lines = new ArrayList<>();
        for (MaintenanceRecord r : records) {
            lines.add(mapToString(r));
        }
        try {
            Files.write(dataPath, lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error writing to " + fileName + ": " + e.getMessage());
        }
    }

    public MaintenanceRecord save(MaintenanceRecord record) {
        if (record.getId() == null || record.getId().isEmpty()) {
            record.setId(UUID.randomUUID().toString());
        }
        
        boolean found = false;
        for (int i = 0; i < records.size(); i++) {
            if (records.get(i).getId() != null && records.get(i).getId().equals(record.getId())) {
                records.set(i, record);
                found = true;
                break;
            }
        }
        
        if (!found) {
            records.add(record);
        }
        
        saveAll();
        return record;
    }

    public List<MaintenanceRecord> findAll() {
        return new ArrayList<>(records);
    }

    public List<MaintenanceRecord> findByVehicleId(String vehicleId) {
        List<MaintenanceRecord> filtered = new ArrayList<>();
        for (MaintenanceRecord r : records) {
            if (vehicleId != null && vehicleId.equals(r.getVehicleId())) {
                filtered.add(r);
            }
        }
        return filtered;
    }

    private MaintenanceRecord mapToEntity(String line) {
        String[] parts = line.split("\\|", -1);
        if (parts.length < 3) return null;

        MaintenanceRecord r = new MaintenanceRecord();
        r.setId(parts[0]);
        r.setVehicleId(parts[1]);
        r.setStatus(parts[2]);
        
        if (parts.length > 3) r.setReason(unescape(parts[3]));
        if (parts.length > 4) r.setStartDate(unescape(parts[4]));
        if (parts.length > 5) r.setEndDate(unescape(parts[5]));
        if (parts.length > 6) r.setTimestamp(unescape(parts[6]));

        return r;
    }

    private String mapToString(MaintenanceRecord r) {
        StringBuilder sb = new StringBuilder();
        sb.append(r.getId()).append("|")
          .append(r.getVehicleId()).append("|")
          .append(r.getStatus()).append("|")
          .append(escape(r.getReason())).append("|")
          .append(escape(r.getStartDate())).append("|")
          .append(escape(r.getEndDate())).append("|")
          .append(escape(r.getTimestamp()));
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
