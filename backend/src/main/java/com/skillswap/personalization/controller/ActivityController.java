package com.skillswap.personalization.controller;

import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.personalization.dto.UserActivityDto;
import com.skillswap.personalization.service.UserActivityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activity")
@Tag(name = "User Activity Timeline", description = "Endpoints for retrieving meaningful user activity events")
@SecurityRequirement(name = "BearerAuth")
public class ActivityController {

    private final UserActivityService userActivityService;

    public ActivityController(UserActivityService userActivityService) {
        this.userActivityService = userActivityService;
    }

    @GetMapping("/recent")
    @Operation(
            summary = "Get recent user activity",
            description = "Returns chronological timeline of meaningful events (sessions, requests, skills, reviews) for the authenticated user."
    )
    public ResponseEntity<List<UserActivityDto>> getRecentActivity(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<UserActivityDto> activity = userActivityService.getRecentActivity(principal.getUserId(), limit);
        return ResponseEntity.ok(activity);
    }
}
