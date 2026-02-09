package com.example.demo.authorisation.dto;

public class CardRequestDTO {
    private String cardNumber;
    private String cardExpiry;
    private String cardCvc;
    
    // Конструкторы
    public CardRequestDTO() {}
    
    public CardRequestDTO(String cardNumber, String cardExpiry, String cardCvc) {
        this.cardNumber = cardNumber;
        this.cardExpiry = cardExpiry;
        this.cardCvc = cardCvc;
    }
    
    // Геттеры и сеттеры
    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }
    
    public String getCardExpiry() { return cardExpiry; }
    public void setCardExpiry(String cardExpiry) { this.cardExpiry = cardExpiry; }
    
    public String getCardCvc() { return cardCvc; }
    public void setCardCvc(String cardCvc) { this.cardCvc = cardCvc; }
}