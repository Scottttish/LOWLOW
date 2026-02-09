package com.example.demo.dto;

import java.util.Map;

public class AuthResponse {
    private boolean success;
    private String message;
    private Map<String, Object> user;
    private String token;
    private Long userId;
    
    // Конструкторы
    public AuthResponse() {}
    
    public AuthResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
    
    public AuthResponse(boolean success, String message, Map<String, Object> user) {
        this.success = success;
        this.message = message;
        this.user = user;
    }
    
    public AuthResponse(boolean success, String message, Map<String, Object> user, String token) {
        this.success = success;
        this.message = message;
        this.user = user;
        this.token = token;
    }
    
    public AuthResponse(boolean success, String message, Map<String, Object> user, String token, Long userId) {
        this.success = success;
        this.message = message;
        this.user = user;
        this.token = token;
        this.userId = userId;
    }
    
    // Геттеры и сеттеры
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public Map<String, Object> getUser() { return user; }
    public void setUser(Map<String, Object> user) { this.user = user; }
    
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}