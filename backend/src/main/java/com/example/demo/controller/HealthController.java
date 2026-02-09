// backend\src\main\java\com\example\demo\controller\HealthController.java
package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {
    
    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;
    
    public HealthController(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }
    
    @GetMapping
    public ResponseEntity<?> health() {
        try {
            Map<String, Object> status = Map.of(
                "status", "UP",
                "service", "Food Sharing API",
                "version", "1.0.0",
                "timestamp", System.currentTimeMillis(),
                "database", "Supabase PostgreSQL"
            );
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of(
                "status", "DOWN",
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/database")
    public ResponseEntity<?> databaseHealth() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            Map<String, Object> dbInfo = Map.of(
                "status", "CONNECTED",
                "database", metaData.getDatabaseProductName(),
                "version", metaData.getDatabaseProductVersion(),
                "url", metaData.getURL(),
                "driver", metaData.getDriverName(),
                "username", metaData.getUserName()
            );
            
            return ResponseEntity.ok(dbInfo);
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of(
                "status", "DISCONNECTED",
                "error", e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        }
    }
    
    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        try {
            // Простая проверка запроса к БД
            jdbcTemplate.execute("SELECT 1");
            
            return ResponseEntity.ok(Map.of(
                "status", "OK",
                "message", "Database is responding",
                "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of(
                "status", "ERROR",
                "message", "Database connection failed",
                "error", e.getMessage()
            ));
        }
    }
}