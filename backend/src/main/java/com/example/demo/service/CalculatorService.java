package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class CalculatorService {
    private static final Logger log = LoggerFactory.getLogger(CalculatorService.class);
    
    public double add(double a, double b) {
        log.info("Начало операции сложения");
        log.debug("Параметры: a = " + a + ", b = " + b);
        
        double result = a + b;
        log.info("Сложение завершено");
        log.debug("Результат: " + result);
        
        return result;
    }
    
    public double subtract(double a, double b) {
        log.info("Начало операции вычитания");
        log.debug("Параметры: a = " + a + ", b = " + b);
        
        double result = a - b;
        log.info("Вычитание завершено");
        log.debug("Результат: " + result);
        
        return result;
    }
    
    public double multiply(double a, double b) {
        log.info("Начало операции умножения");
        log.debug("Параметры: a = " + a + ", b = " + b);
        
        double result = a * b;
        log.info("Умножение завершено");
        log.debug("Результат: " + result);
        
        return result;
    }
    
    public double divide(double a, double b) {
        log.info("Начало операции деления");
        log.debug("Параметры: a = " + a + ", b = " + b);
        
        if (b == 0) {
            log.error("Деление на ноль!");
            throw new IllegalArgumentException("Деление на ноль невозможно");
        }
        
        double result = a / b;
        log.info("Деление завершено");
        log.debug("Результат: " + result);
        
        return result;
    }
}