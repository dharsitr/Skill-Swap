package com.skillswap.friend.dto;

import java.util.UUID;

public record FriendshipStatusResponse(
        String status, // NONE, PENDING_SENT, PENDING_RECEIVED, ACCEPTED
        UUID requestId,
        UUID conversationId
) {
    public static FriendshipStatusResponse none() {
        return new FriendshipStatusResponse("NONE", null, null);
    }

    public static FriendshipStatusResponse pendingSent(UUID requestId) {
        return new FriendshipStatusResponse("PENDING_SENT", requestId, null);
    }

    public static FriendshipStatusResponse pendingReceived(UUID requestId) {
        return new FriendshipStatusResponse("PENDING_RECEIVED", requestId, null);
    }

    public static FriendshipStatusResponse accepted(UUID requestId, UUID conversationId) {
        return new FriendshipStatusResponse("ACCEPTED", requestId, conversationId);
    }
}
