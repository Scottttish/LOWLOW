package com.example.demo.task1;

import java.util.logging.Level;
import java.util.logging.Logger;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SpringLoggingDemo implements CommandLineRunner {
    private static final Logger logger = Logger.getLogger(SpringLoggingDemo.class.getName());

    @Override
    public void run(String... args) {
        logger.info("=== ЗАДАНИЕ 1: Логирование в Spring Boot ===");
        logger.info("Используем java.util.logging");
        
        // 1. Лог старта задания
        logger.info("🚀 Задание по логированию начато");
        
        // 2. Демонстрация разных уровней
        demonstrateLevels();
        
        // 3. Демонстрация операции с делением
        demonstrateDivision();
        
        // 4. Лог завершения
        logger.info("✅ Задание по логированию выполнено успешно");
        logger.info("=============================================\n");
    }
    
    private void demonstrateLevels() {
        logger.info("--- Демонстрация уровней логирования ---");
        
        logger.info("INFO: Обычное информационное сообщение");
        logger.warning("WARNING: Предупреждение о чем-то важном");
        logger.severe("SEVERE: Сообщение об критической ошибке");
        
        logger.info("--- Уровни продемонстрированы ---\n");
    }
    
    private void demonstrateDivision() {
        logger.info("--- Демонстрация логирования операции деления ---");
        
        // Успешное деление
        logger.info("Попытка деления: 10 / 2");
        performDivision(10, 2);
        
        // Деление на ноль с ошибкой
        logger.warning("Попытка деления: 10 / 0 (ожидается ошибка)");
        performDivision(10, 0);
        
        // Еще одно успешное
        logger.info("Попытка деления: 15 / 3");
        performDivision(15, 3);
        
        logger.info("--- Демонстрация деления завершена ---\n");
    }
    
    private void performDivision(int a, int b) {
        logger.info("Выполняем: " + a + " / " + b);
        
        try {
            if (b == 0) {
                logger.warning("ВНИМАНИЕ: Делитель равен нулю!");
                throw new ArithmeticException("Деление на ноль");
            }
            
            int result = a / b;
            logger.info("✅ Успех: " + a + " / " + b + " = " + result);
            
        } catch (ArithmeticException e) {
            logger.log(Level.SEVERE, "❌ ОШИБКА: " + e.getMessage(), e);
            logger.severe("Критическая ошибка в операции деления!");
        }
    }
}