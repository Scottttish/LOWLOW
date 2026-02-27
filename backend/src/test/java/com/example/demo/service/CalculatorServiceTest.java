package com.example.demo.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CalculatorServiceTest {

    private CalculatorService calculatorService;

    @BeforeEach
    void setUp() {
        calculatorService = new CalculatorService();
    }

    @Test
    void testAdd() {
        assertEquals(5.0, calculatorService.add(2.0, 3.0), 0.001);
        assertEquals(-1.0, calculatorService.add(2.0, -3.0), 0.001);
    }

    @Test
    void testSubtract() {
        assertEquals(1.0, calculatorService.subtract(4.0, 3.0), 0.001);
        assertEquals(5.0, calculatorService.subtract(2.0, -3.0), 0.001);
    }

    @Test
    void testMultiply() {
        assertEquals(6.0, calculatorService.multiply(2.0, 3.0), 0.001);
        assertEquals(-6.0, calculatorService.multiply(2.0, -3.0), 0.001);
        assertEquals(0.0, calculatorService.multiply(2.0, 0.0), 0.001);
    }

    @Test
    void testDivide() {
        assertEquals(2.0, calculatorService.divide(6.0, 3.0), 0.001);
        assertEquals(-2.0, calculatorService.divide(6.0, -3.0), 0.001);
    }

    @Test
    void testDivideByZero() {
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            calculatorService.divide(5.0, 0.0);
        });

        String expectedMessage = "Деление на ноль невозможно";
        String actualMessage = exception.getMessage();

        assertTrue(actualMessage.contains(expectedMessage));
    }
}
