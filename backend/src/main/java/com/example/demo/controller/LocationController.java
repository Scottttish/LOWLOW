package com.example.demo.controller;

import com.example.demo.service.LocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/locations")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class LocationController {
    
    @Autowired
    private LocationService locationService;
    
    @GetMapping
    public ResponseEntity<?> getUserLocations(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Неавторизованный доступ"
                ));
            }
            
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Используйте /api/account/user/{id}/locations"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Ошибка при получении локаций: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping
    public ResponseEntity<?> saveLocation(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> locationData) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Неавторизованный доступ"
                ));
            }
            
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Используйте /api/account/user/{id}/location"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Ошибка при сохранении локации: " + e.getMessage()
            ));
        }
    }
}