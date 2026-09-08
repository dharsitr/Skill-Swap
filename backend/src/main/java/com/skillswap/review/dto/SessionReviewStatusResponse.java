package com.skillswap.review.dto;

import java.util.UUID;

public class SessionReviewStatusResponse {

    private UUID sessionId;
    private boolean eligible;
    private boolean hasReviewed;
    private ReviewResponse review;

    public SessionReviewStatusResponse() {}

    public SessionReviewStatusResponse(UUID sessionId, boolean eligible, boolean hasReviewed, ReviewResponse review) {
        this.sessionId = sessionId;
        this.eligible = eligible;
        this.hasReviewed = hasReviewed;
        this.review = review;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public boolean isEligible() {
        return eligible;
    }

    public void setEligible(boolean eligible) {
        this.eligible = eligible;
    }

    public boolean isHasReviewed() {
        return hasReviewed;
    }

    public void setHasReviewed(boolean hasReviewed) {
        this.hasReviewed = hasReviewed;
    }

    public ReviewResponse getReview() {
        return review;
    }

    public void setReview(ReviewResponse review) {
        this.review = review;
    }
}
