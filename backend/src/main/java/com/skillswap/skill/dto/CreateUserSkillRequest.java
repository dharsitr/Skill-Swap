package com.skillswap.skill.dto;

import com.skillswap.skill.entity.SkillProficiency;
import com.skillswap.skill.entity.SkillRelationshipType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public class CreateUserSkillRequest {

    @NotNull(message = "Skill ID is required")
    private UUID skillId;

    @NotNull(message = "Relationship type is required")
    private SkillRelationshipType relationshipType;

    @NotNull(message = "Proficiency level is required")
    private SkillProficiency proficiency;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    public CreateUserSkillRequest() {
    }

    public CreateUserSkillRequest(
            UUID skillId,
            SkillRelationshipType relationshipType,
            SkillProficiency proficiency,
            String description
    ) {
        this.skillId = skillId;
        this.relationshipType = relationshipType;
        this.proficiency = proficiency;
        this.description = description;
    }

    public UUID getSkillId() {
        return skillId;
    }

    public void setSkillId(UUID skillId) {
        this.skillId = skillId;
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
