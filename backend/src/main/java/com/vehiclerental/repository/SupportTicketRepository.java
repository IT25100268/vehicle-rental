package com.vehiclerental.repository;

import com.vehiclerental.model.*;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@Repository
public class SupportTicketRepository {
    private final List<SupportTicket> tickets = new ArrayList<>();
    private final String fileName = "support_tickets.txt";
    private final Path dataPath;

    public SupportTicketRepository() {
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
        tickets.clear();
        if (!Files.exists(dataPath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(dataPath, StandardCharsets.UTF_8);
            for (String line : lines) {
                if (line != null && !line.trim().isEmpty()) {
                    SupportTicket t = mapToEntity(line.trim());
                    if (t != null) {
                        tickets.add(t);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading " + fileName + ": " + e.getMessage());
        }
    }

    public void saveAll() {
        List<String> lines = new ArrayList<>();
        for (SupportTicket t : tickets) {
            lines.add(mapToString(t));
        }
        try {
            Files.write(dataPath, lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error writing to " + fileName + ": " + e.getMessage());
        }
    }

    public SupportTicket save(SupportTicket ticket) {
        if (ticket.getId() == null || ticket.getId().isEmpty()) {
            ticket.setId(UUID.randomUUID().toString());
        }
        
        boolean found = false;
        for (int i = 0; i < tickets.size(); i++) {
            if (tickets.get(i).getId() != null && tickets.get(i).getId().equals(ticket.getId())) {
                tickets.set(i, ticket);
                found = true;
                break;
            }
        }
        
        if (!found) {
            tickets.add(ticket);
        }
        
        saveAll();
        return ticket;
    }

    public List<SupportTicket> findAll() {
        List<SupportTicket> list = new ArrayList<>(tickets);
        Collections.sort(list, new Comparator<SupportTicket>() {
            @Override
            public int compare(SupportTicket a, SupportTicket b) {
                String ca = a.getCreatedAt();
                String cb = b.getCreatedAt();
                if (ca == null && cb == null) return 0;
                if (ca == null) return 1;
                if (cb == null) return -1;
                return cb.compareTo(ca);
            }
        });
        return list;
    }

    public Optional<SupportTicket> findById(String id) {
        for (SupportTicket t : tickets) {
            if (t.getId().equals(id)) {
                return Optional.of(t);
            }
        }
        return Optional.empty();
    }

    public Optional<SupportTicket> findByEmail(String email) {
        for (SupportTicket t : tickets) {
            if (t.getUserEmail() != null && t.getUserEmail().equalsIgnoreCase(email)) {
                return Optional.of(t);
            }
        }
        return Optional.empty();
    }

    public List<SupportTicket> findByUserId(String userId) {
        List<SupportTicket> filtered = new ArrayList<>();
        for (SupportTicket t : tickets) {
            if (userId != null && userId.equals(t.getUserId())) {
                filtered.add(t);
            }
        }
        return filtered;
    }

    public List<SupportTicket> findByStatus(String status) {
        List<SupportTicket> filtered = new ArrayList<>();
        for (SupportTicket t : tickets) {
            if (status != null && status.equalsIgnoreCase(t.getStatus())) {
                filtered.add(t);
            }
        }
        return filtered;
    }

    public void deleteById(String id) {
        for (int i = 0; i < tickets.size(); i++) {
            if (tickets.get(i).getId().equals(id)) {
                tickets.remove(i);
                break;
            }
        }
        saveAll();
    }

    private SupportTicket mapToEntity(String line) {
        String[] parts = line.split("\\|", -1);
        if (parts.length < 5) return null;

        SupportTicket t = new SupportTicket();
        t.setId(parts[0]);
        t.setUserId(parts[1]);
        t.setUserEmail(unescape(parts[2]));
        t.setSubject(unescape(parts[3]));
        t.setMessage(unescape(parts[4]));

        if (parts.length > 5) t.setStatus(parts[5]);
        if (parts.length > 6) t.setUserName(unescape(parts[6]));
        if (parts.length > 7) t.setCreatedAt(unescape(parts[7]));
        if (parts.length > 8) t.setUpdatedAt(unescape(parts[8]));
        
        if (parts.length > 9 && !parts[9].isEmpty()) {
            String[] msgList = parts[9].split(";;", -1);
            List<Message> messages = new ArrayList<>();
            for (String mStr : msgList) {
                String[] mParts = mStr.split(";", -1);
                if (mParts.length >= 4) {
                    Message m = new Message();
                    m.setId(mParts[0]);
                    m.setSenderId(unescape(mParts[1]));
                    m.setContent(unescape(mParts[2]));
                    m.setTimestamp(unescape(mParts[3]));
                    if (mParts.length > 4) m.setSenderName(unescape(mParts[4]));
                    messages.add(m);
                }
            }
            t.setMessages(messages);
        }

        return t;
    }

    private String mapToString(SupportTicket t) {
        StringBuilder sb = new StringBuilder();
        sb.append(t.getId()).append("|")
          .append(t.getUserId()).append("|")
          .append(escape(t.getUserEmail())).append("|")
          .append(escape(t.getSubject())).append("|")
          .append(escape(t.getMessage())).append("|")
          .append(t.getStatus()).append("|")
          .append(escape(t.getUserName())).append("|")
          .append(escape(t.getCreatedAt())).append("|")
          .append(escape(t.getUpdatedAt())).append("|");
        
        if (t.getMessages() != null && !t.getMessages().isEmpty()) {
            List<String> mList = new ArrayList<>();
            for (Message m : t.getMessages()) {
                mList.add(m.getId() + ";" + 
                          escape(m.getSenderId()) + ";" + 
                          escape(m.getContent()) + ";" + 
                          escape(m.getTimestamp()) + ";" + 
                          escape(m.getSenderName()));
            }
            sb.append(String.join(";;", mList));
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
