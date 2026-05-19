package com.vehiclerental.service;

import com.vehiclerental.model.*;
import com.vehiclerental.repository.BookingRepository;
import com.vehiclerental.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final VehicleService vehicleService;
    private final UserService userService;
    private final PricingService pricingService;
    private final NotificationService notificationService;
    private final com.vehiclerental.repository.LoyaltyRepository loyaltyRepository;
    private final com.vehiclerental.repository.WalletTransactionRepository walletTransactionRepository;

    public BookingService(BookingRepository bookingRepository,
                          PaymentRepository paymentRepository,
                          VehicleService vehicleService,
                          UserService userService,
                          PricingService pricingService,
                          NotificationService notificationService,
                          com.vehiclerental.repository.LoyaltyRepository loyaltyRepository,
                          com.vehiclerental.repository.WalletTransactionRepository walletTransactionRepository) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.vehicleService = vehicleService;
        this.userService = userService;
        this.pricingService = pricingService;
        this.notificationService = notificationService;
        this.loyaltyRepository = loyaltyRepository;
        this.walletTransactionRepository = walletTransactionRepository;
    }

    public Booking book(Booking booking) {
        User user = userService.getById(booking.getUserId());

        if (!"USER".equals(user.getRole()) && !"ADMIN".equals(user.getRole())) {
            throw new IllegalArgumentException("Only registered users can make bookings.");
        }

        Vehicle vehicle = vehicleService.getById(booking.getVehicleId());
        
        if (!"AVAILABLE".equalsIgnoreCase(vehicle.getVehicleStatus())) {
            throw new IllegalArgumentException(
                "This vehicle is currently " + vehicle.getVehicleStatus().toLowerCase().replace("_", " ") + 
                " and unavailable for booking."
            );
        }

        if (booking.getVehicleType() == null || booking.getVehicleType().isEmpty()) {
            booking.setVehicleType(vehicle.getType());
        }

        if (booking.getUserName() == null || booking.getUserName().isEmpty()) {
            booking.setUserName(user.getName());
        }

        if (booking.getUserEmail() == null || booking.getUserEmail().isEmpty()) {
            booking.setUserEmail(user.getEmail());
        }

        if (booking.getVehicleName() == null || booking.getVehicleName().isEmpty()) {
            booking.setVehicleName(vehicle.getMake() + " " + vehicle.getModel());
        }

        if ((booking.getVehiclePhoto() == null || booking.getVehiclePhoto().isEmpty())
                && vehicle.getPhotos() != null && !vehicle.getPhotos().isEmpty()) {
            booking.setVehiclePhoto(vehicle.getPhotos().get(0));
        }

        pricingService.applyPricing(booking);
        booking.setStatus("CONFIRMED");

        if (booking.getId() == null || booking.getId().isEmpty()) {
            booking.setId(UUID.randomUUID().toString());
        }

        Payment payment = new Payment();
        payment.setId(UUID.randomUUID().toString());
        payment.setBookingId(booking.getId());
        payment.setAmount(booking.getTotalPrice());
        
        // Use payment info from booking if provided by frontend
        String method = booking.getPayment() != null ? booking.getPayment().getMethod() : "CARD";
        String status = booking.getPayment() != null ? booking.getPayment().getStatus() : "COMPLETED";
        
        payment.setMethod(method);
        payment.setStatus(status);
        payment.setPaidAt(LocalDateTime.now().toString());
        booking.setPayment(payment);
        paymentRepository.save(payment);

        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(
            saved.getUserId(),
            "BOOKING_CONFIRMED",
            "Booking Confirmed!",
            "Your booking for " + saved.getVehicleName() + " has been confirmed successfully.",
            saved.getId(),
            "BOOKING"
        );

        notificationService.sendNotification(
            saved.getUserId(),
            "PAYMENT_SUCCESS",
            "Payment Successful",
            "Payment of $" + saved.getTotalPrice() + " for booking " + saved.getId() + " was completed.",
            saved.getId(),
            "PAYMENT"
        );

        vehicle.setVehicleStatus("RENTED");
        vehicleService.save(vehicle);

        if (user instanceof Customer customer) {
            customer.addLoyaltyPoints(10);
            userService.save(customer);

            WalletTransaction txn = new WalletTransaction(
                null,
                saved.getUserId(),
                "LOYALTY_POINTS",
                10.0,
                "Earned 10 loyalty points from booking " + saved.getId(),
                LocalDateTime.now().toString()
            );
            walletTransactionRepository.save(txn);
        }

        return saved;
    }

    public List<Booking> getAll() {
        return bookingRepository.findAll();
    }

    public List<Booking> getBookingsForUser(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public Booking getById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + id));
    }

    public Booking updateStatus(String id, String newStatus) {
        Booking booking = getById(id);
        String current = booking.getStatus();

        if (current.equals(newStatus)) return booking;
        
        boolean valid = switch (current) {
            case "PENDING" -> newStatus.equals("CONFIRMED") || newStatus.equals("CANCELLED");
            case "CONFIRMED" -> newStatus.equals("ACTIVE") || newStatus.equals("CANCELLED");
            case "ACTIVE" -> newStatus.equals("COMPLETED");
            default -> false;
        };

        if (!valid) {
            throw new IllegalStateException(
                    "Invalid status transition: " + current + " → " + newStatus
            );
        }

        booking.setStatus(newStatus);

        notificationService.sendNotification(
            booking.getUserId(),
            "BOOKING_STATUS_UPDATE",
            "Booking Status: " + newStatus,
            "Your booking for " + booking.getVehicleName() + " is now " + newStatus.toLowerCase() + ".",
            booking.getId(),
            "BOOKING"
        );

        if ("ACTIVE".equals(newStatus) || "COMPLETED".equals(newStatus) || "CANCELLED".equals(newStatus)) {
            Vehicle vehicle = vehicleService.getById(booking.getVehicleId());

            if ("ACTIVE".equals(newStatus)) {
                vehicle.setVehicleStatus("RENTED");
            } else {
                vehicle.setVehicleStatus("AVAILABLE");
            }

            vehicleService.save(vehicle);
        }

        return bookingRepository.save(booking);
    }

    public Booking cancelBooking(String id, String reason) {
        Booking booking = getById(id);

        if (!"PENDING".equals(booking.getStatus()) && !"CONFIRMED".equals(booking.getStatus()) && !"ACTIVE".equals(booking.getStatus())) {
            throw new IllegalStateException(
                    "Cannot cancel a booking with status: " + booking.getStatus()
            );
        }

        double cancellationFee = pricingService.calculateCancellationFee(booking.getTotalPrice());
        booking.setCancellationFee(cancellationFee);
        booking.setStatus("CANCELLED");
        booking.setCancellationReason(reason != null ? reason : "Not specified");
        booking.setCancelledAt(LocalDateTime.now().toString());

        if (booking.getPayment() != null) {
            double refund = Math.max(0, booking.getTotalPrice() - cancellationFee);
            booking.getPayment().setRefundAmount(refund);
            booking.getPayment().setCancellationFee(cancellationFee);
            booking.getPayment().setStatus("REFUNDED");
            paymentRepository.save(booking.getPayment());
        }

        Vehicle vehicle = vehicleService.getById(booking.getVehicleId());
        vehicle.setVehicleStatus("AVAILABLE");
        vehicleService.save(vehicle);

        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(
            saved.getUserId(),
            "BOOKING_CANCELLED",
            "Booking Cancelled",
            "Your booking for " + saved.getVehicleName() + " has been cancelled. Reason: " + saved.getCancellationReason(),
            saved.getId(),
            "BOOKING"
        );

        return saved;
    }

    public Booking editBooking(String id, Booking editData) {
        Booking existing = getById(id);

        // 1. Eligibility Checks
        if (!"CONFIRMED".equals(existing.getStatus())) {
            throw new IllegalStateException("Only confirmed bookings can be edited.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDateTime.parse(existing.getStartDate());
        if (now.isAfter(start)) {
            throw new IllegalStateException("Cannot edit a booking after the rental has started.");
        }

        // 2. Preserve Original Price if not already set
        if ("NOT_EDITED".equals(existing.getEditStatus())) {
            existing.setOriginalTotalPrice(existing.getTotalPrice());
        }

        // 3. Update Editable Fields
        existing.setStartDate(editData.getStartDate());
        existing.setEndDate(editData.getEndDate());
        existing.setBookingDays(editData.getBookingDays());
        existing.setBookingHours(editData.getBookingHours());
        existing.setRentalMode(editData.getRentalMode());
        // Note: other fields like contactNote could be added if they exist in model

        // 4. Recalculate Price
        double oldTotal = existing.getTotalPrice();
        pricingService.applyPricing(existing);
        double newTotal = existing.getTotalPrice();

        existing.setEditedAt(LocalDateTime.now().toString());

        // 5. Price Change Logic
        if (newTotal > oldTotal) {
            double extra = newTotal - oldTotal;
            existing.setAdditionalAmountDue(extra);
            existing.setRentalCreditAmount(0);
            existing.setEditStatus("PENDING_PAYMENT");

            notificationService.sendNotification(
                existing.getUserId(),
                "BOOKING_EDIT_PAYMENT_REQUIRED",
                "Additional Payment Required",
                "Your booking update for " + existing.getVehicleName() + " requires an additional payment of $" + extra + ".",
                existing.getId(),
                "PAYMENT"
            );
        } else if (newTotal < oldTotal) {
            double credit = oldTotal - newTotal;
            existing.setRentalCreditAmount(credit);
            existing.setAdditionalAmountDue(0);
            existing.setEditStatus("EDITED");

            // Update user's wallet rental credit in loyalty record
            LoyaltyRecord lr = loyaltyRepository.findByUserId(existing.getUserId()).orElseGet(() -> {
                return new LoyaltyRecord(existing.getUserId(), 0, 0.0, 0.0);
            });
            lr.setRentalCredit(lr.getRentalCredit() + credit);
            lr.setUpdatedAt(LocalDateTime.now().toString());
            loyaltyRepository.save(lr);

            // Record wallet transaction
            WalletTransaction txn = new WalletTransaction(
                null,
                existing.getUserId(),
                "RENTAL_CREDIT",
                credit,
                "Booking price reduced after editing booking " + existing.getId(),
                LocalDateTime.now().toString()
            );
            walletTransactionRepository.save(txn);

            notificationService.sendNotification(
                existing.getUserId(),
                "BOOKING_EDIT_CREDIT_ADDED",
                "Rental Credit Added",
                "Your booking update for " + existing.getVehicleName() + " resulted in a rental credit of $" + credit + ".",
                existing.getId(),
                "BOOKING"
            );
        } else {
            existing.setEditStatus("EDITED");
            existing.setAdditionalAmountDue(0);
            existing.setRentalCreditAmount(0);
        }

        notificationService.sendNotification(
            existing.getUserId(),
            "BOOKING_UPDATED",
            "Booking Updated",
            "Your booking for " + existing.getVehicleName() + " has been updated successfully.",
            existing.getId(),
            "BOOKING"
        );

        return bookingRepository.save(existing);
    }

    public Booking completeEditPayment(String id) {
        Booking booking = getById(id);
        if (!"PENDING_PAYMENT".equals(booking.getEditStatus())) {
            throw new IllegalStateException("No pending edit payment for this booking.");
        }

        // Update payment record if needed or create a new one for the extra amount
        if (booking.getPayment() != null) {
            booking.getPayment().setAmount(booking.getTotalPrice());
            paymentRepository.save(booking.getPayment());
        }

        booking.setEditStatus("EDITED");
        booking.setAdditionalAmountDue(0);

        notificationService.sendNotification(
            booking.getUserId(),
            "PAYMENT_SUCCESS",
            "Additional Payment Received",
            "Payment for your booking update was successful.",
            booking.getId(),
            "PAYMENT"
        );

        return bookingRepository.save(booking);
    }

    public void deleteBooking(String id) {
        Booking booking = getById(id);

        if (booking.getVehicleId() != null && !booking.getVehicleId().isEmpty()) {
            Vehicle vehicle = vehicleService.getById(booking.getVehicleId());
            vehicle.setAvailable(true);
            vehicleService.save(vehicle);
        }

        bookingRepository.deleteById(id);
    }
}