package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.AccountService;
import com.example.demo.service.CardService;
import com.example.demo.service.LocationService;
import com.example.demo.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AccountControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AccountService accountService;

    @Mock
    private CardService cardService;

    @Mock
    private LocationService locationService;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private AccountController accountController;

    private User testUser;
    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(accountController).build();

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@test.com");

        // Mock SecurityContext
        SecurityContext context = mock(SecurityContext.class);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities());
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);
    }

    @Test
    void testGetCurrentUser_Success() throws Exception {
        Map<String, Object> serviceResponse = new HashMap<>();
        serviceResponse.put("success", true);
        serviceResponse.put("user", new HashMap<String, Object>());

        when(accountService.getUserById(1L)).thenReturn(serviceResponse);

        mockMvc.perform(get("/api/account/user/me")
                        .header("Authorization", "Bearer fake-jwt-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.user").exists());

        verify(accountService).getUserById(1L);
    }

    @Test
    void testGetCurrentUserLocation_Success() throws Exception {
        Map<String, Object> serviceResponse = new HashMap<>();
        serviceResponse.put("success", true);
        serviceResponse.put("location", new HashMap<String, Object>());

        when(locationService.getCurrentUserLocation(1L)).thenReturn(serviceResponse);

        mockMvc.perform(get("/api/account/user/me/location/current")
                        .header("Authorization", "Bearer fake-jwt-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.location").exists());

        verify(locationService).getCurrentUserLocation(1L);
    }

    @Test
    void testSaveCurrentUserLocation_Success() throws Exception {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("address", "New Address");
        requestBody.put("latitude", 43.0);
        requestBody.put("longitude", 76.0);

        Map<String, Object> serviceResponse = new HashMap<>();
        serviceResponse.put("success", true);
        serviceResponse.put("message", "Location saved");

        when(locationService.saveUserLocation(eq(1L), any(Map.class))).thenReturn(serviceResponse);

        mockMvc.perform(post("/api/account/user/me/location")
                        .header("Authorization", "Bearer fake-jwt-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(locationService).saveUserLocation(eq(1L), any(Map.class));
    }

    @Test
    void testGetCurrentUserCards_Success() throws Exception {
        Map<String, Object> serviceResponse = new HashMap<>();
        serviceResponse.put("success", true);
        serviceResponse.put("cards", new java.util.ArrayList<>());

        when(cardService.getUserCards(1L)).thenReturn(serviceResponse);

        mockMvc.perform(get("/api/account/user/me/cards")
                        .header("Authorization", "Bearer fake-jwt-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.cards").exists());
    }

    @Test
    void testGetCurrentUserOrders_Success() throws Exception {
        Map<String, Object> serviceResponse = new HashMap<>();
        serviceResponse.put("success", true);
        serviceResponse.put("orders", new java.util.ArrayList<>());

        when(orderService.getUserOrders(1L)).thenReturn(serviceResponse);

        mockMvc.perform(get("/api/account/user/me/orders")
                        .header("Authorization", "Bearer fake-jwt-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.orders").exists());
    }
}
