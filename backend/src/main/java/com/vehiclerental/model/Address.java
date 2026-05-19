package com.vehiclerental.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Address {

    private String street;
    private String city;
    private String district;
    private String province;
    private String postalCode;
    private String country;

    public Address() {
        this.country = "Sri Lanka";
    }

    public Address(String street, String city, String district, String postalCode) {
        this.street     = street;
        this.city       = city;
        this.district   = district;
        this.postalCode = postalCode;
        this.country    = "Sri Lanka";
    }

    public Address(String street, String city, String district,
                   String province, String postalCode, String country) {
        this.street     = street;
        this.city       = city;
        this.district   = district;
        this.province   = province;
        this.postalCode = postalCode;
        this.country    = country;
    }

    public String getFormattedAddress() {
        StringBuilder sb = new StringBuilder();
        if (street   != null) sb.append(street).append(", ");
        if (city     != null) sb.append(city).append(", ");
        if (district != null) sb.append(district).append(", ");
        if (country  != null) sb.append(country);
        return sb.toString().replaceAll(", $", "");
    }

    public String getStreet()                { return street; }
    public void   setStreet(String street)   { this.street = street; }

    public String getCity()                  { return city; }
    public void   setCity(String city)       { this.city = city; }

    public String getDistrict()              { return district; }
    public void   setDistrict(String d)      { this.district = d; }

    public String getProvince()              { return province; }
    public void   setProvince(String p)      { this.province = p; }

    public String getPostalCode()            { return postalCode; }
    public void   setPostalCode(String pc)   { this.postalCode = pc; }

    public String getCountry()               { return country; }
    public void   setCountry(String country) { this.country = country; }

    @Override
    public String toString() {
        return "Address{street='" + street + "', city='" + city +
               "', district='" + district + "', postalCode='" + postalCode + "'}";
    }
}
