package com.example.demo.authorisation.dto;

public class UserProfileDTO {
    private String name;
    private String email;
    private String phone;
    private String cardNumber;
    private String cardExpiry;
    private String cardCvc;
    private Double latitude;
    private Double longitude;
    
    // Конструкторы
    public UserProfileDTO() {}
    
    // Геттеры и сеттеры
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }
    
    public String getCardExpiry() { return cardExpiry; }
    public void setCardExpiry(String cardExpiry) { this.cardExpiry = cardExpiry; }
    
    public String getCardCvc() { return cardCvc; }
    public void setCardCvc(String cardCvc) { this.cardCvc = cardCvc; }
    
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}