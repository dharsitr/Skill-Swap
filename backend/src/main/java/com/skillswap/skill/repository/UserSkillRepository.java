package com.skillswap.skill.repository;

import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.entity.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, UUID> {

    @Query("SELECT us FROM UserSkill us JOIN FETCH us.skill s JOIN FETCH s.category c WHERE us.user.id = :userId ORDER BY us.createdAt DESC")
    List<UserSkill> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT us FROM UserSkill us JOIN FETCH us.skill s JOIN FETCH s.category c WHERE us.user.id = :userId AND us.relationshipType = :relationshipType ORDER BY us.createdAt DESC")
    List<UserSkill> findByUserIdAndRelationshipType(
            @Param("userId") UUID userId,
            @Param("relationshipType") SkillRelationshipType relationshipType
    );

    Optional<UserSkill> findByUserIdAndSkillIdAndRelationshipType(
            UUID userId,
            UUID skillId,
            SkillRelationshipType relationshipType
    );

    @Query("SELECT us FROM UserSkill us JOIN FETCH us.skill s JOIN FETCH s.category c WHERE us.user.id IN :userIds")
    List<UserSkill> findByUserIds(@Param("userIds") java.util.Collection<UUID> userIds);

    @Query("SELECT us FROM UserSkill us JOIN FETCH us.skill s JOIN FETCH s.category c WHERE us.id = :id AND us.user.id = :userId")
    Optional<UserSkill> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    boolean existsByUserIdAndSkillIdAndRelationshipType(
            UUID userId,
            UUID skillId,
            SkillRelationshipType relationshipType
    );
}

