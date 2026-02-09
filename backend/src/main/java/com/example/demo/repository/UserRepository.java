// backend\src\main\java\com\example\demo\repository\UserRepository.java
package com.example.demo.repository;

import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    List<User> findByCity(String city);
    
    List<User> findByRole(User.Role role);
    
    List<User> findByIsActiveTrue();
    
    @Modifying
    @Query("UPDATE User u SET u.balance = u.balance + :amount WHERE u.id = :userId")
    void incrementBalance(@Param("userId") Long userId, @Param("amount") Double amount);
    
    @Modifying
    @Query("UPDATE User u SET u.balance = u.balance - :amount WHERE u.id = :userId AND u.balance >= :amount")
    int decrementBalance(@Param("userId") Long userId, @Param("amount") Double amount);
    
    @Modifying
    @Query("UPDATE User u SET u.isActive = :isActive WHERE u.id = :id")
    int updateActiveStatus(@Param("id") Long id, @Param("isActive") Boolean isActive);
    
    @Modifying
    @Query("UPDATE User u SET u.avatarUrl = :avatarUrl WHERE u.id = :id")
    int updateAvatar(@Param("id") Long id, @Param("avatarUrl") String avatarUrl);
}