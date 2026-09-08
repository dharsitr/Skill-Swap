package com.skillswap.chat.dto;

import com.skillswap.profile.entity.Profile;
import com.skillswap.user.entity.User;
import java.time.Instant;
import java.util.UUID;

public record ConversationParticipantDto(
        UUID userId,
        String displayName,
        String avatarUrl,
        String collegeName,
        String department,
        Instant lastReadAt
) {
    public static ConversationParticipantDto of(User user, Profile profile, Instant lastReadAt) {
        String displayName = profile != null ? profile.getDisplayName() : "Student";
        String avatarUrl = profile != null ? profile.getAvatarUrl() : null;
        String collegeName = profile != null ? profile.getCollegeName() : "Campus";
        String department = profile != null ? profile.getDepartment() : null;

        return new ConversationParticipantDto(
                user.getId(),
                displayName,
                avatarUrl,
                collegeName,
                department,
                lastReadAt
        );
    }
}
