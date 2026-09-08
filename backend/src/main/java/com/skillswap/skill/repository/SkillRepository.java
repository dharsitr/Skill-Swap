package com.skillswap.skill.repository;

import com.skillswap.skill.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillRepository extends JpaRepository<Skill, UUID> {

    List<Skill> findAllByOrderByNameAsc();

    Optional<Skill> findByNameIgnoreCase(String name);

    @Query("SELECT s FROM Skill s JOIN FETCH s.category c " +
           "WHERE (:categoryId IS NULL OR c.id = :categoryId) " +
           "AND (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR (s.description IS NOT NULL AND LOWER(s.description) LIKE LOWER(CONCAT('%', :search, '%')))) " +
           "ORDER BY s.name ASC")
    List<Skill> findFiltered(@Param("search") String search, @Param("categoryId") UUID categoryId);
}
