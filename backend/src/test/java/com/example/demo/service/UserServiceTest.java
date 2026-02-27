package com.example.demo.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class UserServiceTest {

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService();
    }

    @Test
    void testCreateUser_Success() {
        UserService.User user = userService.createUser("Test Name", "test@test.com");
        
        assertNotNull(user);
        assertNotNull(user.getId());
        assertEquals("Test Name", user.getName());
        assertEquals("test@test.com", user.getEmail());
        assertNotNull(user.getCreatedAt());
    }

    @Test
    void testCreateUser_InvalidName() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            userService.createUser("", "test@test.com");
        });
        assertEquals("Имя обязательно", exception.getMessage());
    }

    @Test
    void testCreateUser_InvalidEmail() {
        assertThrows(IllegalArgumentException.class, () -> {
            userService.createUser("Test Name", "invalid_email");
        });
    }

    @Test
    void testGetUser_Success() {
        UserService.User createdUser = userService.createUser("Test Name", "test@test.com");
        
        UserService.User fetchedUser = userService.getUser(createdUser.getId());
        
        assertNotNull(fetchedUser);
        assertEquals(createdUser.getId(), fetchedUser.getId());
        assertEquals("Test Name", fetchedUser.getName());
    }

    @Test
    void testGetUser_NotFound() {
        assertThrows(RuntimeException.class, () -> {
            userService.getUser(999L);
        });
    }

    @Test
    void testGetAllUsers() {
        userService.createUser("User 1", "user1@test.com");
        userService.createUser("User 2", "user2@test.com");
        
        List<UserService.User> allUsers = userService.getAllUsers();
        
        assertEquals(2, allUsers.size());
    }

    @Test
    void testDeleteUser_Success() {
        UserService.User createdUser = userService.createUser("Test Name", "test@test.com");
        Long id = createdUser.getId();
        
        userService.deleteUser(id);
        
        assertThrows(RuntimeException.class, () -> {
            userService.getUser(id);
        });
    }

    @Test
    void testDeleteUser_NotFound() {
        assertThrows(RuntimeException.class, () -> {
            userService.deleteUser(999L);
        });
    }
}
