package com.skillswap.discovery.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.entity.YearOfStudy;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class PublicProfileDto {

    private UUID id;
    private UUID userId;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private String collegeName;
    private String department;
    private YearOfStudy yearOfStudy;
    private List<PublicUserSkillDto> teachingSkills;
    private List<PublicUserSkillDto> learningSkills;
    private Instant createdAt;

    public PublicProfileDto() {
    }

    public PublicProfileDto(
            UUID id,
            UUID userId,
            String displayName,
            String avatarUrl,
            String bio,
            String collegeName,
            String department,
            YearOfStudy yearOfStudy,
            List<PublicUserSkillDto> teachingSkills,
            List<PublicUserSkillDto> learningSkills,
            Instant createdAt
    ) {
        this.id = id;
        this.userId = userId;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.bio = bio;
        this.collegeName = collegeName;
        this.department = department;
        this.yearOfStudy = yearOfStudy;
        this.teachingSkills = teachingSkills;
        this.learningSkills = learningSkills;
        this.createdAt = createdAt;
    }

    public static PublicProfileDto fromEntity(Profile profile, List<PublicUserSkillDto> teaching, List<PublicUserSkillDto> learning) {
        return new PublicProfileDto(
                profile.getId(),
                profile.getUser().getId(),
                profile.getDisplayName(),
                profile.getAvatarUrl(),
                profile.getBio(),
                profile.getCollegeName(),
                profile.getDepartment(),
                profile.getYearOfStudy(),
                teaching,
                learning,
                profile.getCreatedAt()
        );
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getCollegeName() {
        return collegeName;
    }

    public void setCollegeName(String collegeName) {
        this.collegeName = collegeName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public YearOfStudy getYearOfStudy() {
        return yearOfStudy;
    }

    public void setYearOfStudy(YearOfStudy yearOfStudy) {
        this.yearOfStudy = yearOfStudy;
    }

    public List<PublicUserSkillDto> getTeachingSkills() {
        return teachingSkills;
    }

    public void setTeachingSkills(List<PublicUserSkillDto> teachingSkills) {
        this.teachingSkills = teachingSkills;
    }

    public List<PublicUserSkillDto> getLearningSkills() {
        return learningSkills;
    }

    public void setLearningSkills(List<PublicUserSkillDto> learningSkills) {
        this.learningSkills = learningSkills;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
