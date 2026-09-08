package com.skillswap.review.dto;

import com.skillswap.profile.entity.Profile;
import com.skillswap.review.entity.Review;

import java.time.Instant;
import java.util.UUID;

public class ReviewResponse {

    private UUID id;
    private UUID sessionId;
    private UUID reviewerId;
    private String reviewerName;
    private String reviewerAvatarUrl;
    private UUID revieweeId;
    private Integer rating;
    private String comment;
    private Instant createdAt;

    public ReviewResponse() {}

    public ReviewResponse(
            UUID id,
            UUID sessionId,
            UUID reviewerId,
            String reviewerName,
            String reviewerAvatarUrl,
            UUID revieweeId,
            Integer rating,
            String comment,
            Instant createdAt
    ) {
        this.id = id;
        this.sessionId = sessionId;
        this.reviewerId = reviewerId;
        this.reviewerName = reviewerName;
        this.reviewerAvatarUrl = reviewerAvatarUrl;
        this.revieweeId = revieweeId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public static ReviewResponse fromEntity(Review review, Profile reviewerProfile) {
        String name = reviewerProfile != null ? reviewerProfile.getDisplayName() : "Student";
        String avatar = reviewerProfile != null ? reviewerProfile.getAvatarUrl() : null;

        return new ReviewResponse(
                review.getId(),
                review.getSession().getId(),
                review.getReviewer().getId(),
                name,
                avatar,
                review.getReviewee().getId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public UUID getReviewerId() {
        return reviewerId;
    }

    public void setReviewerId(UUID reviewerId) {
        this.reviewerId = reviewerId;
    }

    public String getReviewerName() {
        return reviewerName;
    }

    public void setReviewerName(String reviewerName) {
        this.reviewerName = reviewerName;
    }

    public String getReviewerAvatarUrl() {
        return reviewerAvatarUrl;
    }

    public void setReviewerAvatarUrl(String reviewerAvatarUrl) {
        this.reviewerAvatarUrl = reviewerAvatarUrl;
    }

    public UUID getRevieweeId() {
        return revieweeId;
    }

    public void setRevieweeId(UUID revieweeId) {
        this.revieweeId = revieweeId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
