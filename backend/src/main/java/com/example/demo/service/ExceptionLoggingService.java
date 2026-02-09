package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ExceptionLoggingService {
    private static final Logger log = LoggerFactory.getLogger(ExceptionLoggingService.class);
    
    public void logExceptionExample() {
        log.info("Начало метода логирования исключений");
        
        try {
            throwDifferentExceptions();
            
        } catch (ArithmeticException e) {
            log.error("Арифметическая ошибка произошла из-за неверных вычислений", e);
            
        } catch (NullPointerException e) {
            log.error("Ошибка обращения к null объекту, проверьте инициализацию переменных", e);
            
        } catch (IllegalArgumentException e) {
            log.error("Некорректные аргументы метода, проверьте входные данные", e);
            
        } catch (Exception e) {
            log.error("Неожиданная ошибка в процессе выполнения", e);
            log.error("Детали ошибки: тип={}, сообщение={}", 
                     e.getClass().getName(), e.getMessage());
        }
    }
    
    private void throwDifferentExceptions() {
        int random = (int) (Math.random() * 3);
        
        switch (random) {
            case 0:
                int result = 10 / 0;
                break;
            case 1:
                String nullString = null;
                nullString.length();
                break;
            case 2:
                throw new IllegalArgumentException("Тестовый неверный аргумент");
        }
    }
    
    public void processDataWithValidation(String data) {
        log.info("Обработка данных: {}", data);
        
        try {
            if (data == null) {
                throw new NullPointerException("Данные не могут быть null");
            }
            
            if (data.isEmpty()) {
                throw new IllegalArgumentException("Данные не могут быть пустыми");
            }
            
            if (data.length() > 100) {
                throw new RuntimeException("Слишком длинные данные");
            }
            
            log.info("Данные успешно обработаны: длина={}", data.length());
            
        } catch (Exception e) {
            log.error("Ошибка обработки данных '{}'", data, e);
            throw new RuntimeException("Сбой обработки данных", e);
        }
    }
}