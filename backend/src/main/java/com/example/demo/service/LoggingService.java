package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LoggingService {
    private static final Logger log = LoggerFactory.getLogger(LoggingService.class);
    
    public double performCalculation(String operation, double a, double b) {
        log.info("Начало операции: {}", operation);
        log.debug("Параметры: a={}, b={}", a, b);
        
        try {
            double result = calculate(operation, a, b);
            log.info("Операция завершена успешно");
            log.debug("Результат: {}", result);
            return result;
            
        } catch (IllegalArgumentException e) {
            log.error("Ошибка при выполнении операции", e);
            throw e;
        }
    }
    
    private double calculate(String operation, double a, double b) {
        switch (operation.toLowerCase()) {
            case "add":
                return a + b;
            case "subtract":
                return a - b;
            case "multiply":
                return a * b;
            case "divide":
                if (b == 0) {
                    log.error("Деление на ноль");
                    throw new IllegalArgumentException("Деление на ноль невозможно");
                }
                return a / b;
            default:
                log.error("Неизвестная операция: {}", operation);
                throw new IllegalArgumentException("Неизвестная операция: " + operation);
        }
    }
    
    public void demonstrateExceptionLogging() {
        log.info("Демонстрация логирования исключений");
        
        try {
            // Пример 1: Деление на ноль
            log.info("Пример 1: Деление на ноль");
            try {
                double result = 10 / 0;
            } catch (ArithmeticException e) {
                log.error("Арифметическая ошибка: деление на ноль", e);
            }
            
            // Пример 2: NullPointerException
            log.info("Пример 2: NullPointerException");
            try {
                String text = null;
                int length = text.length();
            } catch (NullPointerException e) {
                log.error("Ошибка обращения к null объекту", e);
            }
            
            // Пример 3: IllegalArgumentException
            log.info("Пример 3: IllegalArgumentException");
            try {
                validateAge(-5);
            } catch (IllegalArgumentException e) {
                log.error("Некорректный аргумент", e);
            }
            
            log.info("Демонстрация завершена");
            
        } catch (Exception e) {
            log.error("Ошибка в демонстрации", e);
        }
    }
    
    private void validateAge(int age) {
        if (age < 0) {
            throw new IllegalArgumentException("Возраст не может быть отрицательным");
        }
    }
    
    public void logAllLevels() {
        log.trace("TRACE уровень - очень детальная информация");
        log.debug("DEBUG уровень - отладочная информация");
        log.info("INFO уровень - информационное сообщение");
        log.warn("WARN уровень - предупреждение");
        log.error("ERROR уровень - сообщение об ошибке");
    }
}