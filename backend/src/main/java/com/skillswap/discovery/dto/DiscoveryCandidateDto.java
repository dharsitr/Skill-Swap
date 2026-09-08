package com.skillswap.discovery.dto;

import java.util.List;

public class DiscoveryCandidateDto {

    private PublicProfileDto candidate;
    private int score;
    private List<String> matchedSkills;
    private List<String> explanation;

    public DiscoveryCandidateDto() {
    }

    public DiscoveryCandidateDto(
            PublicProfileDto candidate,
            int score,
            List<String> matchedSkills,
            List<String> explanation
    ) {
        this.candidate = candidate;
        this.score = score;
        this.matchedSkills = matchedSkills;
        this.explanation = explanation;
    }

    public PublicProfileDto getCandidate() {
        return candidate;
    }

    public void setCandidate(PublicProfileDto candidate) {
        this.candidate = candidate;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public List<String> getMatchedSkills() {
        return matchedSkills;
    }

    public void setMatchedSkills(List<String> matchedSkills) {
        this.matchedSkills = matchedSkills;
    }

    public List<String> getExplanation() {
        return explanation;
    }

    public void setExplanation(List<String> explanation) {
        this.explanation = explanation;
    }
}
