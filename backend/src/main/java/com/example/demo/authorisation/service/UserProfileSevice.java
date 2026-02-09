package com.example.demo.authorisation.service;

import com.example.demo.authorisation.model.User;
import com.example.demo.authorisation.dto.UserProfileDTO;
import com.example.demo.authorisation.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
@Transactional
public class UserProfileService {
    
    @Autowired
    private UserRepository userRepository;
    
    public User updateUserProfile(Long userId, UserProfileDTO profileDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Обновляем основные поля
        if (profileDTO.getName() != null) {
            user.setName(profileDTO.getName());
        }
        if (profileDTO.getEmail() != null) {
            // Проверяем, не используется ли email другим пользователем
            Optional<User> existingUser = userRepository.findByEmail(profileDTO.getEmail());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(profileDTO.getEmail());
        }
        if (profileDTO.getPhone() != null) {
            // Проверяем, не используется ли телефон другим пользователем
            Optional<User> existingUser = userRepository.findByPhone(profileDTO.getPhone());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                throw new RuntimeException("Phone already in use");
            }
            user.setPhone(profileDTO.getPhone());
        }
        
        return userRepository.save(user);
    }
    
    public User getUserProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }
    
    public User updateUserLocation(Long userId, Double latitude, Double longitude) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        user.setLatitude(latitude);
        user.setLongitude(longitude);
        
        return userRepository.save(user);
    }
    
    public User addUserLocation(Long userId, Double latitude, Double longitude) {
        return updateUserLocation(userId, latitude, longitude);
    }
    
    public User updateUserCard(Long userId, String cardNumber, String cardExpiry, String cardCvc) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Валидация данных карты (базовая)
        if (cardNumber == null || cardNumber.trim().isEmpty()) {
            throw new RuntimeException("Card number is required");
        }
        if (cardExpiry == null || cardExpiry.trim().isEmpty()) {
            throw new RuntimeException("Card expiry is required");
        }
        if (cardCvc == null || cardCvc.trim().isEmpty()) {
            throw new RuntimeException("Card CVC is required");
        }
        
        user.setCardNumber(cardNumber);
        user.setCardExpiry(cardExpiry);
        user.setCardCvc(cardCvc);
        
        return userRepository.save(user);
    }
    
    public User addUserCard(Long userId, String cardNumber, String cardExpiry, String cardCvc) {
        return updateUserCard(userId, cardNumber, cardExpiry, cardCvc);
    }
    
    public User removeUserCard(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        user.setCardNumber(null);
        user.setCardExpiry(null);
        user.setCardCvc(null);
        
        return userRepository.save(user);
    }
    
    public User removeUserLocation(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        user.setLatitude(null);
        user.setLongitude(null);
        
        return userRepository.save(user);
    }
    
    public boolean hasCard(Long userId) {
        User user = getUserProfile(userId);
        return user.getCardNumber() != null && !user.getCardNumber().isEmpty();
    }
    
    public boolean hasLocation(Long userId) {
        User user = getUserProfile(userId);
        return user.getLatitude() != null && user.getLongitude() != null;
    }
}