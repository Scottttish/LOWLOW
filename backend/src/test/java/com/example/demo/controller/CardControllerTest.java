package com.example.demo.controller;

import com.example.demo.service.CardService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CardControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CardService cardService;

    @InjectMocks
    private CardController cardController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(cardController).build();
    }

    @Test
    void testGetUserCards_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/cards"))
                .andExpect(status().isBadRequest()); // Spring MVC returns 400 if @RequestHeader is missing
    }

    @Test
    void testGetUserCards_BadRequest() throws Exception {
        mockMvc.perform(get("/api/cards")
                        .header("Authorization", "Bearer fake-token"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Используйте /api/account/user/{id}/cards"));
    }

    @Test
    void testAddCard_Unauthorized() throws Exception {
        Map<String, Object> cardData = new HashMap<>();
        
        mockMvc.perform(post("/api/cards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cardData)))
                .andExpect(status().isBadRequest()); // Spring MVC returns 400 if @RequestHeader is missing
    }

    @Test
    void testAddCard_BadRequest() throws Exception {
        Map<String, Object> cardData = new HashMap<>();
        
        mockMvc.perform(post("/api/cards")
                        .header("Authorization", "Bearer fake-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cardData)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testDeleteCard_Unauthorized() throws Exception {
        mockMvc.perform(delete("/api/cards/1"))
                .andExpect(status().isBadRequest()); // Spring MVC returns 400 if @RequestHeader is missing
    }

    @Test
    void testDeleteCard_BadRequest() throws Exception {
        mockMvc.perform(delete("/api/cards/1")
                        .header("Authorization", "Bearer fake-token"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
