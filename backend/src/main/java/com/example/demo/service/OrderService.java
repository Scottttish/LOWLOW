package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private OrderItemRepository orderItemRepository;
    
    @Autowired
    private OrderStatusHistoryRepository statusHistoryRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Получить заказы пользователя
     */
    public Map<String, Object> getUserOrders(Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Пользователь не найден");
                return response;
            }
            
            List<Order> orders = orderRepository.findByUserId(userId);
            List<Map<String, Object>> orderList = new ArrayList<>();
            
            for (Order order : orders) {
                Map<String, Object> orderMap = convertOrderToMap(order);
                
                // Добавляем товары заказа
                List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
                List<Map<String, Object>> itemList = new ArrayList<>();
                
                for (OrderItem item : items) {
                    itemList.add(convertOrderItemToMap(item));
                }
                
                orderMap.put("items", itemList);
                orderList.add(orderMap);
            }
            
            response.put("success", true);
            response.put("orders", orderList);
            response.put("count", orderList.size());
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при получении заказов: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Создать заказ
     */
    @Transactional
    public Map<String, Object> createOrder(Long userId, Map<String, Object> orderData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Пользователь не найден");
                return response;
            }
            
            User user = userOptional.get();
            
            // Создаем заказ
            Order order = new Order();
            order.setUser(user);
            order.setOrderNumber(generateOrderNumber(userId));
            
            if (orderData.containsKey("companyName")) {
                order.setCompanyName((String) orderData.get("companyName"));
            }
            
            if (orderData.containsKey("restaurantId")) {
                Object restId = orderData.get("restaurantId");
                if (restId != null) {
                    if (restId instanceof Number) {
                        order.setRestaurantId(((Number) restId).intValue());
                    } else {
                        order.setRestaurantId(Integer.valueOf(restId.toString()));
                    }
                }
            }
            
            if (orderData.containsKey("totalAmount")) {
                Object total = orderData.get("totalAmount");
                if (total != null) {
                    if (total instanceof Number) {
                        order.setTotalAmount(BigDecimal.valueOf(((Number) total).doubleValue()));
                    } else {
                        order.setTotalAmount(new BigDecimal(total.toString()));
                    }
                }
            }
            
            if (orderData.containsKey("deliveryFee")) {
                Object fee = orderData.get("deliveryFee");
                if (fee != null) {
                    if (fee instanceof Number) {
                        order.setDeliveryFee(BigDecimal.valueOf(((Number) fee).doubleValue()));
                    } else {
                        order.setDeliveryFee(new BigDecimal(fee.toString()));
                    }
                }
            }
            
            if (orderData.containsKey("taxAmount")) {
                Object tax = orderData.get("taxAmount");
                if (tax != null) {
                    if (tax instanceof Number) {
                        order.setTaxAmount(BigDecimal.valueOf(((Number) tax).doubleValue()));
                    } else {
                        order.setTaxAmount(new BigDecimal(tax.toString()));
                    }
                }
            }
            
            if (orderData.containsKey("finalAmount")) {
                Object finalAmt = orderData.get("finalAmount");
                if (finalAmt != null) {
                    if (finalAmt instanceof Number) {
                        order.setFinalAmount(BigDecimal.valueOf(((Number) finalAmt).doubleValue()));
                    } else {
                        order.setFinalAmount(new BigDecimal(finalAmt.toString()));
                    }
                }
            }
            
            if (orderData.containsKey("paymentMethod")) {
                order.setPaymentMethod((String) orderData.get("paymentMethod"));
            }
            
            if (orderData.containsKey("cardLast4")) {
                order.setCardLast4((String) orderData.get("cardLast4"));
            }
            
            if (orderData.containsKey("deliveryAddress")) {
                order.setDeliveryAddress((String) orderData.get("deliveryAddress"));
            }
            
            if (orderData.containsKey("deliveryLatitude")) {
                Object lat = orderData.get("deliveryLatitude");
                if (lat != null) {
                    if (lat instanceof Number) {
                        order.setDeliveryLatitude(((Number) lat).doubleValue());
                    } else {
                        order.setDeliveryLatitude(Double.valueOf(lat.toString()));
                    }
                }
            }
            
            if (orderData.containsKey("deliveryLongitude")) {
                Object lng = orderData.get("deliveryLongitude");
                if (lng != null) {
                    if (lng instanceof Number) {
                        order.setDeliveryLongitude(((Number) lng).doubleValue());
                    } else {
                        order.setDeliveryLongitude(Double.valueOf(lng.toString()));
                    }
                }
            }
            
            if (orderData.containsKey("notes")) {
                order.setNotes((String) orderData.get("notes"));
            }
            
            Order savedOrder = orderRepository.save(order);
            
            // Создаем историю статуса
            OrderStatusHistory statusHistory = new OrderStatusHistory();
            statusHistory.setOrder(savedOrder);
            statusHistory.setStatus(Order.OrderStatus.PENDING);
            statusHistory.setNotes("Заказ создан");
            statusHistoryRepository.save(statusHistory);
            
            // Добавляем товары
            if (orderData.containsKey("items") && orderData.get("items") instanceof List) {
                List<Map<String, Object>> itemsData = (List<Map<String, Object>>) orderData.get("items");
                List<OrderItem> items = new ArrayList<>();
                
                for (Map<String, Object> itemData : itemsData) {
                    OrderItem item = new OrderItem();
                    item.setOrder(savedOrder);
                    
                    if (itemData.containsKey("productId")) {
                        Object prodId = itemData.get("productId");
                        if (prodId != null) {
                            if (prodId instanceof Number) {
                                item.setProductId(((Number) prodId).intValue());
                            } else {
                                item.setProductId(Integer.valueOf(prodId.toString()));
                            }
                        }
                    }
                    
                    if (itemData.containsKey("productName")) {
                        item.setProductName((String) itemData.get("productName"));
                    }
                    
                    if (itemData.containsKey("productDescription")) {
                        item.setProductDescription((String) itemData.get("productDescription"));
                    }
                    
                    if (itemData.containsKey("quantity")) {
                        Object qty = itemData.get("quantity");
                        if (qty != null) {
                            if (qty instanceof Number) {
                                item.setQuantity(((Number) qty).intValue());
                            } else {
                                item.setQuantity(Integer.valueOf(qty.toString()));
                            }
                        }
                    }
                    
                    if (itemData.containsKey("unitPrice")) {
                        Object price = itemData.get("unitPrice");
                        if (price != null) {
                            if (price instanceof Number) {
                                item.setUnitPrice(BigDecimal.valueOf(((Number) price).doubleValue()));
                            } else {
                                item.setUnitPrice(new BigDecimal(price.toString()));
                            }
                        }
                    }
                    
                    if (itemData.containsKey("totalPrice")) {
                        Object total = itemData.get("totalPrice");
                        if (total != null) {
                            if (total instanceof Number) {
                                item.setTotalPrice(BigDecimal.valueOf(((Number) total).doubleValue()));
                            } else {
                                item.setTotalPrice(new BigDecimal(total.toString()));
                            }
                        }
                    }
                    
                    if (itemData.containsKey("specialInstructions")) {
                        item.setSpecialInstructions((String) itemData.get("specialInstructions"));
                    }
                    
                    items.add(item);
                }
                
                orderItemRepository.saveAll(items);
                savedOrder.setItems(items);
            }
            
            response.put("success", true);
            response.put("message", "Заказ успешно создан");
            response.put("order", convertOrderToMap(savedOrder));
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при создании заказа: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Обновить статус заказа
     */
    @Transactional
    public Map<String, Object> updateOrderStatus(Long orderId, String status, String notes) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<Order> orderOptional = orderRepository.findById(orderId);
            
            if (orderOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Заказ не найден");
                return response;
            }
            
            Order order = orderOptional.get();
            
            try {
                Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
                order.setStatus(orderStatus);
                
                if (orderStatus == Order.OrderStatus.COMPLETED || orderStatus == Order.OrderStatus.DELIVERED) {
                    order.setCompletedAt(LocalDateTime.now());
                }
                
                orderRepository.save(order);
                
                // Добавляем запись в историю статусов
                OrderStatusHistory statusHistory = new OrderStatusHistory();
                statusHistory.setOrder(order);
                statusHistory.setStatus(orderStatus);
                statusHistory.setNotes(notes != null ? notes : "Статус изменен");
                statusHistoryRepository.save(statusHistory);
                
                response.put("success", true);
                response.put("message", "Статус заказа обновлен");
                response.put("order", convertOrderToMap(order));
                
            } catch (IllegalArgumentException e) {
                response.put("success", false);
                response.put("message", "Неверный статус заказа");
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при обновлении статуса заказа: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Удалить заказ
     */
    @Transactional
    public Map<String, Object> deleteOrder(Long orderId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<Order> orderOptional = orderRepository.findById(orderId);
            
            if (orderOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Заказ не найден");
                return response;
            }
            
            orderRepository.delete(orderOptional.get());
            
            response.put("success", true);
            response.put("message", "Заказ успешно удален");
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при удалении заказа: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Вспомогательный метод для преобразования Order в Map
     */
    private Map<String, Object> convertOrderToMap(Order order) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", order.getId());
        map.put("orderNumber", order.getOrderNumber());
        map.put("companyName", order.getCompanyName());
        map.put("restaurantId", order.getRestaurantId());
        map.put("totalAmount", order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0);
        map.put("deliveryFee", order.getDeliveryFee() != null ? order.getDeliveryFee().doubleValue() : 0.0);
        map.put("taxAmount", order.getTaxAmount() != null ? order.getTaxAmount().doubleValue() : 0.0);
        map.put("finalAmount", order.getFinalAmount() != null ? order.getFinalAmount().doubleValue() : 0.0);
        map.put("status", order.getStatus() != null ? order.getStatus().name().toLowerCase() : "pending");
        map.put("paymentMethod", order.getPaymentMethod());
        map.put("paymentStatus", order.getPaymentStatus() != null ? order.getPaymentStatus().name().toLowerCase() : "pending");
        map.put("cardLast4", order.getCardLast4());
        map.put("deliveryAddress", order.getDeliveryAddress());
        map.put("deliveryLatitude", order.getDeliveryLatitude());
        map.put("deliveryLongitude", order.getDeliveryLongitude());
        map.put("notes", order.getNotes());
        map.put("createdAt", order.getCreatedAt());
        map.put("updatedAt", order.getUpdatedAt());
        map.put("completedAt", order.getCompletedAt());
        return map;
    }
    
    /**
     * Вспомогательный метод для преобразования OrderItem в Map
     */
    private Map<String, Object> convertOrderItemToMap(OrderItem item) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", item.getId());
        map.put("productId", item.getProductId());
        map.put("productName", item.getProductName());
        map.put("productDescription", item.getProductDescription());
        map.put("quantity", item.getQuantity());
        map.put("unitPrice", item.getUnitPrice() != null ? item.getUnitPrice().doubleValue() : 0.0);
        map.put("totalPrice", item.getTotalPrice() != null ? item.getTotalPrice().doubleValue() : 0.0);
        map.put("specialInstructions", item.getSpecialInstructions());
        map.put("createdAt", item.getCreatedAt());
        return map;
    }
    
    /**
     * Генерация номера заказа
     */
    private String generateOrderNumber(Long userId) {
        return "ORD-" + System.currentTimeMillis() + "-" + userId;
    }
}