package com.skillswap.skill.dto;

import com.skillswap.skill.entity.SkillProficiency;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateUserSkillRequest {

    @NotNull(message = "Proficiency level is required")
    private SkillProficiency proficiency;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    public UpdateUserSkillRequest() {
    }

    public UpdateUserSkillRequest(SkillProficiency proficiency, String description) {
        this.proficiency = proficiency;
        this.description = description;
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
