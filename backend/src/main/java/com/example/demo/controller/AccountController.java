// backend/src/main/java/com/example/demo/controller/AccountController.java
package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.AccountService;
import com.example.demo.service.CardService;
import com.example.demo.service.LocationService;
import com.example.demo.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/account")
public class AccountController {
    
    @Autowired
    private AccountService accountService;
    
    @Autowired
    private CardService cardService;
    
    @Autowired
    private LocationService locationService;
    
    @Autowired
    private OrderService orderService;
    
    @GetMapping("/user/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        try {
            System.out.println("🔍 [AccountController] GET /api/account/user/me");
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                System.out.println("❌ [AccountController] Аутентификация не пройдена");
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Пользователь не авторизован"
                ));
            }
            
            Object principal = auth.getPrincipal();
            Long userId = null;
            
            if (principal instanceof User) {
                userId = ((User) principal).getId();
                System.out.println("✅ [AccountController] User ID из объекта User: " + userId);
            } else {
                System.out.println("❌ [AccountController] Principal не является объектом User: " + 
                                  principal.getClass().getName());
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Неверный тип аутентификации"
                ));
            }
            
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Не удалось получить ID пользователя"
                ));
            }
            
            Map<String, Object> result = accountService.getUserById(userId);
            
            if ((Boolean) result.get("success")) {
                System.out.println("✅ [AccountController] Данные пользователя получены для ID: " + userId);
                return ResponseEntity.ok(result);
            } else {
                System.out.println("❌ [AccountController] Ошибка в сервисе: " + result.get("message"));
                return ResponseEntity.status(404).body(result);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [AccountController] Ошибка в /api/account/user/me: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Внутренняя ошибка сервера: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/user/me/location")
    public ResponseEntity<Map<String, Object>> saveCurrentUserLocation(@RequestBody Map<String, Object> locationData) {
        try {
            System.out.println("📍 [AccountController] POST /api/account/user/me/location");
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Пользователь не авторизован"
                ));
            }
            
            Object principal = auth.getPrincipal();
            Long userId = null;
            
            if (principal instanceof User) {
                userId = ((User) principal).getId();
            } else {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Неверный тип аутентификации"
                ));
            }
            
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Не удалось получить ID пользователя"
                ));
            }
            
            if (!locationData.containsKey("latitude") || !locationData.containsKey("longitude")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Широта и долгота обязательны"
                ));
            }
            
            Map<String, Object> result = locationService.saveUserLocation(userId, locationData);
            
            if ((Boolean) result.get("success")) {
                System.out.println("✅ [AccountController] Локация сохранена для пользователя ID: " + userId);
                return ResponseEntity.ok(result);
            } else {
                System.out.println("❌ [AccountController] Ошибка сохранения локации: " + result.get("message"));
                return ResponseEntity.badRequest().body(result);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [AccountController] Ошибка сохранения локации: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Внутренняя ошибка сервера: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/user/me/location/current")
    public ResponseEntity<Map<String, Object>> getCurrentUserLocation() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Пользователь не авторизован"
                ));
            }
            
            Object principal = auth.getPrincipal();
            Long userId = null;
            
            if (principal instanceof User) {
                userId = ((User) principal).getId();
            } else {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Неверный тип аутентификации"
                ));
            }
            
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Не удалось получить ID пользователя"
                ));
            }
            
            Map<String, Object> result = locationService.getCurrentUserLocation(userId);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Внутренняя ошибка сервера: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/user/me/cards")
    public ResponseEntity<Map<String, Object>> getCurrentUserCards() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Пользователь не авторизован"
                ));
            }
            
            Object principal = auth.getPrincipal();
            Long userId = null;
            
            if (principal instanceof User) {
                userId = ((User) principal).getId();
            } else {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Неверный тип аутентификации"
                ));
            }
            
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Не удалось получить ID пользователя"
                ));
            }
            
            Map<String, Object> result = cardService.getUserCards(userId);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Внутренняя ошибка сервера: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/user/me/orders")
    public ResponseEntity<Map<String, Object>> getCurrentUserOrders() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Пользователь не авторизован"
                ));
            }
            
            Object principal = auth.getPrincipal();
            Long userId = null;
            
            if (principal instanceof User) {
                userId = ((User) principal).getId();
            } else {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Неверный тип аутентификации"
                ));
            }
            
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Не удалось получить ID пользователя"
                ));
            }
            
            Map<String, Object> result = orderService.getUserOrders(userId);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Внутренняя ошибка сервера: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        System.out.println("✅ [AccountController] Health check выполнен");
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Account service is running",
            "timestamp", System.currentTimeMillis(),
            "service", "Account Service"
        ));
    }
}