package com.skillswap.review.controller;

import com.skillswap.common.response.PageResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.review.dto.CreateReviewRequest;
import com.skillswap.review.dto.RatingSummaryResponse;
import com.skillswap.review.dto.ReviewResponse;
import com.skillswap.review.dto.SessionReviewStatusResponse;
import com.skillswap.review.service.ReviewService;
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
@RequestMapping("/api/v1/reviews")
@Tag(name = "Reviews & Ratings", description = "Endpoints for creating and retrieving session reviews and ratings")
@SecurityRequirement(name = "BearerAuth")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @Operation(summary = "Submit a review", description = "Submits a rating and optional written review for a completed session.")
    public ResponseEntity<ReviewResponse> createReview(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        ReviewResponse response = reviewService.createReview(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/profile/{userId}")
    @Operation(summary = "Get reviews for a user", description = "Lists reviews received by the specified student.")
    public ResponseEntity<PageResponse<ReviewResponse>> getReviewsForUser(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<ReviewResponse> response = reviewService.getReviewsForUser(userId, pageRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary/{userId}")
    @Operation(summary = "Get rating summary for a user", description = "Calculates average star rating and review count.")
    public ResponseEntity<RatingSummaryResponse> getRatingSummary(
            @PathVariable UUID userId
    ) {
        RatingSummaryResponse response = reviewService.getRatingSummary(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/session/{sessionId}/status")
    @Operation(summary = "Check session review status", description = "Checks whether current user is eligible and has reviewed the session.")
    public ResponseEntity<SessionReviewStatusResponse> getSessionReviewStatus(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID sessionId
    ) {
        SessionReviewStatusResponse response = reviewService.getSessionReviewStatus(principal.getUserId(), sessionId);
        return ResponseEntity.ok(response);
    }
}
