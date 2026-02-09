package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    
    @GetMapping("/")
    public String hello() {
        return "Foodsharing Backend API работает! 🚀";
    }
    
    @GetMapping("/api/test")
    public String test() {
        return "API работает правильно!";
    }
}