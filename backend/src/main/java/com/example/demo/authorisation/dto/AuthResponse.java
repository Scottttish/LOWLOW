package com.example.demo.authorisation.dto;

public class AuthResponse {
    private boolean success;
    private String message;
    private UserResponse user;
    
    public AuthResponse() {}
    
    public AuthResponse(boolean success, String message, UserResponse user) {
        this.success = success;
        this.message = message;
        this.user = user;
    }
    
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public UserResponse getUser() { return user; }
    public void setUser(UserResponse user) { this.user = user; }
}