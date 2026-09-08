package com.skillswap.exchange.dto;

import com.skillswap.profile.entity.YearOfStudy;
import java.util.UUID;

public class ExchangeParticipantDto {

    private UUID id;
    private String displayName;
    private String avatarUrl;
    private String collegeName;
    private String department;
    private YearOfStudy yearOfStudy;

    public ExchangeParticipantDto() {
    }

    public ExchangeParticipantDto(
            UUID id,
            String displayName,
            String avatarUrl,
            String collegeName,
            String department,
            YearOfStudy yearOfStudy
    ) {
        this.id = id;
        this.displayName = displayName;
        this.avatarUrl = avatarUrl;
        this.collegeName = collegeName;
        this.department = department;
        this.yearOfStudy = yearOfStudy;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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
