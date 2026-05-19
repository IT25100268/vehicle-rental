package com.vehiclerental.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

public class SecurityUtil {

    public static String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }

    public static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) return false;

        return email.trim().toLowerCase().matches("^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    public static void requireValidEmail(String email) {
        if (!isValidEmail(email)) {
            throw new IllegalArgumentException(
                "Email must be a valid email address."
            );
        }
    }

    public static boolean isValidPassword(String password) {
        if (password == null) return false;
        int len = password.length();
        if (len < 6 || len > 12) return false;

        boolean hasLetter = false;
        boolean hasDigit  = false;

        for (char c : password.toCharArray()) {
            if (Character.isLetter(c)) hasLetter = true;
            if (Character.isDigit(c))  hasDigit  = true;
        }

        return hasLetter && hasDigit;
    }

    public static void requireValidPassword(String password) {
        if (!isValidPassword(password)) {
            throw new IllegalArgumentException(
                "Password must be 6-12 characters long and contain at least one letter and one number."
            );
        }
    }

    public static String generateResetToken() {
        return UUID.randomUUID().toString();
    }
}
