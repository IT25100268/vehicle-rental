package com.vehiclerental.service;

import com.vehiclerental.model.*;
import com.vehiclerental.repository.LoyaltyRepository;
import com.vehiclerental.repository.UserRepository;
import com.vehiclerental.util.SecurityUtil;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final LoyaltyRepository loyaltyRepository;

    public UserService(UserRepository userRepository, LoyaltyRepository loyaltyRepository) {
        this.userRepository = userRepository;
        this.loyaltyRepository = loyaltyRepository;
    }

    public User getById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public Optional<User> getByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User update(String id, User updated) {
        User existing = getById(id);

        // Convert updated polymorphically if needed to avoid class mismatch
        if (existing instanceof Customer && !(updated instanceof Customer)) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                String json = mapper.writeValueAsString(updated);
                updated = mapper.readValue(json, Customer.class);
            } catch (Exception e) {
                // ignore and proceed
            }
        } else if (existing instanceof Admin && !(updated instanceof Admin)) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                String json = mapper.writeValueAsString(updated);
                updated = mapper.readValue(json, Admin.class);
            } catch (Exception e) {
                // ignore and proceed
            }
        }

        // Security check for ADMIN target
        if ("ADMIN".equalsIgnoreCase(existing.getRole())) {
            // Block direct password updates from here
            if (updated.getPassword() != null && !updated.getPassword().isEmpty() && !updated.getPassword().equals(existing.getPassword())) {
                throw new IllegalArgumentException("Sensitive admin credentials cannot be modified.");
            }
            // Block role updates
            if (updated.getRole() != null && !updated.getRole().equalsIgnoreCase(existing.getRole())) {
                throw new IllegalArgumentException("Sensitive admin credentials cannot be modified.");
            }
            // Block clearance level updates (if any attempt)
            if (updated instanceof Admin && existing instanceof Admin) {
                Admin updatedAdmin = (Admin) updated;
                Admin existingAdmin = (Admin) existing;
                if (updatedAdmin.getClearanceLevel() != existingAdmin.getClearanceLevel()) {
                    throw new IllegalArgumentException("Sensitive admin credentials cannot be modified.");
                }
            }
        }

        if (updated.getName() != null && !updated.getName().isEmpty()) {
            existing.setName(updated.getName());
        }
        if (updated.getEmail() != null && !updated.getEmail().isEmpty()) {
            String newEmail = updated.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(existing.getEmail())) {
                Optional<User> duplicate = userRepository.findByEmail(newEmail);
                if (duplicate.isPresent() && !duplicate.get().getId().equals(existing.getId())) {
                    throw new IllegalArgumentException("An account with this email already exists.");
                }
                existing.setEmail(newEmail);
            }
        }
        if (updated.getMobile() != null) {
            existing.setMobile(updated.getMobile());
        }
        if (updated.getProfilePicture() != null) {
            existing.setProfilePicture(updated.getProfilePicture());
        }
        if (updated.getNic() != null) {
            existing.setNic(updated.getNic());
        }
        if (updated.getAddress() != null) {
            existing.setAddress(updated.getAddress());
        }
        if (updated.getAccountStatus() != null) {
            existing.setAccountStatus(updated.getAccountStatus());
        }

        // Subclass-specific fields
        if (existing instanceof Customer && updated instanceof Customer) {
            Customer existingCust = (Customer) existing;
            Customer updatedCust = (Customer) updated;
            if (updatedCust.getDriverLicenseNumber() != null) {
                existingCust.setDriverLicenseNumber(updatedCust.getDriverLicenseNumber());
            }
            existingCust.setLoyaltyPoints(updatedCust.getLoyaltyPoints());
            if (updatedCust.getReferralCode() != null) {
                existingCust.setReferralCode(updatedCust.getReferralCode());
            }
            existingCust.setReferralCount(updatedCust.getReferralCount());
        } else if (existing instanceof Admin && updated instanceof Admin) {
            Admin existingAdmin = (Admin) existing;
            Admin updatedAdmin = (Admin) updated;
            if (updatedAdmin.getAdminLevel() != null) {
                existingAdmin.setAdminLevel(updatedAdmin.getAdminLevel());
            }
            if (updatedAdmin.getDepartment() != null) {
                existingAdmin.setDepartment(updatedAdmin.getDepartment());
            }
        }

        User saved = userRepository.save(existing);
        if (saved instanceof Customer) {
            syncLoyalty((Customer) saved);
        }
        return saved;
    }

    private void syncLoyalty(Customer customer) {
        double credit = 0.0;
        double reward = 0.0;
        if (loyaltyRepository != null) {
            Optional<LoyaltyRecord> existing = loyaltyRepository.findByUserId(customer.getId());
            if (existing.isPresent()) {
                credit = existing.get().getRentalCredit();
                reward = existing.get().getReferralReward();
            }
        }
        LoyaltyRecord record = new LoyaltyRecord(
            customer.getId(),
            customer.getLoyaltyPoints(),
            credit,
            reward
        );
        record.setUpdatedAt(java.time.LocalDateTime.now().toString());
        loyaltyRepository.save(record);
    }

    public void changePassword(String id, String oldPass, String newPass) {
        User user = getById(id);

        String oldHash = SecurityUtil.hashPassword(oldPass);
        if (!user.getPassword().equals(oldHash)) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        if (newPass == null || newPass.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters.");
        }

        SecurityUtil.requireValidPassword(newPass);
        user.setPassword(SecurityUtil.hashPassword(newPass));
        userRepository.save(user);
    }

    public void delete(String id) {
        User user = getById(id);
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new IllegalArgumentException("Admin accounts cannot be deleted for security reasons.");
        }
        userRepository.deleteById(id);
    }

    public User save(User user) {
        User saved = userRepository.save(user);
        if (saved instanceof Customer) {
            syncLoyalty((Customer) saved);
        }
        return saved;
    }
}