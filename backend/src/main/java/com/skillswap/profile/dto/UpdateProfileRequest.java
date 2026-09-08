package com.skillswap.profile.dto;

import com.skillswap.profile.entity.YearOfStudy;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload for updating the student profile")
public class UpdateProfileRequest {

    @NotBlank(message = "Display name is required")
    @Size(min = 2, max = 100, message = "Display name must be between 2 and 100 characters")
    @Schema(description = "Public display name", example = "Jane Doe", requiredMode = Schema.RequiredMode.REQUIRED)
    private String displayName;

    @Size(max = 2000000, message = "Avatar image data must not exceed 2MB")
    @Schema(description = "Profile avatar URL or image data", example = "data:image/jpeg;base64,...")
    private String avatarUrl;

    @Size(max = 1000, message = "Bio must not exceed 1000 characters")
    @Schema(description = "Short personal / academic biography", example = "CS student passionate about systems and web apps.")
    private String bio;

    @NotBlank(message = "College name is required")
    @Size(min = 2, max = 200, message = "College name must be between 2 and 200 characters")
    @Schema(description = "College or university name", example = "MIT", requiredMode = Schema.RequiredMode.REQUIRED)
    private String collegeName;

    @Size(max = 100, message = "Department must not exceed 100 characters")
    @Schema(description = "Academic department / field", example = "Computer Science")
    private String department;

    @NotNull(message = "Year of study is required")
    @Schema(description = "Current year of study", example = "THIRD_YEAR", requiredMode = Schema.RequiredMode.REQUIRED)
    private YearOfStudy yearOfStudy;

    public UpdateProfileRequest() {
    }

    public UpdateProfileRequest(String displayName, String collegeName, YearOfStudy yearOfStudy) {
        this.displayName = displayName;
        this.collegeName = collegeName;
        this.yearOfStudy = yearOfStudy;
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
}
