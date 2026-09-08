package com.skillswap.personalization.dto;

import java.time.Instant;
import java.util.UUID;

public record UserActivityDto(
        UUID id,
        String activityType,
        String title,
        String description,
        Instant timestamp,
        String entityType,
        UUID entityId,
        String actionUrl
) {
}
