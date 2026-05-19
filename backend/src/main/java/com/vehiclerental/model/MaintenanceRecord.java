package com.vehiclerental.model;

public class MaintenanceRecord {
    private String id;
    private String vehicleId;
    private String status;
    private String reason;
    private String startDate;
    private String endDate;
    private String timestamp;

    public MaintenanceRecord() {}

    public MaintenanceRecord(String vehicleId, String status, String reason, String startDate, String endDate) {
        this.id = java.util.UUID.randomUUID().toString();
        this.vehicleId = vehicleId;
        this.status = status;
        this.reason = reason;
        this.startDate = startDate;
        this.endDate = endDate;
        this.timestamp = java.time.LocalDateTime.now().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getVehicleId() { return vehicleId; }
    public void setVehicleId(String vehicleId) { this.vehicleId = vehicleId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
