package com.vehiclerental.repository;

import com.vehiclerental.model.*;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@Repository
public class UserRepository {
    private final List<User> users = new ArrayList<>();
    private final String fileName = "users.txt";
    private final Path dataPath;

    public UserRepository() {
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
        users.clear();
        if (!Files.exists(dataPath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(dataPath, StandardCharsets.UTF_8);
            for (String line : lines) {
                if (line != null && !line.trim().isEmpty()) {
                    User u = mapToEntity(line.trim());
                    if (u != null) {
                        users.add(u);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading " + fileName + ": " + e.getMessage());
        }
    }

    public void saveAll() {
        List<String> lines = new ArrayList<>();
        for (User u : users) {
            lines.add(mapToString(u));
        }
        try {
            Files.write(dataPath, lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error writing to " + fileName + ": " + e.getMessage());
        }
    }

    public User save(User user) {
        if (user.getId() == null || user.getId().isEmpty()) {
            user.setId(UUID.randomUUID().toString());
        }
        
        boolean found = false;
        for (int i = 0; i < users.size(); i++) {
            if (users.get(i).getId() != null && users.get(i).getId().equals(user.getId())) {
                users.set(i, user);
                found = true;
                break;
            }
        }
        
        if (!found) {
            users.add(user);
        }
        
        saveAll();
        return user;
    }

    public List<User> findAll() {
        return new ArrayList<>(users);
    }

    public Optional<User> findById(String id) {
        for (User u : users) {
            if (u.getId().equals(id)) {
                return Optional.of(u);
            }
        }
        return Optional.empty();
    }

    public Optional<User> findByEmail(String email) {
        for (User u : users) {
            if (u.getEmail() != null && u.getEmail().equalsIgnoreCase(email)) {
                return Optional.of(u);
            }
        }
        return Optional.empty();
    }

    public void deleteById(String id) {
        for (int i = 0; i < users.size(); i++) {
            if (users.get(i).getId().equals(id)) {
                users.remove(i);
                break;
            }
        }
        saveAll();
    }

    private User mapToEntity(String line) {
        try {
            String[] parts = line.split("\\|", -1);
            if (parts.length < 5) return null;

            String id = parts[0];
            String name = unescape(parts[1]);
            String email = unescape(parts[2]);
            String password = unescape(parts[3]);
            String role = parts[4];

            if (id == null || id.trim().isEmpty()) return null;
            if (email == null || email.trim().isEmpty()) return null;
            if (role == null || role.trim().isEmpty()) return null;
            if (!"ADMIN".equalsIgnoreCase(role) && !"USER".equalsIgnoreCase(role)) return null;

            User user;
            if ("ADMIN".equalsIgnoreCase(role)) {
                user = new Admin();
            } else {
                user = new Customer();
            }

            user.setId(id);
            user.setName(name);
            user.setEmail(email);
            user.setPassword(password);
            user.setRole(role.toUpperCase());

            try {
                if (parts.length > 5) user.setMobile(unescape(parts[5]));
                if (parts.length > 6) user.setNic(unescape(parts[6]));
                if (parts.length > 7) user.setRegisteredAt(unescape(parts[7]));
                if (parts.length > 8) user.setProfilePicture(unescape(parts[8]));

                if (parts.length > 9 && parts[9] != null && !parts[9].isEmpty()) {
                    String[] addrParts = parts[9].split(";", -1);
                    if (addrParts.length >= 6) {
                        Address addr = new Address();
                        addr.setStreet(unescape(addrParts[0]));
                        addr.setCity(unescape(addrParts[1]));
                        addr.setDistrict(unescape(addrParts[2]));
                        addr.setProvince(unescape(addrParts[3]));
                        addr.setPostalCode(unescape(addrParts[4]));
                        addr.setCountry(unescape(addrParts[5]));
                        user.setAddress(addr);
                    }
                }

                if (parts.length > 10 && parts[10] != null && !parts[10].isEmpty()) {
                    user.setWishlist(new ArrayList<>(Arrays.asList(parts[10].split(","))));
                }

                if (user instanceof Customer) {
                    Customer c = (Customer) user;
                    if (parts.length > 11) c.setDriverLicenseNumber(unescape(parts[11]));
                    if (parts.length > 12) {
                        String pts = parts[12];
                        c.setLoyaltyPoints(pts == null || pts.isEmpty() ? 0 : Integer.parseInt(pts));
                    } else {
                        c.setLoyaltyPoints(0);
                    }
                    if (parts.length > 13) c.setReferralCode(unescape(parts[13]));
                    if (parts.length > 14) {
                        String cnt = parts[14];
                        c.setReferralCount(cnt == null || cnt.isEmpty() ? 0 : Integer.parseInt(cnt));
                    } else {
                        c.setReferralCount(0);
                    }
                } else if (user instanceof Admin) {
                    Admin a = (Admin) user;
                    if (parts.length > 11) a.setAdminLevel(unescape(parts[11]));
                    if (parts.length > 12) a.setDepartment(unescape(parts[12]));
                    if (parts.length > 13) {
                        String clr = parts[13];
                        a.setClearanceLevel(clr == null || clr.isEmpty() ? 1 : Integer.parseInt(clr));
                    } else {
                        a.setClearanceLevel(1);
                    }
                }
            } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
                System.err.println("Warning: Error parsing optional/subclass fields in UserRepository: " + e.getMessage());
            }

            if (parts.length > 15 && parts[15] != null && !parts[15].isEmpty()) {
                user.setAccountStatus(unescape(parts[15]));
            } else {
                user.setAccountStatus("ACTIVE");
            }

            return user;
        } catch (Exception e) {
            System.err.println("Error parsing user line: '" + line + "'. Skipping line. Error: " + e.getMessage());
            return null;
        }
    }

    private String mapToString(User user) {
        StringBuilder sb = new StringBuilder();
        sb.append(user.getId()).append("|")
          .append(escape(user.getName())).append("|")
          .append(escape(user.getEmail())).append("|")
          .append(escape(user.getPassword())).append("|")
          .append(escape(user.getRole())).append("|")
          .append(escape(user.getMobile())).append("|")
          .append(escape(user.getNic())).append("|")
          .append(escape(user.getRegisteredAt())).append("|")
          .append(escape(user.getProfilePicture())).append("|");
        
        if (user.getAddress() != null) {
            Address a = user.getAddress();
            sb.append(escape(a.getStreet())).append(";")
              .append(escape(a.getCity())).append(";")
              .append(escape(a.getDistrict())).append(";")
              .append(escape(a.getProvince())).append(";")
              .append(escape(a.getPostalCode())).append(";")
              .append(escape(a.getCountry()));
        }
        sb.append("|");
        
        if (user.getWishlist() != null && !user.getWishlist().isEmpty()) {
            sb.append(String.join(",", user.getWishlist()));
        }
        sb.append("|");

        if (user instanceof Customer) {
            Customer c = (Customer) user;
            sb.append(escape(c.getDriverLicenseNumber())).append("|")
              .append(c.getLoyaltyPoints()).append("|")
              .append(escape(c.getReferralCode())).append("|")
              .append(c.getReferralCount()).append("|")
              .append(escape(user.getAccountStatus()));
        } else if (user instanceof Admin) {
            Admin a = (Admin) user;
            sb.append(escape(a.getAdminLevel())).append("|")
              .append(escape(a.getDepartment())).append("|")
              .append(a.getClearanceLevel()).append("|0|")
              .append(escape(user.getAccountStatus()));
        } else {
            sb.append("|||0|").append(escape(user.getAccountStatus()));
        }
        
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
