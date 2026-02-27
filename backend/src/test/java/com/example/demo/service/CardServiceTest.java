package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.model.UserCard;
import com.example.demo.repository.UserCardRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CardServiceTest {

    @Mock
    private UserCardRepository cardRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CardService cardService;

    private User testUser;
    private UserCard testCard;

    @BeforeEach
    void setUp() {
        testUser = new User("Test User", "test@test.com", "password");
        testUser.setId(1L);

        testCard = new UserCard();
        testCard.setId(1L);
        testCard.setUser(testUser);
        testCard.setCardHolderName("TEST USER");
        testCard.setCardLast4("1234");
        testCard.setCardType("Visa");
        testCard.setExpiryMonth("12");
        testCard.setExpiryYear("25");
        testCard.setIsDefault(true);
        testCard.setBalance(100.0);
    }

    @Test
    void testGetUserCards_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(cardRepository.findByUserId(1L)).thenReturn(Collections.singletonList(testCard));

        // Act
        Map<String, Object> response = cardService.getUserCards(1L);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals(1, response.get("count"));
        assertNotNull(response.get("cards"));
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cards = (List<Map<String, Object>>) response.get("cards");
        assertEquals(1, cards.size());
        assertEquals("1234", cards.get(0).get("cardLast4"));
    }

    @Test
    void testGetUserCards_UserNotFound() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // Act
        Map<String, Object> response = cardService.getUserCards(1L);

        // Assert
        assertFalse((Boolean) response.get("success"));
        assertEquals("Пользователь не найден", response.get("message"));
    }

    @Test
    void testSaveUserCard_NewCard_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(cardRepository.save(any(UserCard.class))).thenReturn(testCard);

        Map<String, Object> cardData = new HashMap<>();
        cardData.put("cardHolderName", "TEST USER");
        cardData.put("cardNumber", "4111222233331234");
        cardData.put("cardType", "Visa");
        cardData.put("expiryMonth", "12");
        cardData.put("expiryYear", "25");
        cardData.put("isDefault", true);

        // Act
        Map<String, Object> response = cardService.saveUserCard(1L, cardData);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("Карта успешно сохранена", response.get("message"));
        verify(cardRepository).clearDefaultCards(1L); // Because isDefault is true
        verify(cardRepository).save(any(UserCard.class));
    }

    @Test
    void testDeleteUserCard_Success() {
        // Arrange
        when(cardRepository.findById(1L)).thenReturn(Optional.of(testCard));
        when(cardRepository.findByUserId(1L)).thenReturn(new ArrayList<>()); // return empty list for other cards
        
        // Act
        Map<String, Object> response = cardService.deleteUserCard(1L, 1L);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("Карта успешно удалена", response.get("message"));
        verify(cardRepository).delete(testCard);
    }
    
    @Test
    void testSetDefaultCard_Success() {
        // Arrange
        when(cardRepository.findById(1L)).thenReturn(Optional.of(testCard));
        
        // Act
        Map<String, Object> response = cardService.setDefaultCard(1L, 1L);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("Карта установлена как основная", response.get("message"));
        verify(cardRepository).clearDefaultCards(1L);
        verify(cardRepository).save(testCard);
        assertTrue(testCard.getIsDefault());
    }
}
