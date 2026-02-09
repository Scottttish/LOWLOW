package com.example.demo.dto;

public class AuthRequest {
    private String email;
    private String password;
    private String name;
    private String phone;
    private String city;
    private String address;
    private Double latitude;
    private Double longitude;
    private String companyName;
    private String bin;
    
    // Конструкторы
    public AuthRequest() {}
    
    public AuthRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }
    
    public AuthRequest(String name, String phone, String email, String password, String city) {
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.password = password;
        this.city = city;
    }
    
    // Геттеры и сеттеры
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    
    public String getBin() { return bin; }
    public void setBin(String bin) { this.bin = bin; }
}