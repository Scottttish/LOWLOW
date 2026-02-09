// backend/src/main/java/com/example/demo/service/AccountService.java
package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AccountService {
    
    @Autowired
    private UserRepository userRepository;
    
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
            
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("name", user.getName());
            userData.put("email", user.getEmail());
            userData.put("phone", user.getPhone());
            userData.put("role", user.getRole().name());
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
            userData.put("nickname", user.getName());
            userData.put("avatar", user.getAvatarUrl());
            
            response.put("success", true);
            response.put("user", userData);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Ошибка сервера: " + e.getMessage());
        }
        
        return response;
    }
}