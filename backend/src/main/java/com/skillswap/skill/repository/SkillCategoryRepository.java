package com.skillswap.skill.repository;

import com.skillswap.skill.entity.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillCategoryRepository extends JpaRepository<SkillCategory, UUID> {

    List<SkillCategory> findAllByOrderByNameAsc();

    Optional<SkillCategory> findByNameIgnoreCase(String name);
}
