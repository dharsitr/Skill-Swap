package com.skillswap.notification.service;

import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.common.response.PageResponse;
import com.skillswap.notification.dto.NotificationResponse;
import com.skillswap.notification.dto.UnreadCountResponse;
import com.skillswap.notification.entity.Notification;
import com.skillswap.notification.entity.NotificationType;
import com.skillswap.notification.repository.NotificationRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service managing user notifications, event-driven creation, category preferences filtering, and read status updates.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceService preferenceService;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationPreferenceService preferenceService,
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.preferenceService = preferenceService;
        this.userRepository = userRepository;
    }

    @Transactional
    public Optional<NotificationResponse> createNotification(
            UUID recipientId,
            NotificationType type,
            String title,
            String message,
            String entityType,
            UUID entityId,
            String actionUrl
    ) {
        if (recipientId == null) {
            log.warn("Cannot create notification with null recipientId");
            return Optional.empty();
        }

        // Check user preferences
        if (!preferenceService.isCategoryEnabled(recipientId, type)) {
            log.info("Notification of type {} suppressed by user {} preferences", type, recipientId);
            return Optional.empty();
        }

        User recipient = userRepository.findById(recipientId).orElse(null);
        if (recipient == null) {
            log.warn("Cannot create notification: user not found with id {}", recipientId);
            return Optional.empty();
        }

        Notification notification = new Notification(
                recipient,
                type,
                title,
                message,
                entityType,
                entityId,
                actionUrl
        );

        Notification saved = notificationRepository.save(notification);
        log.info("Created notification {} of type {} for user {}", saved.getId(), type, recipientId);
        return Optional.of(NotificationResponse.fromEntity(saved));
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getMyNotifications(
            UUID recipientId,
            Boolean unreadOnly,
            Pageable pageable
    ) {
        Page<Notification> page;
        if (Boolean.TRUE.equals(unreadOnly)) {
            page = notificationRepository.findByRecipientIdAndIsReadOrderByCreatedAtDesc(recipientId, false, pageable);
        } else {
            page = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId, pageable);
        }

        List<NotificationResponse> items = page.getContent().stream()
                .map(NotificationResponse::fromEntity)
                .toList();

        return PageResponse.of(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(UUID recipientId) {
        long count = notificationRepository.countByRecipientIdAndIsReadFalse(recipientId);
        return new UnreadCountResponse(count);
    }

    @Transactional(readOnly = true)
    public NotificationResponse getNotification(UUID recipientId, UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getRecipient().getId().equals(recipientId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to access this notification");
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public NotificationResponse markAsRead(UUID recipientId, UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getRecipient().getId().equals(recipientId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to modify this notification");
        }

        if (!notification.isRead()) {
            notification.markRead();
            notification = notificationRepository.save(notification);
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public int markAllAsRead(UUID recipientId) {
        return notificationRepository.markAllAsReadByRecipientId(recipientId, Instant.now());
    }

    @Transactional
    public void deleteNotification(UUID recipientId, UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getRecipient().getId().equals(recipientId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to delete this notification");
        }

        notificationRepository.delete(notification);
    }
}
