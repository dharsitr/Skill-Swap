package com.skillswap.skill.dto;

import java.util.List;

public class SkillListResponse {

    private List<SkillResponse> items;

    public SkillListResponse() {
    }

    public SkillListResponse(List<SkillResponse> items) {
        this.items = items;
    }

    public List<SkillResponse> getItems() {
        return items;
    }

    public void setItems(List<SkillResponse> items) {
        this.items = items;
    }
}
