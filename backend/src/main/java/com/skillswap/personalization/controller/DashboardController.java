package com.skillswap.personalization.controller;

import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.personalization.dto.DashboardSummaryDto;
import com.skillswap.personalization.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Personalized Dashboard", description = "Endpoints for aggregated personalized dashboard data")
@SecurityRequirement(name = "BearerAuth")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    @Operation(
            summary = "Get personalized dashboard summary",
            description = "Returns aggregated dashboard metrics including profile completion, recommendations, request/session summaries, and recent activity."
    )
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        DashboardSummaryDto summary = dashboardService.getDashboardSummary(principal.getUserId());
        return ResponseEntity.ok(summary);
    }
}
