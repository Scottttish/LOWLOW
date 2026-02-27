package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AccountService accountService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User("Test User", "test@test.com", "password");
        testUser.setId(1L);
        testUser.setPhone("+77001112233");
        testUser.setRole(User.Role.USER);
        testUser.setCity("Astana");
        testUser.setAddress("Test Address 1");
        testUser.setBalance(1500.0);
        testUser.setIsActive(true);
    }

    @Test
    void testGetUserById_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // Act
        Map<String, Object> response = accountService.getUserById(1L);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertNotNull(response.get("user"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> userData = (Map<String, Object>) response.get("user");
        
        assertEquals(1L, userData.get("id"));
        assertEquals("Test User", userData.get("name"));
        assertEquals("test@test.com", userData.get("email"));
        assertEquals("USER", userData.get("role"));
        assertEquals("Astana", userData.get("city"));
        assertEquals(1500.0, userData.get("balance"));
        assertEquals(true, userData.get("isActive"));

        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    void testGetUserById_UserNotFound() {
        // Arrange
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        Map<String, Object> response = accountService.getUserById(99L);

        // Assert
        assertFalse((Boolean) response.get("success"));
        assertEquals("Пользователь не найден", response.get("message"));

        verify(userRepository, times(1)).findById(99L);
    }

    @Test
    void testGetUserById_ExceptionHandling() {
        // Arrange
        when(userRepository.findById(1L)).thenThrow(new RuntimeException("Database error"));

        // Act
        Map<String, Object> response = accountService.getUserById(1L);

        // Assert
        assertFalse((Boolean) response.get("success"));
        assertTrue(response.get("message").toString().contains("Ошибка сервера: Database error"));

        verify(userRepository, times(1)).findById(1L);
    }
}
