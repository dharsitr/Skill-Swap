package com.skillswap.notification.dto;

import com.skillswap.notification.entity.Notification;
import com.skillswap.notification.entity.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID recipientId,
        NotificationType type,
        String title,
        String message,
        boolean read,
        String entityType,
        UUID entityId,
        String actionUrl,
        Instant createdAt,
        Instant readAt
) {
    public static NotificationResponse fromEntity(Notification entity) {
        return new NotificationResponse(
                entity.getId(),
                entity.getRecipient().getId(),
                entity.getType(),
                entity.getTitle(),
                entity.getMessage(),
                entity.isRead(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getActionUrl(),
                entity.getCreatedAt(),
                entity.getReadAt()
        );
    }
}
