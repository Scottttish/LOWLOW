package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User("Test User", "test@test.com", "encodedPassword");
        testUser.setId(1L);
        testUser.setPhone("+77001112233");
        testUser.setRole(User.Role.USER);
        testUser.setBalance(5000.0);
        testUser.setIsActive(true);
    }

    @Test
    void testRegister_Success() {
        // Arrange
        when(userRepository.existsByEmail("test@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        Map<String, Object> response = authService.register(
                "Test User", "+77001112233", "test@test.com", "password",
                "Astana", "Test Address", null, null
        );

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("Регистрация прошла успешно", response.get("message"));
        assertNotNull(response.get("user"));
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testRegister_EmailExists() {
        // Arrange
        when(userRepository.existsByEmail("test@test.com")).thenReturn(true);

        // Act
        Map<String, Object> response = authService.register(
                "Test User", "+77001112233", "test@test.com", "password",
                "Astana", "Test Address", null, null
        );

        // Assert
        assertFalse((Boolean) response.get("success"));
        assertEquals("Пользователь с таким email уже существует", response.get("message"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testLogin_Success() {
        // Arrange
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(testUser); // for updatedAt

        // Act
        Map<String, Object> response = authService.login("test@test.com", "password");

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("Вход выполнен успешно", response.get("message"));
        verify(userRepository).save(testUser); // verifies updatedAt was saved
    }

    @Test
    void testLogin_UserNotFound() {
        // Arrange
        when(userRepository.findByEmail("notfound@test.com")).thenReturn(Optional.empty());

        // Act
        Map<String, Object> response = authService.login("notfound@test.com", "password");

        // Assert
        assertFalse((Boolean) response.get("success"));
        assertEquals("Пользователь не найден", response.get("message"));
    }

    @Test
    void testLogin_WrongPassword() {
        // Arrange
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        // Act
        Map<String, Object> response = authService.login("test@test.com", "wrongpassword");

        // Assert
        assertFalse((Boolean) response.get("success"));
        assertEquals("Неверный пароль", response.get("message"));
    }

    @Test
    void testLogin_AccountInactive() {
        // Arrange
        testUser.setIsActive(false);
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testUser));

        // Act
        Map<String, Object> response = authService.login("test@test.com", "password");

        // Assert
        assertFalse((Boolean) response.get("success"));
        assertEquals("Аккаунт заблокирован", response.get("message"));
    }

    @Test
    void testLogout_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        Map<String, Object> response = authService.logout(1L);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("Выход выполнен успешно", response.get("message"));
        
        // Assert that user is marked inactive (depending on implementation - looks like logout sets isActive to false in original code)
        assertFalse(testUser.getIsActive()); 
        verify(userRepository).save(testUser);
    }
}
