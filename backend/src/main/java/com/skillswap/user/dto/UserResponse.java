package com.skillswap.user.dto;

import com.skillswap.user.entity.User;
import com.skillswap.user.entity.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

@Schema(description = "Application user details response")
public class UserResponse {

    @Schema(description = "Internal application user ID")
    private UUID id;

    @Schema(description = "External Supabase Auth user ID")
    private String authUserId;

    @Schema(description = "Current account status", example = "ACTIVE")
    private UserStatus status;

    @Schema(description = "Account registration timestamp")
    private Instant createdAt;

    @Schema(description = "Last update timestamp")
    private Instant updatedAt;

    public UserResponse() {
    }

    public UserResponse(User user) {
        this.id = user.getId();
        this.authUserId = user.getAuthUserId();
        this.status = user.getStatus();
        this.createdAt = user.getCreatedAt();
        this.updatedAt = user.getUpdatedAt();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getAuthUserId() {
        return authUserId;
    }

    public void setAuthUserId(String authUserId) {
        this.authUserId = authUserId;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
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
