package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.model.UserCard;
import com.example.demo.repository.UserCardRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class CardService {
    
    @Autowired
    private UserCardRepository cardRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Получить карты пользователя
     */
    public Map<String, Object> getUserCards(Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Пользователь не найден");
                return response;
            }
            
            List<UserCard> cards = cardRepository.findByUserId(userId);
            List<Map<String, Object>> cardList = new ArrayList<>();
            
            for (UserCard card : cards) {
                cardList.add(convertCardToMap(card));
            }
            
            response.put("success", true);
            response.put("cards", cardList);
            response.put("count", cardList.size());
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при получении карт: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Сохранить карту пользователя
     */
    @Transactional
    public Map<String, Object> saveUserCard(Long userId, Map<String, Object> cardData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Пользователь не найден");
                return response;
            }
            
            User user = userOptional.get();
            UserCard card;
            
            // Проверяем, обновляем ли существующую карту или создаем новую
            if (cardData.containsKey("id")) {
                Long cardId = ((Number) cardData.get("id")).longValue();
                Optional<UserCard> existingCard = cardRepository.findById(cardId);
                
                if (existingCard.isEmpty() || !existingCard.get().getUser().getId().equals(userId)) {
                    response.put("success", false);
                    response.put("message", "Карта не найдена или не принадлежит пользователю");
                    return response;
                }
                
                card = existingCard.get();
            } else {
                card = new UserCard();
                card.setUser(user);
            }
            
            // Устанавливаем данные карты
            if (cardData.containsKey("cardHolderName")) {
                card.setCardHolderName((String) cardData.get("cardHolderName"));
            }
            
            if (cardData.containsKey("cardLast4")) {
                card.setCardLast4((String) cardData.get("cardLast4"));
            }
            
            if (cardData.containsKey("cardType")) {
                card.setCardType((String) cardData.get("cardType"));
            }
            
            if (cardData.containsKey("expiryMonth")) {
                card.setExpiryMonth((String) cardData.get("expiryMonth"));
            }
            
            if (cardData.containsKey("expiryYear")) {
                card.setExpiryYear((String) cardData.get("expiryYear"));
            }
            
            if (cardData.containsKey("isDefault")) {
                Boolean isDefault = Boolean.valueOf(cardData.get("isDefault").toString());
                card.setIsDefault(isDefault);
                
                // Если карта становится основной, снимаем флаг с других карт
                if (isDefault) {
                    cardRepository.clearDefaultCards(userId);
                }
            }
            
            if (cardData.containsKey("balance")) {
                Object balanceObj = cardData.get("balance");
                if (balanceObj != null) {
                    if (balanceObj instanceof Number) {
                        card.setBalance(((Number) balanceObj).doubleValue());
                    } else {
                        card.setBalance(Double.valueOf(balanceObj.toString()));
                    }
                }
            }
            
            // Обработка номера карты (хэширование)
            if (cardData.containsKey("cardNumber")) {
                String cardNumber = (String) cardData.get("cardNumber");
                if (cardNumber != null && !cardNumber.isEmpty()) {
                    // Сохраняем хэш номера карты
                    card.setCardNumberHash(hashCardNumber(cardNumber));
                    
                    // Сохраняем последние 4 цифры
                    if (cardNumber.length() >= 4) {
                        card.setCardLast4(cardNumber.substring(cardNumber.length() - 4));
                    }
                }
            }
            
            UserCard savedCard = cardRepository.save(card);
            
            response.put("success", true);
            response.put("message", "Карта успешно сохранена");
            response.put("card", convertCardToMap(savedCard));
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при сохранении карты: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Удалить карту пользователя
     */
    @Transactional
    public Map<String, Object> deleteUserCard(Long userId, Long cardId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<UserCard> cardOptional = cardRepository.findById(cardId);
            
            if (cardOptional.isEmpty() || !cardOptional.get().getUser().getId().equals(userId)) {
                response.put("success", false);
                response.put("message", "Карта не найдена");
                return response;
            }
            
            UserCard card = cardOptional.get();
            
            // Если удаляем основную карту, нужно назначить другую основную
            if (Boolean.TRUE.equals(card.getIsDefault())) {
                List<UserCard> otherCards = cardRepository.findByUserId(userId);
                otherCards.remove(card);
                
                if (!otherCards.isEmpty()) {
                    UserCard newDefault = otherCards.get(0);
                    newDefault.setIsDefault(true);
                    cardRepository.save(newDefault);
                }
            }
            
            cardRepository.delete(card);
            
            response.put("success", true);
            response.put("message", "Карта успешно удалена");
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при удалении карты: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Установить карту как основную
     */
    @Transactional
    public Map<String, Object> setDefaultCard(Long userId, Long cardId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<UserCard> cardOptional = cardRepository.findById(cardId);
            
            if (cardOptional.isEmpty() || !cardOptional.get().getUser().getId().equals(userId)) {
                response.put("success", false);
                response.put("message", "Карта не найдена");
                return response;
            }
            
            // Снимаем флаг с других карт
            cardRepository.clearDefaultCards(userId);
            
            // Устанавливаем флаг для выбранной карты
            UserCard card = cardOptional.get();
            card.setIsDefault(true);
            cardRepository.save(card);
            
            response.put("success", true);
            response.put("message", "Карта установлена как основная");
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при установке основной карты: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Вспомогательный метод для преобразования UserCard в Map
     */
    private Map<String, Object> convertCardToMap(UserCard card) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", card.getId());
        map.put("cardNumber", "•••• •••• •••• " + card.getCardLast4());
        map.put("cardLast4", card.getCardLast4());
        map.put("cardHolderName", card.getCardHolderName());
        map.put("cardHolder", card.getCardHolderName());
        map.put("cardType", card.getCardType());
        map.put("expiryMonth", card.getExpiryMonth());
        map.put("expiryYear", card.getExpiryYear());
        map.put("isDefault", card.getIsDefault());
        map.put("balance", card.getBalance() != null ? card.getBalance() : 0.0);
        map.put("createdAt", card.getCreatedAt());
        map.put("updatedAt", card.getUpdatedAt());
        return map;
    }
    
    /**
     * Хэширование номера карты (упрощенный вариант)
     */
    private String hashCardNumber(String cardNumber) {
        // В реальном приложении используйте безопасное хэширование
        return "hash_" + cardNumber.hashCode();
    }
}