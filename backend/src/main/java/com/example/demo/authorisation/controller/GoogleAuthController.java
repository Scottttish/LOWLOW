package com.example.demo.authorisation.controller;

import com.example.demo.authorisation.model.User;
import com.example.demo.authorisation.dto.AuthResponse;
import com.example.demo.authorisation.dto.UserResponse;
import com.example.demo.authorisation.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class GoogleAuthController {
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping("/user")
    public ResponseEntity<AuthResponse> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.ok(new AuthResponse(false, "User not authenticated", null));
        }
        
        String email = principal.getAttribute("email");
        String name = principal.getAttribute("name");
        
        if (email == null) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Email not provided by Google", null));
        }
        
        // Ищем пользователя по email
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            // Создаем нового пользователя для Google OAuth
            user = new User();
            user.setName(name != null ? name : "Google User");
            user.setEmail(email);
            user.setPassword("google_oauth_" + System.currentTimeMillis());
            user.setRole("покупатель");
            
            user = userRepository.save(user);
        }
        
        // Создаем response
        UserResponse userResponse = new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole()
        );
        
        AuthResponse response = new AuthResponse(true, "Google authentication successful", userResponse);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/google/callback")
    public ResponseEntity<AuthResponse> googleCallback(@RequestBody Map<String, Object> googleData) {
        try {
            System.out.println("Received Google callback data: " + googleData);
            
            String email = (String) googleData.get("email");
            String name = (String) googleData.get("name");
            String googleId = (String) googleData.get("googleId");
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new AuthResponse(false, "Email is required", null));
            }
            
            // Ищем пользователя по email
            User user = userRepository.findByEmail(email).orElse(null);
            
            if (user == null) {
                // Создаем нового пользователя
                user = new User();
                user.setName(name != null ? name : "Google User");
                user.setEmail(email);
                user.setPassword("google_oauth_" + (googleId != null ? googleId : System.currentTimeMillis()));
                user.setRole("покупатель");
                
                user = userRepository.save(user);
                System.out.println("New user created for Google: " + email);
            } else {
                System.out.println("Existing user found: " + email);
            }
            
            // Создаем response
            UserResponse userResponse = new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole()
            );
            
            AuthResponse response = new AuthResponse(true, "Google authentication successful", userResponse);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error in Google callback: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(new AuthResponse(false, "Internal server error: " + e.getMessage(), null));
        }
    }
}