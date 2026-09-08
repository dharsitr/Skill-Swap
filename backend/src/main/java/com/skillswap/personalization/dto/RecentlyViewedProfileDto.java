package com.skillswap.personalization.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RecentlyViewedProfileDto(
        UUID userId,
        String displayName,
        String avatarUrl,
        String collegeName,
        String department,
        String yearOfStudy,
        List<String> topSkills,
        Instant viewedAt
) {
}
