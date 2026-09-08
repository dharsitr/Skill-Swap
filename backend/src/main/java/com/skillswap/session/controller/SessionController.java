package com.skillswap.session.controller;

import com.skillswap.common.response.PageResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.session.dto.SessionResponse;
import com.skillswap.session.entity.SessionStatus;
import com.skillswap.session.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sessions")
@Tag(name = "Sessions", description = "Endpoints for managing active and completed skill exchange sessions")
@SecurityRequirement(name = "BearerAuth")
public class SessionController {

    private final SessionService sessionService;
    private final com.skillswap.credit.service.SessionSettlementService sessionSettlementService;

    public SessionController(
            SessionService sessionService,
            com.skillswap.credit.service.SessionSettlementService sessionSettlementService
    ) {
        this.sessionService = sessionService;
        this.sessionSettlementService = sessionSettlementService;
    }

    @GetMapping
    @Operation(summary = "Get my sessions", description = "Lists skill exchange sessions where the current user is teacher or learner.")
    public ResponseEntity<PageResponse<SessionResponse>> getMySessions(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(required = false) SessionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<SessionResponse> response = sessionService.getMySessions(
                principal.getUserId(),
                status,
                pageRequest
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get session by ID", description = "Retrieves session details if the current user is a participant.")
    public ResponseEntity<SessionResponse> getSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        SessionResponse response = sessionService.getSession(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/start")
    @Operation(summary = "Start session", description = "Transitions a SCHEDULED session to IN_PROGRESS.")
    public ResponseEntity<SessionResponse> startSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        SessionResponse response = sessionService.startSession(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Complete session", description = "Transitions an IN_PROGRESS session to COMPLETED.")
    public ResponseEntity<SessionResponse> completeSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        SessionResponse response = sessionService.completeSession(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel session", description = "Transitions a SCHEDULED session to CANCELLED.")
    public ResponseEntity<SessionResponse> cancelSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        SessionResponse response = sessionService.cancelSession(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/settle")
    @Operation(summary = "Settle session credits", description = "Atomically transfers credits from learner to teacher for a completed session.")
    public ResponseEntity<com.skillswap.credit.dto.SessionSettlementResponse> settleSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        com.skillswap.credit.dto.SessionSettlementResponse response = sessionSettlementService.settleSession(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/call/access")
    @Operation(summary = "Verify session call access", description = "Verifies if the current user is an authorized participant eligible to join the WebRTC video call.")
    public ResponseEntity<com.skillswap.session.dto.SessionCallAccessResponse> getCallAccess(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        com.skillswap.session.dto.SessionCallAccessResponse response = sessionService.verifyCallAccess(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }
}

