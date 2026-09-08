package com.skillswap.notification.controller;

import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.notification.dto.NotificationPreferenceResponse;
import com.skillswap.notification.dto.UpdateNotificationPreferencesRequest;
import com.skillswap.notification.service.NotificationPreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notification-preferences")
@Tag(name = "Notification Preferences", description = "Endpoints for managing student notification preferences")
@SecurityRequirement(name = "BearerAuth")
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;

    public NotificationPreferenceController(NotificationPreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    @Operation(summary = "Get notification preferences for current user")
    public ResponseEntity<NotificationPreferenceResponse> getPreferences(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        NotificationPreferenceResponse response = preferenceService.getPreferences(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    @PatchMapping
    @Operation(summary = "Update notification preferences for current user (PATCH)")
    public ResponseEntity<NotificationPreferenceResponse> updatePreferences(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestBody UpdateNotificationPreferencesRequest request
    ) {
        NotificationPreferenceResponse response = preferenceService.updatePreferences(principal.getUserId(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @Operation(summary = "Set notification preferences for current user (PUT)")
    public ResponseEntity<NotificationPreferenceResponse> setPreferences(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestBody UpdateNotificationPreferencesRequest request
    ) {
        NotificationPreferenceResponse response = preferenceService.updatePreferences(principal.getUserId(), request);
        return ResponseEntity.ok(response);
    }
}
