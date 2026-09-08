package com.skillswap.user.repository;

import com.skillswap.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByAuthUserId(String authUserId);

    boolean existsByAuthUserId(String authUserId);
}
