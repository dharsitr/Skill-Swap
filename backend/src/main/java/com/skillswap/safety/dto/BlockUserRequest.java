package com.skillswap.safety.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class BlockUserRequest {

    @NotNull(message = "Blocked user ID is required")
    private UUID blockedUserId;

    public BlockUserRequest() {}

    public BlockUserRequest(UUID blockedUserId) {
        this.blockedUserId = blockedUserId;
    }

    public UUID getBlockedUserId() {
        return blockedUserId;
    }

    public void setBlockedUserId(UUID blockedUserId) {
        this.blockedUserId = blockedUserId;
    }
}
