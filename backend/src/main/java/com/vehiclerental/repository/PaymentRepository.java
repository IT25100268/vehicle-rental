package com.vehiclerental.repository;

import com.vehiclerental.model.Payment;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@Repository
public class PaymentRepository {
    private final List<Payment> payments = new ArrayList<>();
    private final String fileName = "payments.txt";
    private final Path dataPath;

    public PaymentRepository() {
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
        payments.clear();
        if (!Files.exists(dataPath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(dataPath, StandardCharsets.UTF_8);
            for (String line : lines) {
                if (line != null && !line.trim().isEmpty()) {
                    Payment p = mapToEntity(line.trim());
                    if (p != null) {
                        payments.add(p);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading " + fileName + ": " + e.getMessage());
        }
    }

    public void saveAll() {
        List<String> lines = new ArrayList<>();
        for (Payment p : payments) {
            lines.add(mapToString(p));
        }
        try {
            Files.write(dataPath, lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error writing to " + fileName + ": " + e.getMessage());
        }
    }

    public Payment save(Payment payment) {
        if (payment.getId() == null || payment.getId().isEmpty()) {
            payment.setId(UUID.randomUUID().toString());
        }
        
        boolean found = false;
        for (int i = 0; i < payments.size(); i++) {
            if (payments.get(i).getId() != null && payments.get(i).getId().equals(payment.getId())) {
                payments.set(i, payment);
                found = true;
                break;
            }
        }
        
        if (!found) {
            payments.add(payment);
        }
        
        saveAll();
        return payment;
    }

    public List<Payment> findAll() {
        return new ArrayList<>(payments);
    }

    public Optional<Payment> findById(String id) {
        for (Payment p : payments) {
            if (p.getId().equals(id)) {
                return Optional.of(p);
            }
        }
        return Optional.empty();
    }

    public List<Payment> findByBookingId(String bookingId) {
        List<Payment> filtered = new ArrayList<>();
        for (Payment p : payments) {
            if (bookingId != null && bookingId.equals(p.getBookingId())) {
                filtered.add(p);
            }
        }
        return filtered;
    }

    private Payment mapToEntity(String line) {
        String[] parts = line.split("\\|", -1);
        if (parts.length < 5) return null;

        Payment p = new Payment();
        p.setId(parts[0]);
        p.setBookingId(parts[1]);
        
        try {
            p.setAmount(parts[2].isEmpty() ? 0.0 : Double.parseDouble(parts[2]));
            p.setMethod(unescape(parts[3]));
            p.setStatus(parts[4]);
            
            if (parts.length > 5) p.setTimestamp(unescape(parts[5]));
            if (parts.length > 6) p.setRefundAmount(parts[6].isEmpty() ? 0.0 : Double.parseDouble(parts[6]));
            if (parts.length > 7) p.setCancellationFee(parts[7].isEmpty() ? 0.0 : Double.parseDouble(parts[7]));
        } catch (NumberFormatException e) {
            System.err.println("Error parsing numeric data in PaymentRepository: " + e.getMessage());
        }

        return p;
    }

    private String mapToString(Payment p) {
        StringBuilder sb = new StringBuilder();
        sb.append(p.getId()).append("|")
          .append(p.getBookingId()).append("|")
          .append(p.getAmount()).append("|")
          .append(escape(p.getMethod())).append("|")
          .append(p.getStatus()).append("|")
          .append(escape(p.getTimestamp())).append("|")
          .append(p.getRefundAmount()).append("|")
          .append(p.getCancellationFee());
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
