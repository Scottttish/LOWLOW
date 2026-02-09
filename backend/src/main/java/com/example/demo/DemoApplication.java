package com.example.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {
    private static final Logger log = LoggerFactory.getLogger(DemoApplication.class);
    
    public static void main(String[] args) {
        log.info("Задание по логированию - Демонстрация работы");
        log.info("Запуск Spring Boot приложения на порту 8080");
        log.info("Логи будут записываться в файл: logs/app.log");
        
        try {
            SpringApplication.run(DemoApplication.class, args);
            
            log.info("Приложение успешно запущено");
            log.info("Для тестирования откройте браузер:");
            log.info("http://localhost:8080/api/hello");
            log.info("http://localhost:8080/api/calculate?a=10&b=5&operation=add");
            log.info("http://localhost:8080/api/log-levels");
            
        } catch (Exception e) {
            log.error("Ошибка при запуске приложения", e);
            log.error("Сообщение ошибки: {}", e.getMessage());
            throw new RuntimeException("Не удалось запустить приложение", e);
        }
    }
}