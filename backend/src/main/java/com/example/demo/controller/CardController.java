package com.example.demo.controller;

import com.example.demo.service.CardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cards")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class CardController {
    
    @Autowired
    private CardService cardService;
    
    @GetMapping
    public ResponseEntity<?> getUserCards(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Неавторизованный доступ"
                ));
            }
            
            // Получаем ID пользователя из токена
            // В реальном приложении используйте JwtTokenProvider
            String token = authHeader.substring(7);
            // Здесь нужно получить userId из токена
            
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Используйте /api/account/user/{id}/cards"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Ошибка при получении карт: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping
    public ResponseEntity<?> addCard(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> cardData) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Неавторизованный доступ"
                ));
            }
            
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Используйте /api/account/user/{id}/cards"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Ошибка при добавлении карты: " + e.getMessage()
            ));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCard(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Неавторизованный доступ"
                ));
            }
            
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Используйте /api/account/user/{userId}/cards/{cardId}"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Ошибка при удалении карты: " + e.getMessage()
            ));
        }
    }
}