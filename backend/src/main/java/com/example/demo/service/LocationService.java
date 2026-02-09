// backend/src/main/java/com/example/demo/service/LocationService.java
package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.model.UserLocation;
import com.example.demo.repository.UserLocationRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class LocationService {
    
    @Autowired
    private UserLocationRepository locationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Получить текущее местоположение пользователя
     */
    public Map<String, Object> getCurrentUserLocation(Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("📍 [LocationService] Получение локации пользователя ID: " + userId);
            
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Пользователь не найден");
                return response;
            }
            
            User user = userOptional.get();
            
            // Сначала пробуем получить из таблицы user_locations
            Optional<UserLocation> locationOptional = locationRepository.findByUserIdAndIsCurrent(userId, true);
            
            if (locationOptional.isPresent()) {
                UserLocation location = locationOptional.get();
                response.put("success", true);
                response.put("location", convertLocationToMap(location));
                System.out.println("✅ [LocationService] Локация из таблицы: " + 
                                  location.getLatitude() + ", " + location.getLongitude());
            } 
            // Если нет в таблице, берем из users
            else if (user.getLatitude() != null && user.getLongitude() != null) {
                UserLocation tempLocation = new UserLocation();
                tempLocation.setId(0L); // Временный ID
                tempLocation.setUser(user);
                tempLocation.setLatitude(user.getLatitude());
                tempLocation.setLongitude(user.getLongitude());
                tempLocation.setCity(user.getCity());
                tempLocation.setAddress(user.getAddress());
                tempLocation.setIsCurrent(true);
                tempLocation.setCreatedAt(LocalDateTime.now());
                
                response.put("success", true);
                response.put("location", convertLocationToMap(tempLocation));
                response.put("fromUser", true);
                System.out.println("✅ [LocationService] Локация из users: " + 
                                  user.getLatitude() + ", " + user.getLongitude());
            } else {
                response.put("success", true);
                response.put("location", null);
                response.put("message", "Местоположение не найдено");
                System.out.println("⚠️ [LocationService] Локация не найдена для пользователя ID: " + userId);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при получении местоположения: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Сохранить местоположение пользователя
     */
    @Transactional
    public Map<String, Object> saveUserLocation(Long userId, Map<String, Object> locationData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("📍 [LocationService] Сохранение локации пользователя ID: " + userId);
            System.out.println("📍 Данные: " + locationData);
            
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Пользователь не найден");
                return response;
            }
            
            User user = userOptional.get();
            
            // Проверяем обязательные поля
            if (!locationData.containsKey("latitude") || !locationData.containsKey("longitude")) {
                response.put("success", false);
                response.put("message", "Широта и долгота обязательны");
                return response;
            }
            
            Double latitude = null;
            Double longitude = null;
            
            try {
                Object latObj = locationData.get("latitude");
                Object lngObj = locationData.get("longitude");
                
                if (latObj instanceof Number) {
                    latitude = ((Number) latObj).doubleValue();
                } else {
                    latitude = Double.valueOf(latObj.toString());
                }
                
                if (lngObj instanceof Number) {
                    longitude = ((Number) lngObj).doubleValue();
                } else {
                    longitude = Double.valueOf(lngObj.toString());
                }
                
                // Проверяем валидность координат
                if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                    response.put("success", false);
                    response.put("message", "Неверные координаты");
                    return response;
                }
                
            } catch (NumberFormatException e) {
                response.put("success", false);
                response.put("message", "Неверный формат координат");
                return response;
            }
            
            // Снимаем флаг is_current со всех предыдущих локаций
            locationRepository.clearCurrentLocations(userId);
            
            // Создаем новую локацию
            UserLocation location = new UserLocation();
            location.setUser(user);
            location.setLatitude(latitude);
            location.setLongitude(longitude);
            
            if (locationData.containsKey("city")) {
                location.setCity((String) locationData.get("city"));
            }
            
            if (locationData.containsKey("address")) {
                location.setAddress((String) locationData.get("address"));
            }
            
            location.setIsCurrent(true);
            UserLocation savedLocation = locationRepository.save(location);
            
            // Обновляем основную информацию пользователя
            user.setLatitude(latitude);
            user.setLongitude(longitude);
            
            if (location.getCity() != null) {
                user.setCity(location.getCity());
            }
            
            if (location.getAddress() != null) {
                user.setAddress(location.getAddress());
            }
            
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            
            response.put("success", true);
            response.put("message", "Местоположение успешно сохранено");
            response.put("location", convertLocationToMap(savedLocation));
            
            System.out.println("✅ [LocationService] Локация сохранена: " + 
                              latitude + ", " + longitude + " для пользователя ID: " + userId);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при сохранении местоположения: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Получить историю локаций пользователя
     */
    public Map<String, Object> getUserLocationHistory(Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "Пользователь не найден");
                return response;
            }
            
            List<UserLocation> locations = locationRepository.findByUserId(userId);
            List<Map<String, Object>> locationList = new ArrayList<>();
            
            for (UserLocation location : locations) {
                locationList.add(convertLocationToMap(location));
            }
            
            response.put("success", true);
            response.put("locations", locationList);
            response.put("count", locationList.size());
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при получении истории локаций: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Удалить локацию
     */
    @Transactional
    public Map<String, Object> deleteLocation(Long locationId, Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<UserLocation> locationOptional = locationRepository.findById(locationId);
            
            if (locationOptional.isEmpty() || !locationOptional.get().getUser().getId().equals(userId)) {
                response.put("success", false);
                response.put("message", "Локация не найдена");
                return response;
            }
            
            UserLocation location = locationOptional.get();
            
            // Если удаляем текущую локацию, нужно назначить другую текущую
            if (Boolean.TRUE.equals(location.getIsCurrent())) {
                List<UserLocation> otherLocations = locationRepository.findByUserId(userId);
                otherLocations.remove(location);
                
                if (!otherLocations.isEmpty()) {
                    UserLocation newCurrent = otherLocations.get(0);
                    newCurrent.setIsCurrent(true);
                    locationRepository.save(newCurrent);
                }
            }
            
            locationRepository.delete(location);
            
            response.put("success", true);
            response.put("message", "Локация успешно удалена");
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Ошибка при удалении локации: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Вспомогательный метод для преобразования UserLocation в Map
     */
    private Map<String, Object> convertLocationToMap(UserLocation location) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", location.getId());
        map.put("latitude", location.getLatitude());
        map.put("longitude", location.getLongitude());
        map.put("city", location.getCity());
        map.put("address", location.getAddress());
        map.put("isCurrent", location.getIsCurrent());
        map.put("createdAt", location.getCreatedAt());
        return map;
    }
}