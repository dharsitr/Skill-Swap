package com.skillswap.skill.dto;

import java.util.ArrayList;
import java.util.List;

public class UserSkillProfileResponse {

    private List<UserSkillResponse> teaching;
    private List<UserSkillResponse> learning;

    public UserSkillProfileResponse() {
        this.teaching = new ArrayList<>();
        this.learning = new ArrayList<>();
    }

    public UserSkillProfileResponse(List<UserSkillResponse> teaching, List<UserSkillResponse> learning) {
        this.teaching = teaching != null ? teaching : new ArrayList<>();
        this.learning = learning != null ? learning : new ArrayList<>();
    }

    public List<UserSkillResponse> getTeaching() {
        return teaching;
    }

    public void setTeaching(List<UserSkillResponse> teaching) {
        this.teaching = teaching;
    }

    public List<UserSkillResponse> getLearning() {
        return learning;
    }

    public void setLearning(List<UserSkillResponse> learning) {
        this.learning = learning;
    }
}
