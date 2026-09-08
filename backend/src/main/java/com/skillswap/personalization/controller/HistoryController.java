package com.skillswap.personalization.controller;

import com.skillswap.common.response.ApiResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.personalization.dto.RecentlyViewedProfileDto;
import com.skillswap.personalization.dto.RecordProfileViewRequest;
import com.skillswap.personalization.dto.RecordSearchRequest;
import com.skillswap.personalization.dto.SearchHistoryDto;
import com.skillswap.personalization.service.HistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/history")
@Tag(name = "User History & Activity", description = "Endpoints for tracking and managing user profile views and search history")
@SecurityRequirement(name = "BearerAuth")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping("/profiles")
    @Operation(
            summary = "Get recently viewed profiles",
            description = "Returns recently viewed student profiles for the authenticated user, excluding blocked users."
    )
    public ResponseEntity<List<RecentlyViewedProfileDto>> getRecentlyViewedProfiles(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "20") int limit
    ) {
        List<RecentlyViewedProfileDto> profiles = historyService.getRecentlyViewedProfiles(principal.getUserId(), limit);
        return ResponseEntity.ok(profiles);
    }

    @PostMapping("/profiles")
    @Operation(
            summary = "Record viewed profile",
            description = "Records or updates a viewed profile timestamp for the authenticated user."
    )
    public ResponseEntity<ApiResponse<String>> recordProfileView(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody RecordProfileViewRequest request
    ) {
        historyService.recordProfileView(principal.getUserId(), request.targetUserId());
        return ResponseEntity.ok(ApiResponse.success("Profile view recorded"));
    }

    @DeleteMapping("/profiles")
    @Operation(
            summary = "Clear profile viewing history",
            description = "Clears the authenticated user's viewed profiles history."
    )
    public ResponseEntity<ApiResponse<String>> clearProfileHistory(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        historyService.clearProfileHistory(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Profile history cleared"));
    }

    @GetMapping("/searches")
    @Operation(
            summary = "Get search history",
            description = "Returns the recent discovery searches for the authenticated user."
    )
    public ResponseEntity<List<SearchHistoryDto>> getSearchHistory(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<SearchHistoryDto> searches = historyService.getSearchHistory(principal.getUserId(), limit);
        return ResponseEntity.ok(searches);
    }

    @PostMapping("/searches")
    @Operation(
            summary = "Record search query",
            description = "Records a search query in the authenticated user's search history."
    )
    public ResponseEntity<ApiResponse<String>> recordSearch(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody RecordSearchRequest request
    ) {
        historyService.recordSearch(principal.getUserId(), request.query(), request.categoryId(), request.skillId());
        return ResponseEntity.ok(ApiResponse.success("Search recorded"));
    }

    @DeleteMapping("/searches")
    @Operation(
            summary = "Clear search history",
            description = "Clears the authenticated user's search history."
    )
    public ResponseEntity<ApiResponse<String>> clearSearchHistory(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        historyService.clearSearchHistory(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Search history cleared"));
    }
}
