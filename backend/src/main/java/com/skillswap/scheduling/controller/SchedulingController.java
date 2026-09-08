package com.skillswap.scheduling.controller;

import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.scheduling.dto.RescheduleSessionRequest;
import com.skillswap.scheduling.dto.ScheduleSessionRequest;
import com.skillswap.scheduling.dto.SessionScheduleResponse;
import com.skillswap.scheduling.service.SchedulingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions/{id}")
@Tag(name = "Session Scheduling", description = "Endpoints for scheduling and rescheduling skill exchange sessions")
@SecurityRequirement(name = "BearerAuth")
public class SchedulingController {

    private final SchedulingService schedulingService;

    public SchedulingController(SchedulingService schedulingService) {
        this.schedulingService = schedulingService;
    }

    @GetMapping("/schedule")
    @Operation(summary = "Get session schedule", description = "Retrieves current schedule details for a session if user is a participant.")
    public ResponseEntity<SessionScheduleResponse> getSchedule(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        SessionScheduleResponse response = schedulingService.getSchedule(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/schedule")
    @Operation(summary = "Schedule a session", description = "Sets initial date, time, and timezone for an accepted session.")
    public ResponseEntity<SessionScheduleResponse> scheduleSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ScheduleSessionRequest request
    ) {
        SessionScheduleResponse response = schedulingService.scheduleSession(principal.getUserId(), id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reschedule")
    @Operation(summary = "Reschedule a session", description = "Updates date, time, or timezone for a scheduled session.")
    public ResponseEntity<SessionScheduleResponse> rescheduleSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody RescheduleSessionRequest request
    ) {
        SessionScheduleResponse response = schedulingService.rescheduleSession(principal.getUserId(), id, request);
        return ResponseEntity.ok(response);
    }
}
