package com.example.demo.service;

import com.example.demo.model.Order;
import com.example.demo.model.User;
import com.example.demo.repository.OrderItemRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.OrderStatusHistoryRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private OrderStatusHistoryRepository statusHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderService orderService;

    private User testUser;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        testUser = new User("Test User", "test@test.com", "password");
        testUser.setId(1L);

        testOrder = new Order();
        testOrder.setId(1L);
        testOrder.setUser(testUser);
        testOrder.setOrderNumber("ORD-12345");
        testOrder.setTotalAmount(new BigDecimal("1000.00"));
        testOrder.setStatus(Order.OrderStatus.PENDING);
    }

    @Test
    void testGetUserOrders_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(orderRepository.findByUserId(1L)).thenReturn(Collections.singletonList(testOrder));
        when(orderItemRepository.findByOrderId(1L)).thenReturn(new ArrayList<>());

        // Act
        Map<String, Object> response = orderService.getUserOrders(1L);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals(1, response.get("count"));
        assertNotNull(response.get("orders"));
    }

    @Test
    void testCreateOrder_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);

        Map<String, Object> orderData = new HashMap<>();
        orderData.put("totalAmount", 1000.0);
        orderData.put("paymentMethod", "CARD");
        orderData.put("deliveryAddress", "Test Address");

        // Act
        Map<String, Object> response = orderService.createOrder(1L, orderData);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("Заказ успешно создан", response.get("message"));
        verify(orderRepository).save(any(Order.class));
        verify(statusHistoryRepository).save(any());
    }

    @Test
    void testUpdateOrderStatus_Success() {
        // Arrange
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);

        // Act
        Map<String, Object> response = orderService.updateOrderStatus(1L, "COMPLETED", "Order delivered");

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("Статус заказа обновлен", response.get("message"));
        assertEquals(Order.OrderStatus.COMPLETED, testOrder.getStatus());
        verify(orderRepository).save(testOrder);
        verify(statusHistoryRepository).save(any());
    }

    @Test
    void testUpdateOrderStatus_InvalidStatus() {
        // Arrange
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act
        Map<String, Object> response = orderService.updateOrderStatus(1L, "INVALID_STATUS", "");

        // Assert
        assertFalse((Boolean) response.get("success"));
        assertEquals("Неверный статус заказа", response.get("message"));
    }

    @Test
    void testDeleteOrder_Success() {
        // Arrange
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act
        Map<String, Object> response = orderService.deleteOrder(1L);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("Заказ успешно удален", response.get("message"));
        verify(orderRepository).delete(testOrder);
    }
}
