package com.example.demo.authorisation.controller;

import com.example.demo.authorisation.model.User;
import com.example.demo.authorisation.dto.UserProfileDTO;
import com.example.demo.authorisation.service.UserProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000")
public class UserProfileController {
    
    @Autowired
    private UserProfileService userProfileService;
    
    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long userId) {
        try {
            User user = userProfileService.getUserProfile(userId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return createErrorResponse(e.getMessage());
        }
    }
    
    @PutMapping("/profile/{userId}")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long userId, @RequestBody UserProfileDTO profileDTO) {
        try {
            User updatedUser = userProfileService.updateUserProfile(userId, profileDTO);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return createErrorResponse(e.getMessage());
        }
    }
    
    // Добавление/обновление локации
    @PostMapping("/{userId}/location")
    public ResponseEntity<?> addOrUpdateLocation(
            @PathVariable Long userId,
            @RequestParam Double latitude,
            @RequestParam Double longitude) {
        try {
            User updatedUser = userProfileService.addUserLocation(userId, latitude, longitude);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return createErrorResponse(e.getMessage());
        }
    }
    
    // Удаление локации
    @DeleteMapping("/{userId}/location")
    public ResponseEntity<?> removeLocation(@PathVariable Long userId) {
        try {
            User updatedUser = userProfileService.removeUserLocation(userId);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return createErrorResponse(e.getMessage());
        }
    }
    
    // Добавление/обновление банковской карты
    @PostMapping("/{userId}/card")
    public ResponseEntity<?> addOrUpdateCard(
            @PathVariable Long userId,
            @RequestParam String cardNumber,
            @RequestParam String cardExpiry,
            @RequestParam String cardCvc) {
        try {
            User updatedUser = userProfileService.addUserCard(userId, cardNumber, cardExpiry, cardCvc);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return createErrorResponse(e.getMessage());
        }
    }
    
    // Удаление банковской карты
    @DeleteMapping("/{userId}/card")
    public ResponseEntity<?> removeCard(@PathVariable Long userId) {
        try {
            User updatedUser = userProfileService.removeUserCard(userId);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return createErrorResponse(e.getMessage());
        }
    }
    
    // Проверка наличия карты
    @GetMapping("/{userId}/has-card")
    public ResponseEntity<?> hasCard(@PathVariable Long userId) {
        try {
            boolean hasCard = userProfileService.hasCard(userId);
            Map<String, Boolean> response = new HashMap<>();
            response.put("hasCard", hasCard);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return createErrorResponse(e.getMessage());
        }
    }
    
    // Проверка наличия локации
    @GetMapping("/{userId}/has-location")
    public ResponseEntity<?> hasLocation(@PathVariable Long userId) {
        try {
            boolean hasLocation = userProfileService.hasLocation(userId);
            Map<String, Boolean> response = new HashMap<>();
            response.put("hasLocation", hasLocation);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return createErrorResponse(e.getMessage());
        }
    }
    
    // Вспомогательный метод для создания ответа с ошибкой
    private ResponseEntity<Map<String, String>> createErrorResponse(String errorMessage) {
        Map<String, String> response = new HashMap<>();
        response.put("error", errorMessage);
        return ResponseEntity.badRequest().body(response);
    }
}