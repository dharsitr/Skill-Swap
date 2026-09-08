package com.skillswap.skill.dto;

import com.skillswap.skill.entity.Skill;
import java.util.UUID;

public class SkillResponse {

    private UUID id;
    private String name;
    private String description;
    private CategoryResponse category;

    public SkillResponse() {
    }

    public SkillResponse(UUID id, String name, String description, CategoryResponse category) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = category;
    }

    public static SkillResponse fromEntity(Skill skill) {
        if (skill == null) {
            return null;
        }
        return new SkillResponse(
                skill.getId(),
                skill.getName(),
                skill.getDescription(),
                CategoryResponse.fromEntity(skill.getCategory())
        );
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public CategoryResponse getCategory() {
        return category;
    }

    public void setCategory(CategoryResponse category) {
        this.category = category;
    }
}
