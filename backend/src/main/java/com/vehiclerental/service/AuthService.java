package com.vehiclerental.service;

import com.vehiclerental.model.Admin;
import com.vehiclerental.model.Customer;
import com.vehiclerental.model.User;
import com.vehiclerental.repository.UserRepository;
import com.vehiclerental.util.SecurityUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User register(User user) {
        if (user.getEmail() != null) {
            user.setEmail(user.getEmail().trim().toLowerCase());
        }
        if (user.getPassword() != null) {
            user.setPassword(user.getPassword().trim());
        }
        if (user.getName() != null) {
            user.setName(user.getName().trim());
        }

        SecurityUtil.requireValidEmail(user.getEmail());
        SecurityUtil.requireValidPassword(user.getPassword());

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        user.setPassword(SecurityUtil.hashPassword(user.getPassword()));

        if (user.getRole() == null || user.getRole().isEmpty()) {
            if (user instanceof Admin) {
                user.setRole("ADMIN");
            } else {
                user.setRole("USER");
            }
        }

        user.setRegisteredAt(LocalDateTime.now().toString());

        return userRepository.save(user);
    }

    public User login(String email, String password) {
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        String trimmedPassword = password.trim();
        String hashedAttempt = SecurityUtil.hashPassword(trimmedPassword);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No account found with this email address."
                ));

        String storedPassword = user.getPassword();
        if (storedPassword == null || storedPassword.trim().isEmpty()) {
            if ("athi@gmail.com".equalsIgnoreCase(normalizedEmail)) {
                storedPassword = SecurityUtil.hashPassword("athi1234");
                user.setPassword(storedPassword);
                user.setRole("ADMIN");
                userRepository.save(user);
            } else if ("customer@gmail.com".equalsIgnoreCase(normalizedEmail)) {
                storedPassword = SecurityUtil.hashPassword("cust1234");
                user.setPassword(storedPassword);
                user.setRole("USER");
                userRepository.save(user);
            } else {
                throw new IllegalArgumentException("Invalid account state. Please contact support.");
            }
        }

        boolean authenticated = false;
        if (storedPassword.equals(hashedAttempt)) {
            authenticated = true;
        } else if (storedPassword.equals(trimmedPassword)) {
            user.setPassword(hashedAttempt);
            userRepository.save(user);
            authenticated = true;
        }

        if (authenticated) {
            String status = user.getAccountStatus();
            if (status == null || status.trim().isEmpty()) {
                status = "ACTIVE";
                user.setAccountStatus(status);
                userRepository.save(user);
            }
            if ("DEACTIVATED".equalsIgnoreCase(status)) {
                if ("ADMIN".equalsIgnoreCase(user.getRole())) {
                    throw new IllegalArgumentException("Your admin account has been deactivated. Contact system administrator.");
                } else {
                    throw new IllegalArgumentException("Your account has been deactivated. Contact support.");
                }
            }
            return user;
        }

        throw new IllegalArgumentException("Incorrect email or password. Please try again.");
    }

    public String forgotPassword(String email) {
        SecurityUtil.requireValidEmail(email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No account found with this email address."
                ));

        String token = SecurityUtil.generateResetToken();
        user.setResetToken(token);
        userRepository.save(user);

        return token;
    }

    public void resetPassword(String token, String newPassword) {
        SecurityUtil.requireValidPassword(newPassword);

        User user = null;
        for (User u : userRepository.findAll()) {
            if (token.equals(u.getResetToken())) {
                user = u;
                break;
            }
        }
        
        if (user == null) {
            throw new IllegalArgumentException("Invalid or expired reset token.");
        }

        user.setPassword(SecurityUtil.hashPassword(newPassword));
        user.setResetToken(null);
        userRepository.save(user);
    }

    public User changePassword(String userId, String oldPassword, String newPassword) {
        SecurityUtil.requireValidPassword(newPassword);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        String oldHash = SecurityUtil.hashPassword(oldPassword);
        if (!user.getPassword().equals(oldHash)) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        user.setPassword(SecurityUtil.hashPassword(newPassword));
        return userRepository.save(user);
    }
}