package com.skillswap.discovery.dto;

import com.skillswap.skill.entity.SkillProficiency;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.entity.UserSkill;

import java.util.UUID;

public class PublicUserSkillDto {

    private UUID id;
    private UUID skillId;
    private String skillName;
    private UUID categoryId;
    private String categoryName;
    private SkillRelationshipType relationshipType;
    private SkillProficiency proficiency;
    private String description;

    public PublicUserSkillDto() {
    }

    public PublicUserSkillDto(
            UUID id,
            UUID skillId,
            String skillName,
            UUID categoryId,
            String categoryName,
            SkillRelationshipType relationshipType,
            SkillProficiency proficiency,
            String description
    ) {
        this.id = id;
        this.skillId = skillId;
        this.skillName = skillName;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.relationshipType = relationshipType;
        this.proficiency = proficiency;
        this.description = description;
    }

    public static PublicUserSkillDto fromEntity(UserSkill entity) {
        return new PublicUserSkillDto(
                entity.getId(),
                entity.getSkill().getId(),
                entity.getSkill().getName(),
                entity.getSkill().getCategory() != null ? entity.getSkill().getCategory().getId() : null,
                entity.getSkill().getCategory() != null ? entity.getSkill().getCategory().getName() : null,
                entity.getRelationshipType(),
                entity.getProficiency(),
                entity.getDescription()
        );
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSkillId() {
        return skillId;
    }

    public void setSkillId(UUID skillId) {
        this.skillId = skillId;
    }

    public String getSkillName() {
        return skillName;
    }

    public void setSkillName(String skillName) {
        this.skillName = skillName;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public SkillRelationshipType getRelationshipType() {
        return relationshipType;
    }

    public void setRelationshipType(SkillRelationshipType relationshipType) {
        this.relationshipType = relationshipType;
    }

    public SkillProficiency getProficiency() {
        return proficiency;
    }

    public void setProficiency(SkillProficiency proficiency) {
        this.proficiency = proficiency;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
