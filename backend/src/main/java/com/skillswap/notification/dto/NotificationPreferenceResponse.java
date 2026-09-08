package com.skillswap.notification.dto;

import com.skillswap.notification.entity.NotificationPreference;

import java.time.Instant;
import java.util.UUID;

public record NotificationPreferenceResponse(
        UUID id,
        UUID userId,
        boolean exchangeRequests,
        boolean sessions,
        boolean messages,
        boolean reviews,
        boolean safety,
        Instant updatedAt
) {
    public static NotificationPreferenceResponse fromEntity(NotificationPreference entity) {
        return new NotificationPreferenceResponse(
                entity.getId(),
                entity.getUser().getId(),
                entity.isExchangeRequests(),
                entity.isSessions(),
                entity.isMessages(),
                entity.isReviews(),
                entity.isSafety(),
                entity.getUpdatedAt()
        );
    }
}
