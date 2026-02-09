package com.example.demo.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LoggingController {
    private static final Logger log = LoggerFactory.getLogger(LoggingController.class);
    
    @GetMapping("/hello")
    public ResponseEntity<Map<String, Object>> sayHello(@RequestParam(required = false) String name) {
        log.info("Входящий запрос на /api/hello");
        
        if (name == null || name.trim().isEmpty()) {
            log.warn("Имя не указано, используется значение по умолчанию");
            name = "Гость";
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Привет, " + name + "!");
        response.put("timestamp", LocalDateTime.now().toString());
        
        log.info("Ответ отправлен для пользователя: {}", name);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculate(
            @RequestParam double a,
            @RequestParam double b,
            @RequestParam String operation) {
        
        log.info("Входящий запрос на вычисление: {} {} {}", a, operation, b);
        
        try {
            double result;
            
            switch (operation.toLowerCase()) {
                case "add":
                    result = a + b;
                    break;
                case "subtract":
                    result = a - b;
                    break;
                case "multiply":
                    result = a * b;
                    break;
                case "divide":
                    if (b == 0) {
                        log.error("Попытка деления на ноль: {} / {}", a, b);
                        throw new IllegalArgumentException("Деление на ноль невозможно");
                    }
                    result = a / b;
                    break;
                default:
                    log.error("Неизвестная операция: {}", operation);
                    throw new IllegalArgumentException("Неизвестная операция: " + operation);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("result", result);
            response.put("operation", operation);
            response.put("timestamp", LocalDateTime.now().toString());
            
            log.info("Вычисление выполнено успешно: {}", result);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Ошибка в запросе на вычисление", e);
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/log-levels")
    public ResponseEntity<Map<String, Object>> logLevels() {
        log.info("Демонстрация уровней логирования");
        
        log.trace("Это сообщение уровня TRACE");
        log.debug("Это сообщение уровня DEBUG");
        log.info("Это сообщение уровня INFO");
        log.warn("Это сообщение уровня WARN");
        log.error("Это сообщение уровня ERROR");
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Все уровни логирования продемонстрированы");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("check_logs", "Проверьте файл logs/app.log");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/error-test")
    public ResponseEntity<Map<String, Object>> errorTest() {
        log.info("Тестирование ошибок");
        
        try {
            // Искусственно создаем ошибку
            throw new RuntimeException("Тестовая ошибка для демонстрации логирования");
            
        } catch (RuntimeException e) {
            log.error("Поймана тестовая ошибка", e);
            return ResponseEntity.internalServerError()
                    .body(createErrorResponse("Тестовая ошибка: " + e.getMessage()));
        }
    }
    
    @PostMapping("/echo")
    public ResponseEntity<Map<String, Object>> echo(@RequestBody Map<String, Object> request) {
        log.info("Входящий POST запрос на /api/echo");
        
        Map<String, Object> response = new HashMap<>(request);
        response.put("echo", true);
        response.put("timestamp", LocalDateTime.now().toString());
        
        log.info("Эхо-ответ отправлен");
        
        return ResponseEntity.ok(response);
    }
    
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", true);
        error.put("message", message);
        error.put("timestamp", LocalDateTime.now().toString());
        return error;
    }
}