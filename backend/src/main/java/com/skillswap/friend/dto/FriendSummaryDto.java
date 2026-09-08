package com.skillswap.friend.dto;

import com.skillswap.profile.entity.Profile;
import com.skillswap.user.entity.User;

import java.time.Instant;
import java.util.UUID;

public record FriendSummaryDto(
        UUID friendRequestId,
        UUID userId,
        String displayName,
        String avatarUrl,
        String collegeName,
        String department,
        String yearOfStudy,
        UUID conversationId,
        Instant connectedAt
) {
    public static FriendSummaryDto of(UUID friendRequestId, User friend, Profile profile, UUID conversationId, Instant connectedAt) {
        return new FriendSummaryDto(
                friendRequestId,
                friend.getId(),
                profile != null && profile.getDisplayName() != null ? profile.getDisplayName() : "Student",
                profile != null ? profile.getAvatarUrl() : null,
                profile != null ? profile.getCollegeName() : null,
                profile != null ? profile.getDepartment() : null,
                profile != null && profile.getYearOfStudy() != null ? profile.getYearOfStudy().name() : null,
                conversationId,
                connectedAt
        );
    }
}
