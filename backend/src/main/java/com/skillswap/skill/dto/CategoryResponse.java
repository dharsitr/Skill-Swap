package com.skillswap.skill.dto;

import com.skillswap.skill.entity.SkillCategory;
import java.util.UUID;

public class CategoryResponse {

    private UUID id;
    private String name;
    private String description;

    public CategoryResponse() {
    }

    public CategoryResponse(UUID id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    public static CategoryResponse fromEntity(SkillCategory category) {
        if (category == null) {
            return null;
        }
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription()
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
}
