package com.skillswap.skill.dto;

import com.skillswap.skill.entity.SkillProficiency;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.entity.UserSkill;
import java.time.Instant;
import java.util.UUID;

public class UserSkillResponse {

    private UUID id;
    private UUID skillId;
    private String skillName;
    private UUID categoryId;
    private String categoryName;
    private SkillRelationshipType relationshipType;
    private SkillProficiency proficiency;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;

    public UserSkillResponse() {
    }

    public UserSkillResponse(
            UUID id,
            UUID skillId,
            String skillName,
            UUID categoryId,
            String categoryName,
            SkillRelationshipType relationshipType,
            SkillProficiency proficiency,
            String description,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.skillId = skillId;
        this.skillName = skillName;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.relationshipType = relationshipType;
        this.proficiency = proficiency;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static UserSkillResponse fromEntity(UserSkill userSkill) {
        if (userSkill == null) {
            return null;
        }
        return new UserSkillResponse(
                userSkill.getId(),
                userSkill.getSkill() != null ? userSkill.getSkill().getId() : null,
                userSkill.getSkill() != null ? userSkill.getSkill().getName() : null,
                userSkill.getSkill() != null && userSkill.getSkill().getCategory() != null ? userSkill.getSkill().getCategory().getId() : null,
                userSkill.getSkill() != null && userSkill.getSkill().getCategory() != null ? userSkill.getSkill().getCategory().getName() : null,
                userSkill.getRelationshipType(),
                userSkill.getProficiency(),
                userSkill.getDescription(),
                userSkill.getCreatedAt(),
                userSkill.getUpdatedAt()
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
