package com.skillswap.health.controller;

import com.skillswap.health.dto.HealthStatusResponse;
import com.skillswap.health.dto.ReadinessResponse;
import com.skillswap.health.service.HealthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health", description = "Endpoints for monitoring system health, liveness, and database readiness")
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping
    @Operation(summary = "Liveness check", description = "Returns 200 OK if backend application process is alive.")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Service is operational",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = HealthStatusResponse.class))
            )
    })
    public ResponseEntity<HealthStatusResponse> getHealth() {
        return ResponseEntity.ok(healthService.getHealthStatus());
    }

    @GetMapping("/live")
    @Operation(summary = "Explicit liveness probe", description = "Lightweight probe for container/orchestrator liveness.")
    public ResponseEntity<HealthStatusResponse> getLiveness() {
        return ResponseEntity.ok(healthService.getHealthStatus());
    }

    @GetMapping("/ready")
    @Operation(summary = "Readiness check", description = "Verifies backend initialization and database connectivity.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Backend is ready to accept traffic"),
            @ApiResponse(responseCode = "503", description = "Backend dependencies are unavailable")
    })
    public ResponseEntity<ReadinessResponse> getReadiness() {
        ReadinessResponse readiness = healthService.getReadinessStatus();
        if ("READY".equals(readiness.getStatus())) {
            return ResponseEntity.ok(readiness);
        } else {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(readiness);
        }
    }
}
