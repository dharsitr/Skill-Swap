package com.skillswap.safety.dto;

import java.util.UUID;

public class BlockStatusResponse {

    private UUID targetUserId;
    private boolean blockedByMe;
    private boolean blockedByTarget;

    public BlockStatusResponse() {}

    public BlockStatusResponse(UUID targetUserId, boolean blockedByMe, boolean blockedByTarget) {
        this.targetUserId = targetUserId;
        this.blockedByMe = blockedByMe;
        this.blockedByTarget = blockedByTarget;
    }

    public UUID getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(UUID targetUserId) {
        this.targetUserId = targetUserId;
    }

    public boolean isBlockedByMe() {
        return blockedByMe;
    }

    public void setBlockedByMe(boolean blockedByMe) {
        this.blockedByMe = blockedByMe;
    }

    public boolean isBlockedByTarget() {
        return blockedByTarget;
    }

    public void setBlockedByTarget(boolean blockedByTarget) {
        this.blockedByTarget = blockedByTarget;
    }

    public boolean isBlockedMutually() {
        return blockedByMe || blockedByTarget;
    }
}
