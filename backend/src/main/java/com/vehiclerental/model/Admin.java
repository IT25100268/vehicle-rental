package com.vehiclerental.model;

public class Admin extends User {

    private String adminLevel;
    private String department;
    private int clearanceLevel;

    public Admin() {
        super();
        this.setRole("ADMIN");
        this.clearanceLevel = 1;
    }

    public Admin(String name, String email, String password) {
        super(name, email, password, "ADMIN");
        this.clearanceLevel = 1;
    }

    public String getAdminLevel() {
        return adminLevel;
    }

    public void setAdminLevel(String adminLevel) {
        this.adminLevel = adminLevel;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public int getClearanceLevel() { return clearanceLevel; }
    public void setClearanceLevel(int level) { this.clearanceLevel = level; }
}