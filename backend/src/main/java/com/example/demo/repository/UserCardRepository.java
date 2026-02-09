package com.example.demo.repository;

import com.example.demo.model.UserCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserCardRepository extends JpaRepository<UserCard, Long> {
    List<UserCard> findByUserId(Long userId);
    List<UserCard> findByUserIdAndIsDefault(Long userId, Boolean isDefault);
    
    @Modifying
    @Query("UPDATE UserCard c SET c.isDefault = false WHERE c.user.id = :userId")
    void clearDefaultCards(@Param("userId") Long userId);
}