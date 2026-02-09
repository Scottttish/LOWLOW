package com.example.demo.repository;

import com.example.demo.model.UserLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserLocationRepository extends JpaRepository<UserLocation, Long> {
    List<UserLocation> findByUserId(Long userId);
    Optional<UserLocation> findByUserIdAndIsCurrent(Long userId, Boolean isCurrent);
    
    @Modifying
    @Query("UPDATE UserLocation ul SET ul.isCurrent = false WHERE ul.user.id = :userId")
    void clearCurrentLocations(@Param("userId") Long userId);
}