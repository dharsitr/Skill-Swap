package com.skillswap.review.dto;

import java.util.UUID;

public class RatingSummaryResponse {

    private UUID userId;
    private Double averageRating;
    private Long reviewCount;

    public RatingSummaryResponse() {}

    public RatingSummaryResponse(UUID userId, Double averageRating, Long reviewCount) {
        this.userId = userId;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount != null ? reviewCount : 0L;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Long getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(Long reviewCount) {
        this.reviewCount = reviewCount;
    }
}
