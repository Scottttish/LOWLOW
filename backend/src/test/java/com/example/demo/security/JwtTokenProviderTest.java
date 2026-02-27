package com.example.demo.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
    }

    @Test
    void testGenerateAndValidateToken_Success() {
        String token = jwtTokenProvider.generateToken("test@test.com", "USER", 1L);
        
        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals("test@test.com", jwtTokenProvider.getEmailFromToken(token));
        assertEquals(1L, jwtTokenProvider.getUserIdFromToken(token));
        assertEquals("USER", jwtTokenProvider.extractRole(token));
    }

    @Test
    void testValidateToken_InvalidToken() {
        assertFalse(jwtTokenProvider.validateToken("invalid.token.here"));
        assertFalse(jwtTokenProvider.validateToken(""));
        assertFalse(jwtTokenProvider.validateToken(null));
    }
}
