package com.skillswap.notification.controller;

import com.skillswap.common.response.PageResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.notification.dto.NotificationResponse;
import com.skillswap.notification.dto.UnreadCountResponse;
import com.skillswap.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Endpoints for managing student in-app notifications and read states")
@SecurityRequirement(name = "BearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get paginated notifications for current user")
    public ResponseEntity<PageResponse<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<NotificationResponse> response = notificationService.getMyNotifications(
                principal.getUserId(),
                unreadOnly,
                pageRequest
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get current unread notification count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        UnreadCountResponse response = notificationService.getUnreadCount(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get notification details by ID")
    public ResponseEntity<NotificationResponse> getNotification(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        NotificationResponse response = notificationService.getNotification(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        NotificationResponse response = notificationService.markAsRead(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all notifications as read for current user")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        int count = notificationService.markAllAsRead(principal.getUserId());
        return ResponseEntity.ok(Map.of(
                "markedCount", count,
                "message", "All notifications marked as read"
        ));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a notification")
    public ResponseEntity<Void> deleteNotification(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        notificationService.deleteNotification(principal.getUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
