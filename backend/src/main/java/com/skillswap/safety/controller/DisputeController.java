package com.skillswap.safety.controller;

import com.skillswap.common.response.PageResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.safety.dto.CreateDisputeRequest;
import com.skillswap.safety.dto.DisputeResponse;
import com.skillswap.safety.service.DisputeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/disputes")
@Tag(name = "Session Disputes", description = "Endpoints for raising and viewing session disputes")
@SecurityRequirement(name = "BearerAuth")
public class DisputeController {

    private final DisputeService disputeService;

    public DisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @PostMapping
    @Operation(summary = "Raise a session dispute", description = "Submits a problem dispute for an exchange session for moderator review.")
    public ResponseEntity<DisputeResponse> createDispute(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CreateDisputeRequest request
    ) {
        DisputeResponse response = disputeService.createDispute(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    @Operation(summary = "Get my disputes", description = "Lists disputes raised by the authenticated user.")
    public ResponseEntity<PageResponse<DisputeResponse>> getMyDisputes(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<DisputeResponse> response = disputeService.getMyDisputes(principal.getUserId(), pageRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/session/{sessionId}")
    @Operation(summary = "Get dispute for session", description = "Retrieves dispute submitted for the given session by the current user.")
    public ResponseEntity<DisputeResponse> getDisputeForSession(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID sessionId
    ) {
        DisputeResponse response = disputeService.getDisputeForSession(principal.getUserId(), sessionId);
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }
}
