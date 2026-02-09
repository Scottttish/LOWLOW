package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    
    private final Map<Long, User> users = new ConcurrentHashMap<>();
    private final AtomicLong idCounter = new AtomicLong(1);
    
    public User createUser(String name, String email) {
        log.info("Создание пользователя: name={}, email={}", name, email);
        
        try {
            // Валидация
            if (name == null || name.trim().isEmpty()) {
                log.error("Имя пользователя не может быть пустым");
                throw new IllegalArgumentException("Имя обязательно");
            }
            
            if (email == null || !email.contains("@")) {
                log.warn("Некорректный email: {}", email);
                throw new IllegalArgumentException("Некорректный email");
            }
            
            // Создание пользователя
            User user = new User();
            user.setId(idCounter.getAndIncrement());
            user.setName(name);
            user.setEmail(email);
            user.setCreatedAt(LocalDateTime.now());
            
            users.put(user.getId(), user);
            
            log.info("Пользователь создан: id={}, name={}", user.getId(), user.getName());
            
            return user;
            
        } catch (IllegalArgumentException e) {
            log.error("Ошибка при создании пользователя", e);
            throw e;
        }
    }
    
    public User getUser(Long id) {
        log.info("Поиск пользователя по ID: {}", id);
        
        try {
            if (id == null || id <= 0) {
                log.warn("Некорректный ID: {}", id);
                throw new IllegalArgumentException("Некорректный ID");
            }
            
            User user = users.get(id);
            
            if (user == null) {
                log.warn("Пользователь не найден: id={}", id);
                throw new RuntimeException("Пользователь не найден");
            }
            
            log.info("Пользователь найден: id={}, name={}", user.getId(), user.getName());
            
            return user;
            
        } catch (Exception e) {
            log.error("Ошибка при поиске пользователя", e);
            throw e;
        }
    }
    
    public List<User> getAllUsers() {
        log.info("Получение всех пользователей");
        
        try {
            List<User> userList = new ArrayList<>(users.values());
            log.info("Найдено {} пользователей", userList.size());
            return userList;
            
        } catch (Exception e) {
            log.error("Ошибка при получении пользователей", e);
            throw new RuntimeException("Ошибка получения пользователей", e);
        }
    }
    
    public void deleteUser(Long id) {
        log.info("Удаление пользователя: id={}", id);
        
        try {
            if (id == null || id <= 0) {
                log.warn("Некорректный ID для удаления: {}", id);
                throw new IllegalArgumentException("Некорректный ID");
            }
            
            User removed = users.remove(id);
            
            if (removed == null) {
                log.warn("Пользователь для удаления не найден: id={}", id);
                throw new RuntimeException("Пользователь не найден");
            }
            
            log.info("Пользователь удален: id={}, name={}", removed.getId(), removed.getName());
            
        } catch (Exception e) {
            log.error("Ошибка при удалении пользователя", e);
            throw e;
        }
    }
    
    public static class User {
        private Long id;
        private String name;
        private String email;
        private LocalDateTime createdAt;
        
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        
        @Override
        public String toString() {
            return "User{id=" + id + ", name='" + name + "', email='" + email + "'}";
        }
    }
}