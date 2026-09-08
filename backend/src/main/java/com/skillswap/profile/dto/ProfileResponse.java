package com.skillswap.profile.dto;

import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.entity.YearOfStudy;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

@Schema(description = "Student profile details response")
public class ProfileResponse {

    @Schema(description = "Profile ID")
    private UUID id;

    @Schema(description = "Associated application user ID")
    private UUID userId;

    @Schema(description = "Student public display name", example = "Jane Doe")
    private String displayName;

    @Schema(description = "Avatar picture URL", example = "https://example.com/avatar.jpg")
    private String avatarUrl;

    @Schema(description = "Student biography / bio description", example = "CS senior passionate about full-stack web and systems.")
    private String bio;

    @Schema(description = "College or institution name", example = "Massachusetts Institute of Technology")
    private String collegeName;

    @Schema(description = "Department or major", example = "Computer Science")
    private String department;

    @Schema(description = "Current academic year of study", example = "THIRD_YEAR")
    private YearOfStudy yearOfStudy;

    @Schema(description = "Profile creation timestamp")
    private Instant createdAt;

    @Schema(description = "Last update timestamp")
    private Instant updatedAt;

    public ProfileResponse() {
    }

    public ProfileResponse(Profile profile) {
        this.id = profile.getId();
        this.userId = profile.getUser() != null ? profile.getUser().getId() : null;
        this.displayName = profile.getDisplayName();
        this.avatarUrl = profile.getAvatarUrl();
        this.bio = profile.getBio();
        this.collegeName = profile.getCollegeName();
        this.department = profile.getDepartment();
        this.yearOfStudy = profile.getYearOfStudy();
        this.createdAt = profile.getCreatedAt();
        this.updatedAt = profile.getUpdatedAt();
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
