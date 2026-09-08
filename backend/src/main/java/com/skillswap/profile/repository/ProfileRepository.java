package com.skillswap.profile.repository;

import com.skillswap.profile.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {

    Optional<Profile> findByUserId(UUID userId);

    Optional<Profile> findByUserAuthUserId(String authUserId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Profile p JOIN FETCH p.user u WHERE u.id != :currentUserId AND u.status = com.skillswap.user.entity.UserStatus.ACTIVE")
    java.util.List<Profile> findAllActiveCandidates(@org.springframework.data.repository.query.Param("currentUserId") UUID currentUserId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Profile p JOIN FETCH p.user u WHERE u.id IN :userIds")
    java.util.List<Profile> findByUserIds(@org.springframework.data.repository.query.Param("userIds") java.util.Collection<UUID> userIds);
}

