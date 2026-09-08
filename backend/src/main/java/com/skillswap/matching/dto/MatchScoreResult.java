package com.skillswap.matching.dto;

import java.util.List;

public class MatchScoreResult {

    private int totalScore;
    private double skillMatchScore;
    private double learningOverlapScore;
    private double availabilityScore;
    private double ratingScore;
    private double skillLevelScore;
    private List<String> matchedSkills;
    private List<String> explanation;

    public MatchScoreResult() {
    }

    public MatchScoreResult(
            int totalScore,
            double skillMatchScore,
            double learningOverlapScore,
            double availabilityScore,
            double ratingScore,
            double skillLevelScore,
            List<String> matchedSkills,
            List<String> explanation
    ) {
        this.totalScore = totalScore;
        this.skillMatchScore = skillMatchScore;
        this.learningOverlapScore = learningOverlapScore;
        this.availabilityScore = availabilityScore;
        this.ratingScore = ratingScore;
        this.skillLevelScore = skillLevelScore;
        this.matchedSkills = matchedSkills;
        this.explanation = explanation;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }

    public double getSkillMatchScore() {
        return skillMatchScore;
    }

    public void setSkillMatchScore(double skillMatchScore) {
        this.skillMatchScore = skillMatchScore;
    }

    public double getLearningOverlapScore() {
        return learningOverlapScore;
    }

    public void setLearningOverlapScore(double learningOverlapScore) {
        this.learningOverlapScore = learningOverlapScore;
    }

    public double getAvailabilityScore() {
        return availabilityScore;
    }

    public void setAvailabilityScore(double availabilityScore) {
        this.availabilityScore = availabilityScore;
    }

    public double getRatingScore() {
        return ratingScore;
    }

    public void setRatingScore(double ratingScore) {
        this.ratingScore = ratingScore;
    }

    public double getSkillLevelScore() {
        return skillLevelScore;
    }

    public void setSkillLevelScore(double skillLevelScore) {
        this.skillLevelScore = skillLevelScore;
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
