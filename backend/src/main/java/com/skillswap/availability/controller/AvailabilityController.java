package com.skillswap.availability.controller;

import com.skillswap.availability.dto.CreateAvailabilityRequest;
import com.skillswap.availability.dto.UpdateAvailabilityRequest;
import com.skillswap.availability.dto.UserAvailabilityResponse;
import com.skillswap.availability.service.AvailabilityService;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/availability")
@Tag(name = "Availability", description = "Endpoints for managing student recurring weekly availability slots")
@SecurityRequirement(name = "BearerAuth")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get my availability", description = "Lists all recurring weekly availability slots for the authenticated student.")
    public ResponseEntity<List<UserAvailabilityResponse>> getMyAvailability(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        List<UserAvailabilityResponse> response = availabilityService.getMyAvailability(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Create availability slot", description = "Creates a new recurring weekly availability slot.")
    public ResponseEntity<UserAvailabilityResponse> createAvailability(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CreateAvailabilityRequest request
    ) {
        UserAvailabilityResponse response = availabilityService.createAvailability(principal.getUserId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update availability slot", description = "Updates an existing availability slot owned by the authenticated student.")
    public ResponseEntity<UserAvailabilityResponse> updateAvailability(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAvailabilityRequest request
    ) {
        UserAvailabilityResponse response = availabilityService.updateAvailability(principal.getUserId(), id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete availability slot", description = "Deletes an availability slot owned by the authenticated student.")
    public ResponseEntity<Void> deleteAvailability(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        availabilityService.deleteAvailability(principal.getUserId(), id);
        return ResponseEntity.noContent().build();
    }
}
