// backend\src\main\java\com\example\demo\controller\AuthController.java
package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    
    public AuthController(UserRepository userRepository, 
                         PasswordEncoder passwordEncoder,
                         JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            System.out.println("📝 Register request: " + request);
            
            String email = request.get("email");
            String password = request.get("password");
            String name = request.get("name");
            String phone = request.get("phone");
            String city = request.get("city");
            
            // Валидация
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email обязателен"
                ));
            }
            
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Пароль обязателен"
                ));
            }
            
            // Проверка существования пользователя
            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Пользователь с таким email уже существует"
                ));
            }
            
            // Создание нового пользователя
            User user = new User();
            user.setName(name != null ? name : email.split("@")[0]);
            user.setEmail(email.toLowerCase());
            user.setPassword(passwordEncoder.encode(password));
            user.setPhone(phone != null ? phone : "+77000000000");
            user.setCity(city != null ? city : "Алматы");
            user.setBalance(5000.0);
            user.setIsActive(true);
            
            // Сохранение пользователя
            User savedUser = userRepository.save(user);
            System.out.println("✅ User saved with ID: " + savedUser.getId());
            
            // Генерация токена
            String token = jwtTokenProvider.generateToken(
                savedUser.getEmail(), 
                savedUser.getRole().name(),
                savedUser.getId()
            );
            
            // Подготовка данных пользователя для ответа
            Map<String, Object> userData = getUserDataMap(savedUser);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Регистрация выполнена успешно",
                "token", token,
                "user", userData
            ));
            
        } catch (Exception e) {
            System.err.println("❌ Registration error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Ошибка при регистрации: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            System.out.println("🔐 Login request: " + request);
            
            String email = request.get("email");
            String password = request.get("password");
            
            // Валидация
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email обязателен"
                ));
            }
            
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Пароль обязателен"
                ));
            }
            
            // Поиск пользователя
            Optional<User> userOptional = userRepository.findByEmail(email.toLowerCase());
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Пользователь не найден"
                ));
            }
            
            User user = userOptional.get();
            
            // Проверка пароля
            if (!passwordEncoder.matches(password, user.getPassword())) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Неверный пароль"
                ));
            }
            
            // Проверка активности аккаунта
            if (!user.getIsActive()) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Аккаунт заблокирован"
                ));
            }
            
            // Обновление времени последнего входа
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            
            // Генерация токена
            String token = jwtTokenProvider.generateToken(
                user.getEmail(), 
                user.getRole().name(),
                user.getId()
            );
            
            // Подготовка данных пользователя для ответа
            Map<String, Object> userData = getUserDataMap(user);
            
            System.out.println("✅ Login successful for user: " + user.getEmail());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Вход выполнен успешно",
                "token", token,
                "user", userData
            ));
            
        } catch (Exception e) {
            System.err.println("❌ Login error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Ошибка при входе: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("👤 /api/auth/me called, authHeader: " + 
                (authHeader != null ? authHeader.substring(0, Math.min(authHeader.length(), 30)) + "..." : "null"));
            
            // Проверка заголовка авторизации
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Токен не предоставлен"
                ));
            }
            
            String token = authHeader.substring(7);
            
            // Валидация токена
            if (!jwtTokenProvider.validateToken(token)) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Недействительный токен"
                ));
            }
            
            // Извлечение userId из токена
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Не удалось получить данные пользователя из токена"
                ));
            }
            
            // Поиск пользователя в БД
            Optional<User> userOptional = userRepository.findById(userId);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Пользователь не найден"
                ));
            }
            
            User user = userOptional.get();
            
            // Проверка активности аккаунта
            if (!user.getIsActive()) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Аккаунт заблокирован"
                ));
            }
            
            // Подготовка данных пользователя для ответа
            Map<String, Object> userData = getUserDataMap(user);
            
            System.out.println("✅ /api/auth/me successful for user: " + user.getEmail());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "user", userData
            ));
            
        } catch (Exception e) {
            System.err.println("❌ /api/auth/me error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Ошибка: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
        try {
            // В реальном приложении здесь можно добавить токен в blacklist
            // Для JWT stateless просто возвращаем успех
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Выход выполнен успешно"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Ошибка при выходе: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Токен не предоставлен"
                ));
            }
            
            String oldToken = authHeader.substring(7);
            
            if (!jwtTokenProvider.validateToken(oldToken)) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Недействительный токен"
                ));
            }
            
            String email = jwtTokenProvider.getEmailFromToken(oldToken);
            Long userId = jwtTokenProvider.getUserIdFromToken(oldToken);
            String role = jwtTokenProvider.extractRole(oldToken);
            
            if (email == null || userId == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Не удалось получить данные из токена"
                ));
            }
            
            // Генерация нового токена
            String newToken = jwtTokenProvider.generateToken(email, role, userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "token", newToken,
                "message", "Токен обновлен"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Ошибка при обновлении токена: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Вспомогательный метод для преобразования User в Map
     */
    private Map<String, Object> getUserDataMap(User user) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("phone", user.getPhone());
        userData.put("city", user.getCity());
        userData.put("role", user.getRole().name());
        userData.put("balance", user.getBalance());
        userData.put("avatarUrl", user.getAvatarUrl());
        userData.put("address", user.getAddress());
        userData.put("latitude", user.getLatitude());
        userData.put("longitude", user.getLongitude());
        userData.put("companyName", user.getCompanyName());
        userData.put("bin", user.getBin());
        userData.put("isActive", user.getIsActive());
        userData.put("createdAt", user.getCreatedAt());
        userData.put("updatedAt", user.getUpdatedAt());
        
        // Для совместимости с фронтендом
        userData.put("nickname", user.getName());
        userData.put("avatar", user.getAvatarUrl());
        
        return userData;
    }
}