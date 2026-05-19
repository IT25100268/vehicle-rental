package com.vehiclerental.service;

import com.vehiclerental.model.Notification;
import com.vehiclerental.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification create(Notification n) {
        if (n.getStatus() == null) n.setStatus("ACTIVE");
        return notificationRepository.save(n);
    }

    public Notification sendNotification(String userId, String type, String title, String message, String entityId, String entityType) {
        Notification n = new Notification(userId, type, title, message);
        n.setRelatedEntityId(entityId);
        n.setRelatedEntityType(entityType);
        return create(n);
    }

    public Notification sendBroadcast(String role, String type, String title, String message) {
        Notification n = new Notification(null, type, title, message);
        n.setTargetRole(role);
        return create(n);
    }

    public List<Notification> listAll() {
        return notificationRepository.findAll();
    }

    public List<Notification> listForUser(String userId, String role) {
        return notificationRepository.findForUser(userId, role);
    }

    public Notification markRead(String id) {
        Notification n = notificationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
        n.setRead(true);
        return notificationRepository.save(n);
    }

    public Notification markUnread(String id) {
        Notification n = notificationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
        n.setRead(false);
        return notificationRepository.save(n);
    }

    public void markAllRead(String userId, String role) {
        List<Notification> targets;
        if (userId != null || role != null) {
            targets = notificationRepository.findForUser(userId, role);
        } else {
            targets = notificationRepository.findAll();
        }
        
        for (Notification n : targets) {
            if (!n.isRead()) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        }
    }

    public void delete(String id) {
        notificationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
        notificationRepository.deleteById(id);
    }

    public void clearForUser(String userId, String role) {
        if (userId != null || role != null) {
            notificationRepository.deleteAllForUser(userId, role);
        } else {

        }
    }
}
