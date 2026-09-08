package com.skillswap.exchange.controller;

import com.skillswap.common.response.PageResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.exchange.dto.CreateExchangeRequest;
import com.skillswap.exchange.dto.ExchangeRequestResponse;
import com.skillswap.exchange.entity.ExchangeRequestStatus;
import com.skillswap.exchange.service.ExchangeRequestService;
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
@RequestMapping("/api/v1/exchange-requests")
@Tag(name = "Exchange Requests", description = "Endpoints for creating and managing peer skill exchange requests")
@SecurityRequirement(name = "BearerAuth")
public class ExchangeRequestController {

    private final ExchangeRequestService exchangeRequestService;

    public ExchangeRequestController(ExchangeRequestService exchangeRequestService) {
        this.exchangeRequestService = exchangeRequestService;
    }

    @PostMapping
    @Operation(summary = "Create exchange request", description = "Sends a new skill exchange request to a peer student.")
    public ResponseEntity<ExchangeRequestResponse> createRequest(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CreateExchangeRequest request
    ) {
        ExchangeRequestResponse response = exchangeRequestService.createRequest(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get exchange request by ID", description = "Retrieves an exchange request if the authenticated user is the requester or recipient.")
    public ResponseEntity<ExchangeRequestResponse> getRequest(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        ExchangeRequestResponse response = exchangeRequestService.getRequest(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/incoming")
    @Operation(summary = "Get incoming exchange requests", description = "Lists exchange requests received by the current user.")
    public ResponseEntity<PageResponse<ExchangeRequestResponse>> getIncomingRequests(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(required = false) ExchangeRequestStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<ExchangeRequestResponse> response = exchangeRequestService.getIncomingRequests(
                principal.getUserId(),
                status,
                pageRequest
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/outgoing")
    @Operation(summary = "Get outgoing exchange requests", description = "Lists exchange requests sent by the current user.")
    public ResponseEntity<PageResponse<ExchangeRequestResponse>> getOutgoingRequests(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(required = false) ExchangeRequestStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<ExchangeRequestResponse> response = exchangeRequestService.getOutgoingRequests(
                principal.getUserId(),
                status,
                pageRequest
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Accept exchange request", description = "Accepts a pending exchange request and automatically creates a new session.")
    public ResponseEntity<ExchangeRequestResponse> acceptRequest(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        ExchangeRequestResponse response = exchangeRequestService.acceptRequest(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject exchange request", description = "Rejects a pending exchange request received by the current user.")
    public ResponseEntity<ExchangeRequestResponse> rejectRequest(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        ExchangeRequestResponse response = exchangeRequestService.rejectRequest(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel exchange request", description = "Cancels a pending exchange request sent by the current user.")
    public ResponseEntity<ExchangeRequestResponse> cancelRequest(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        ExchangeRequestResponse response = exchangeRequestService.cancelRequest(principal.getUserId(), id);
        return ResponseEntity.ok(response);
    }
}
