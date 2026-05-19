package com.vehiclerental.service;

import com.vehiclerental.model.Message;
import com.vehiclerental.model.SupportTicket;
import com.vehiclerental.model.User;
import com.vehiclerental.repository.SupportTicketRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final UserService userService;

    public SupportTicketService(SupportTicketRepository ticketRepository,
                                UserService userService) {
        this.ticketRepository = ticketRepository;
        this.userService      = userService;
    }

    public SupportTicket create(SupportTicket ticket) {

        if (ticket.getUserId() != null) {
            User u = userService.getById(ticket.getUserId());
            if (ticket.getUserName() == null || ticket.getUserName().isEmpty()) {
                ticket.setUserName(u.getName());
            }
            if (ticket.getUserEmail() == null || ticket.getUserEmail().isEmpty()) {
                ticket.setUserEmail(u.getEmail());
            }
        }

        if (ticket.getStatus() == null || ticket.getStatus().isEmpty()) {
            ticket.setStatus("OPEN");
        }

        String now = LocalDateTime.now().toString();
        ticket.setCreatedAt(now);
        ticket.setUpdatedAt(now);

        String initialMessage = ticket.getMessage();
        if (initialMessage == null || initialMessage.isEmpty()) {
            initialMessage = ticket.getCurrentMessage();
        }
        if ((initialMessage == null || initialMessage.isEmpty()) && ticket.getMessages() != null) {
            for (Message m : ticket.getMessages()) {
                if (m == null) {
                    continue;
                }
                String c = m.getContent();
                if (c != null && !c.isEmpty()) {
                    initialMessage = c;
                    break;
                }
            }
        }

        ticket.setMessages(new ArrayList<>());

        if (initialMessage != null && !initialMessage.isEmpty()) {
            Message firstMessage = new Message(
                UUID.randomUUID().toString(),
                "USER",
                initialMessage,
                LocalDateTime.now().toString()
            );
            ticket.addMessage(firstMessage);
        }

        ticket.setMessage(null);

        return ticketRepository.save(ticket);
    }

    public List<SupportTicket> getAll() {
        return ticketRepository.findAll();
    }

    public SupportTicket getById(String id) {
        return ticketRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Support ticket not found: " + id));
    }

    public List<SupportTicket> getByUserId(String userId) {
        return ticketRepository.findByUserId(userId);
    }

    public List<SupportTicket> getByStatus(String status) {
        return ticketRepository.findByStatus(status);
    }

    public SupportTicket reply(String id, String sender, String text) {
        SupportTicket ticket = getById(id);

        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Reply message cannot be empty.");
        }

        Message replyMessage = new Message(
            UUID.randomUUID().toString(),
            sender != null ? sender : "USER",
            text.trim(),
            LocalDateTime.now().toString()
        );

        ticket.addMessage(replyMessage);
        ticket.setUpdatedAt(LocalDateTime.now().toString());

        return ticketRepository.save(ticket);
    }

    public SupportTicket adminReply(String id, String text) {
        SupportTicket ticket = reply(id, "ADMIN", text);
        ticket.setStatus("RESOLVED");
        return ticketRepository.save(ticket);
    }

    public SupportTicket update(String id, SupportTicket updated) {
        SupportTicket existing = getById(id);

        if (updated.getSubject() != null && !updated.getSubject().isEmpty()) {
            existing.setSubject(updated.getSubject());
        }
        if (updated.getStatus() != null && !updated.getStatus().isEmpty()) {
            existing.setStatus(updated.getStatus());
        }

        existing.setUpdatedAt(LocalDateTime.now().toString());
        return ticketRepository.save(existing);
    }

    public SupportTicket resolve(String id) {
        SupportTicket ticket = getById(id);
        ticket.setStatus("RESOLVED");
        ticket.setUpdatedAt(LocalDateTime.now().toString());
        return ticketRepository.save(ticket);
    }

    public void delete(String id) {
        getById(id);
        ticketRepository.deleteById(id);

    }
}
