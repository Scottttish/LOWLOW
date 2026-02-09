package com.example.demo.authorisation.dto;

public class LocationRequestDTO {
    private Double latitude;
    private Double longitude;
    
    // Конструкторы
    public LocationRequestDTO() {}
    
    public LocationRequestDTO(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
    
    // Геттеры и сеттеры
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}