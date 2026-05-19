package com.vehiclerental.repository;

import com.vehiclerental.model.*;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@Repository
public class BookingRepository {
    private final List<Booking> bookings = new ArrayList<>();
    private final String fileName = "bookings.txt";
    private final Path dataPath;

    public BookingRepository() {
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
        bookings.clear();
        if (!Files.exists(dataPath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(dataPath, StandardCharsets.UTF_8);
            for (String line : lines) {
                if (line != null && !line.trim().isEmpty()) {
                    Booking b = mapToEntity(line.trim());
                    if (b != null) {
                        bookings.add(b);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading " + fileName + ": " + e.getMessage());
        }
    }

    public void saveAll() {
        List<String> lines = new ArrayList<>();
        for (Booking b : bookings) {
            lines.add(mapToString(b));
        }
        try {
            Files.write(dataPath, lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error writing to " + fileName + ": " + e.getMessage());
        }
    }

    public Booking save(Booking booking) {
        if (booking.getId() == null || booking.getId().isEmpty()) {
            booking.setId(UUID.randomUUID().toString());
        }
        
        boolean found = false;
        for (int i = 0; i < bookings.size(); i++) {
            if (bookings.get(i).getId() != null && bookings.get(i).getId().equals(booking.getId())) {
                bookings.set(i, booking);
                found = true;
                break;
            }
        }
        
        if (!found) {
            bookings.add(booking);
        }
        
        saveAll();
        return booking;
    }

    public List<Booking> findAll() {
        return new ArrayList<>(bookings);
    }

    public Optional<Booking> findById(String id) {
        for (Booking b : bookings) {
            if (b.getId().equals(id)) {
                return Optional.of(b);
            }
        }
        return Optional.empty();
    }

    public List<Booking> findByUserId(String userId) {
        List<Booking> filtered = new ArrayList<>();
        for (Booking b : bookings) {
            if (b.getUserId() != null && b.getUserId().equals(userId)) {
                filtered.add(b);
            }
        }
        return filtered;
    }

    public void deleteById(String id) {
        for (int i = 0; i < bookings.size(); i++) {
            if (bookings.get(i).getId().equals(id)) {
                bookings.remove(i);
                break;
            }
        }
        saveAll();
    }

    private Booking mapToEntity(String line) {
        String[] parts = line.split("\\|", -1);
        if (parts.length < 5) return null;

        Booking b = new Booking();
        b.setId(parts[0]);
        b.setUserId(parts[1]);
        b.setVehicleId(parts[2]);
        b.setStartDate(unescape(parts[3]));
        b.setEndDate(unescape(parts[4]));

        if (parts.length > 5) b.setStatus(parts[5]);
        if (parts.length > 6) b.setUserName(unescape(parts[6]));
        if (parts.length > 7) b.setUserEmail(unescape(parts[7]));
        if (parts.length > 8) b.setVehicleName(unescape(parts[8]));
        if (parts.length > 9) b.setVehiclePhoto(unescape(parts[9]));
        if (parts.length > 10) b.setVehicleType(parts[10]);
        
        try {
            if (parts.length > 11 && !parts[11].isEmpty()) b.setBookingDays(Integer.parseInt(parts[11]));
            if (parts.length > 12 && !parts[12].isEmpty()) b.setBookingHours(Integer.parseInt(parts[12]));
            if (parts.length > 13) b.setRentalMode(parts[13]);
            if (parts.length > 14 && !parts[14].isEmpty()) b.setPricePerDay(Double.parseDouble(parts[14]));
            if (parts.length > 15 && !parts[15].isEmpty()) b.setPricePerHour(Double.parseDouble(parts[15]));
            if (parts.length > 16 && !parts[16].isEmpty()) b.setTotalPrice(Double.parseDouble(parts[16]));
            if (parts.length > 17 && !parts[17].isEmpty()) b.setCancellationFee(Double.parseDouble(parts[17]));

            if (parts.length > 18 && !parts[18].isEmpty()) {
                String[] pParts = parts[18].split(";", -1);
                if (pParts.length >= 8) {
                    Payment p = new Payment();
                    p.setId(pParts[0]);
                    p.setBookingId(pParts[1]);
                    p.setAmount(pParts[2].isEmpty() ? 0.0 : Double.parseDouble(pParts[2]));
                    p.setMethod(unescape(pParts[3]));
                    p.setStatus(pParts[4]);
                    p.setTimestamp(unescape(pParts[5]));
                    p.setRefundAmount(pParts[6].isEmpty() ? 0.0 : Double.parseDouble(pParts[6]));
                    p.setCancellationFee(pParts[7].isEmpty() ? 0.0 : Double.parseDouble(pParts[7]));
                    b.setPayment(p);
                }
            }
            if (parts.length > 19) b.setCancellationReason(unescape(parts[19]));
            if (parts.length > 20) b.setCancelledAt(unescape(parts[20]));
            if (parts.length > 21) b.setEditedAt(unescape(parts[21]));
            if (parts.length > 22 && !parts[22].isEmpty()) b.setOriginalTotalPrice(Double.parseDouble(parts[22]));
            if (parts.length > 23 && !parts[23].isEmpty()) b.setAdditionalAmountDue(Double.parseDouble(parts[23]));
            if (parts.length > 24 && !parts[24].isEmpty()) b.setRentalCreditAmount(Double.parseDouble(parts[24]));
            if (parts.length > 25) b.setEditStatus(parts[25]);
        } catch (NumberFormatException e) {
            System.err.println("Error parsing numeric data in BookingRepository: " + e.getMessage());
        }

        return b;
    }

    private String mapToString(Booking b) {
        StringBuilder sb = new StringBuilder();
        sb.append(b.getId()).append("|")
          .append(b.getUserId()).append("|")
          .append(b.getVehicleId()).append("|")
          .append(escape(b.getStartDate())).append("|")
          .append(escape(b.getEndDate())).append("|")
          .append(b.getStatus()).append("|")
          .append(escape(b.getUserName())).append("|")
          .append(escape(b.getUserEmail())).append("|")
          .append(escape(b.getVehicleName())).append("|")
          .append(escape(b.getVehiclePhoto())).append("|")
          .append(b.getVehicleType()).append("|")
          .append(b.getBookingDays()).append("|")
          .append(b.getBookingHours()).append("|")
          .append(b.getRentalMode()).append("|")
          .append(b.getPricePerDay()).append("|")
          .append(b.getPricePerHour()).append("|")
          .append(b.getTotalPrice()).append("|")
          .append(b.getCancellationFee()).append("|");

        if (b.getPayment() != null) {
            Payment p = b.getPayment();
            sb.append(p.getId()).append(";")
              .append(p.getBookingId()).append(";")
              .append(p.getAmount()).append(";")
              .append(escape(p.getMethod())).append(";")
              .append(p.getStatus()).append(";")
              .append(escape(p.getTimestamp())).append(";")
              .append(p.getRefundAmount()).append(";")
              .append(p.getCancellationFee());
        }
        sb.append("|").append(escape(b.getCancellationReason()))
          .append("|").append(escape(b.getCancelledAt()))
          .append("|").append(escape(b.getEditedAt()))
          .append("|").append(b.getOriginalTotalPrice())
          .append("|").append(b.getAdditionalAmountDue())
          .append("|").append(b.getRentalCreditAmount())
          .append("|").append(b.getEditStatus());

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
