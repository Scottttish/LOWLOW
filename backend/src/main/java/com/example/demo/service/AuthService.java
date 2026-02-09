package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    
    /**
     * Регистрация пользователя
     */
    @Transactional
    public Map<String, Object> register(String name, String phone, String email, String password, 
                                        String city, String address, Double latitude, Double longitude) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Проверяем, существует ли пользователь
            if (userRepository.existsByEmail(email)) {
                response.put("success", false);
                response.put("message", "Пользователь с таким email уже существует");
                return response;
            }
            
            // Создаем пользователя
            User user = new User();
            user.setName(name);
            user.setPhone(phone);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(User.Role.USER);  // ИСПРАВЛЕНО: установка enum Role
            user.setBalance(5000.0);
            user.setIsActive(true);
            
            // Устанавливаем дополнительные данные
            if (city != null) {
                user.setCity(city);
            } else {
                user.setCity("Алматы");
            }
            
            if (address != null) {
                user.setAddress(address);
            }
            
            if (latitude != null) {
                user.setLatitude(latitude);
            }
            
            if (longitude != null) {
                user.setLongitude(longitude);
            }
            
            User savedUser = userRepository.save(user);
            
            // Формируем данные пользователя для ответа
            Map<String, Object> userData = getUserDataMap(savedUser);
            
            response.put("success", true);
            response.put("message", "Регистрация прошла успешно");
            response.put("user", userData);
            
            return response;
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка сервера: " + e.getMessage());
            return response;
        }
    }
    
    /**
     * Вход пользователя с проверкой is_active
     */
    public Map<String, Object> login(String email, String password) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<User> userOptional = userRepository.findByEmail(email);
            
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Пользователь не найден");
                return response;
            }
            
            User user = userOptional.get();
            
            // Проверяем активность пользователя
            if (user.getIsActive() != null && !user.getIsActive()) {
                response.put("success", false);
                response.put("message", "Аккаунт заблокирован");
                response.put("code", "ACCOUNT_INACTIVE");
                return response;
            }
            
            // Проверяем пароль
            if (!passwordEncoder.matches(password, user.getPassword())) {
                response.put("success", false);
                response.put("message", "Неверный пароль");
                return response;
            }
            
            // Обновляем время последнего входа
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            
            // Формируем данные пользователя для ответа
            Map<String, Object> userData = getUserDataMap(user);
            
            response.put("success", true);
            response.put("message", "Вход выполнен успешно");
            response.put("user", userData);
            
            return response;
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка сервера: " + e.getMessage());
            return response;
        }
    }
    
    /**
     * Выход пользователя
     */
    @Transactional
    public Map<String, Object> logout(Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Пользователь не найден");
                return response;
            }
            
            User user = userOptional.get();
            user.setIsActive(false);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            
            response.put("success", true);
            response.put("message", "Выход выполнен успешно");
            
            return response;
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при выходе: " + e.getMessage());
            return response;
        }
    }
    
    /**
     * Получение всех пользователей
     */
    public Map<String, Object> getAllUsers() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<User> users = userRepository.findAll();
            List<Map<String, Object>> userList = new ArrayList<>();
            
            for (User user : users) {
                userList.add(getUserDataMap(user));
            }
            
            response.put("success", true);
            response.put("users", userList);
            response.put("count", users.size());
            
            return response;
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при получении пользователей: " + e.getMessage());
            return response;
        }
    }
    
    /**
     * Получение пользователя по ID
     */
    public Map<String, Object> getUserById(Long id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<User> userOptional = userRepository.findById(id);
            
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Пользователь не найден");
                return response;
            }
            
            User user = userOptional.get();
            Map<String, Object> userData = getUserDataMap(user);
            
            response.put("success", true);
            response.put("user", userData);
            
            return response;
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при получении пользователя: " + e.getMessage());
            return response;
        }
    }
    
    /**
     * Обновление пользователя
     */
    @Transactional
    public Map<String, Object> updateUser(Long id, Map<String, Object> updateData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<User> userOptional = userRepository.findById(id);
            
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Пользователь не найден");
                return response;
            }
            
            User user = userOptional.get();
            
            // Обновляем поля
            if (updateData.containsKey("name")) {
                user.setName((String) updateData.get("name"));
            }
            
            if (updateData.containsKey("email")) {
                String newEmail = (String) updateData.get("email");
                if (!user.getEmail().equals(newEmail)) {
                    // Проверяем, не занят ли новый email
                    if (userRepository.existsByEmail(newEmail)) {
                        response.put("success", false);
                        response.put("message", "Email уже используется");
                        return response;
                    }
                    user.setEmail(newEmail);
                }
            }
            
            if (updateData.containsKey("phone")) {
                user.setPhone((String) updateData.get("phone"));
            }
            
            if (updateData.containsKey("city")) {
                user.setCity((String) updateData.get("city"));
            }
            
            if (updateData.containsKey("address")) {
                user.setAddress((String) updateData.get("address"));
            }
            
            if (updateData.containsKey("avatarUrl")) {
                user.setAvatarUrl((String) updateData.get("avatarUrl"));
            }
            
            if (updateData.containsKey("avatar")) {
                user.setAvatarUrl((String) updateData.get("avatar"));
            }
            
            if (updateData.containsKey("companyName")) {
                user.setCompanyName((String) updateData.get("companyName"));
            }
            
            if (updateData.containsKey("bin")) {
                user.setBin((String) updateData.get("bin"));
            }
            
            user.setUpdatedAt(LocalDateTime.now());
            User updatedUser = userRepository.save(user);
            
            Map<String, Object> userData = getUserDataMap(updatedUser);
            
            response.put("success", true);
            response.put("message", "Пользователь успешно обновлен");
            response.put("user", userData);
            
            return response;
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при обновлении пользователя: " + e.getMessage());
            return response;
        }
    }
    
    /**
     * Удаление пользователя
     */
    @Transactional
    public Map<String, Object> deleteUser(Long id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<User> userOptional = userRepository.findById(id);
            
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Пользователь не найден");
                return response;
            }
            
            User user = userOptional.get();
            userRepository.delete(user);
            
            response.put("success", true);
            response.put("message", "Пользователь успешно удален");
            
            return response;
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при удалении пользователя: " + e.getMessage());
            return response;
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
        userData.put("role", user.getRole().name());  // Преобразуем enum в строку
        userData.put("city", user.getCity());
        userData.put("address", user.getAddress());
        userData.put("balance", user.getBalance());
        userData.put("latitude", user.getLatitude());
        userData.put("longitude", user.getLongitude());
        userData.put("isActive", user.getIsActive());
        userData.put("companyName", user.getCompanyName());
        userData.put("bin", user.getBin());
        userData.put("avatarUrl", user.getAvatarUrl());
        userData.put("createdAt", user.getCreatedAt());
        userData.put("updatedAt", user.getUpdatedAt());
        
        // Для совместимости с фронтендом
        userData.put("nickname", user.getName());
        userData.put("avatar", user.getAvatarUrl());
        
        return userData;
    }
}