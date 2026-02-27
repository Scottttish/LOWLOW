package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.model.UserLocation;
import com.example.demo.repository.UserLocationRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LocationServiceTest {

    @Mock
    private UserLocationRepository locationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LocationService locationService;

    private User testUser;
    private UserLocation testLocation;

    @BeforeEach
    void setUp() {
        testUser = new User("Test User", "test@test.com", "password");
        testUser.setId(1L);

        testLocation = new UserLocation();
        testLocation.setId(1L);
        testLocation.setUser(testUser);
        testLocation.setAddress("Test Address");
        testLocation.setLatitude(43.2);
        testLocation.setLongitude(76.9);
        testLocation.setIsCurrent(true);
    }

    @Test
    void testGetCurrentUserLocation_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(locationRepository.findByUserIdAndIsCurrent(1L, true)).thenReturn(Optional.of(testLocation));

        // Act
        Map<String, Object> response = locationService.getCurrentUserLocation(1L);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertNotNull(response.get("location"));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> locMap = (Map<String, Object>) response.get("location");
        assertEquals("Test Address", locMap.get("address"));
        assertEquals(43.2, locMap.get("latitude"));
    }

    @Test
    void testSaveUserLocation_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(locationRepository.save(any(UserLocation.class))).thenReturn(testLocation);

        Map<String, Object> locationData = new HashMap<>();
        locationData.put("address", "New Address");
        locationData.put("latitude", 44.0);
        locationData.put("longitude", 77.0);
        locationData.put("isCurrent", true);

        // Act
        Map<String, Object> response = locationService.saveUserLocation(1L, locationData);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("Местоположение успешно сохранено", response.get("message"));
        verify(locationRepository).clearCurrentLocations(1L);
        verify(locationRepository).save(any(UserLocation.class));
    }

    @Test
    void testGetUserLocationHistory_Success() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(locationRepository.findByUserId(1L)).thenReturn(Collections.singletonList(testLocation));

        // Act
        Map<String, Object> response = locationService.getUserLocationHistory(1L);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals(1, response.get("count"));
        assertNotNull(response.get("locations"));
    }

    @Test
    void testDeleteLocation_Success() {
        // Arrange
        when(locationRepository.findById(1L)).thenReturn(Optional.of(testLocation));

        // Act
        Map<String, Object> response = locationService.deleteLocation(1L, 1L);

        // Assert
        assertTrue((Boolean) response.get("success"));
        assertEquals("Локация успешно удалена", response.get("message"));
        verify(locationRepository).delete(testLocation);
    }
}
