package com.vehiclerental.repository;

import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@Repository
public class LogisticsRepository {
    private final String fileName = "vehicle_locations.txt";
    private final Path dataPath;

    public LogisticsRepository() {
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
    }

    public List<String> readAllLines() {
        if (!Files.exists(dataPath)) {
            return new ArrayList<>();
        }
        try {
            return Files.readAllLines(dataPath, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error reading " + fileName + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public void writeAllLines(List<String> lines) {
        try {
            Files.write(dataPath, lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error writing to " + fileName + ": " + e.getMessage());
        }
    }
}
