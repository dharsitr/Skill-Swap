package com.skillswap.safety.dto;

import com.skillswap.profile.entity.Profile;
import com.skillswap.safety.entity.UserBlock;

import java.time.Instant;
import java.util.UUID;

public class UserBlockResponse {

    private UUID id;
    private UUID blockedUserId;
    private String blockedUserName;
    private String blockedUserAvatarUrl;
    private Instant createdAt;

    public UserBlockResponse() {}

    public UserBlockResponse(UUID id, UUID blockedUserId, String blockedUserName, String blockedUserAvatarUrl, Instant createdAt) {
        this.id = id;
        this.blockedUserId = blockedUserId;
        this.blockedUserName = blockedUserName;
        this.blockedUserAvatarUrl = blockedUserAvatarUrl;
        this.createdAt = createdAt;
    }

    public static UserBlockResponse fromEntity(UserBlock block, Profile profile) {
        String name = profile != null ? profile.getDisplayName() : "Student";
        String avatar = profile != null ? profile.getAvatarUrl() : null;

        return new UserBlockResponse(
                block.getId(),
                block.getBlockedUser().getId(),
                name,
                avatar,
                block.getCreatedAt()
        );
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getBlockedUserId() {
        return blockedUserId;
    }

    public void setBlockedUserId(UUID blockedUserId) {
        this.blockedUserId = blockedUserId;
    }

    public String getBlockedUserName() {
        return blockedUserName;
    }

    public void setBlockedUserName(String blockedUserName) {
        this.blockedUserName = blockedUserName;
    }

    public String getBlockedUserAvatarUrl() {
        return blockedUserAvatarUrl;
    }

    public void setBlockedUserAvatarUrl(String blockedUserAvatarUrl) {
        this.blockedUserAvatarUrl = blockedUserAvatarUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
