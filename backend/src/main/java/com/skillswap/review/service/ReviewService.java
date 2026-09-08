package com.skillswap.review.service;

import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.common.response.PageResponse;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.review.dto.CreateReviewRequest;
import com.skillswap.review.dto.RatingSummaryResponse;
import com.skillswap.review.dto.ReviewResponse;
import com.skillswap.review.dto.SessionReviewStatusResponse;
import com.skillswap.review.entity.Review;
import com.skillswap.review.repository.ReviewRepository;
import com.skillswap.session.entity.Session;
import com.skillswap.session.entity.SessionStatus;
import com.skillswap.session.repository.SessionRepository;
import com.skillswap.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewRepository reviewRepository;
    private final SessionRepository sessionRepository;
    private final ProfileRepository profileRepository;
    private final com.skillswap.notification.service.NotificationService notificationService;

    public ReviewService(
            ReviewRepository reviewRepository,
            SessionRepository sessionRepository,
            ProfileRepository profileRepository,
            com.skillswap.notification.service.NotificationService notificationService
    ) {
        this.reviewRepository = reviewRepository;
        this.sessionRepository = sessionRepository;
        this.profileRepository = profileRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public ReviewResponse createReview(UUID reviewerId, CreateReviewRequest request) {
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Rating must be an integer between 1 and 5");
        }

        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getSessionId()));

        if (session.getStatus() != SessionStatus.COMPLETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reviews can only be submitted for COMPLETED sessions");
        }

        boolean isTeacher = session.getTeacher().getId().equals(reviewerId);
        boolean isLearner = session.getLearner().getId().equals(reviewerId);

        if (!isTeacher && !isLearner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not an authorized participant in this session");
        }

        User reviewer = isTeacher ? session.getTeacher() : session.getLearner();
        User reviewee = isTeacher ? session.getLearner() : session.getTeacher();

        if (reviewer.getId().equals(reviewee.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot review yourself");
        }

        if (reviewRepository.existsBySessionIdAndReviewerId(session.getId(), reviewerId)) {
            throw new ApiException(HttpStatus.CONFLICT, "You have already submitted a review for this session");
        }

        String sanitizedComment = null;
        if (request.getComment() != null && !request.getComment().trim().isEmpty()) {
            String trimmed = request.getComment().trim();
            sanitizedComment = com.skillswap.common.util.InputSanitizer.sanitize(trimmed, 1000);
            if (sanitizedComment != null && sanitizedComment.length() > 1000) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Review comment cannot exceed 1000 characters");
            }
        }

        Review review = new Review(session, reviewer, reviewee, request.getRating(), sanitizedComment);
        Review saved = reviewRepository.save(review);

        log.info("Created review id: {} for session: {} (reviewer: {}, reviewee: {}, rating: {})",
                saved.getId(), session.getId(), reviewerId, reviewee.getId(), request.getRating());

        Profile reviewerProfile = profileRepository.findByUserId(reviewerId).orElse(null);

        try {
            String reviewerName = (reviewerProfile != null && reviewerProfile.getDisplayName() != null)
                    ? reviewerProfile.getDisplayName() : "A peer";
            notificationService.createNotification(
                    reviewee.getId(),
                    com.skillswap.notification.entity.NotificationType.REVIEW_RECEIVED,
                    "New Review Received",
                    reviewerName + " gave you a " + request.getRating() + "-star rating for " + session.getSkill().getName() + "!",
                    "PROFILE",
                    reviewee.getId(),
                    "/profile"
            );
        } catch (Exception e) {
            log.warn("Failed to create review notification: {}", e.getMessage());
        }

        return ReviewResponse.fromEntity(saved, reviewerProfile);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getReviewsForUser(UUID userId, Pageable pageable) {
        Page<Review> page = reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(userId, pageable);

        if (page.isEmpty()) {
            return PageResponse.of(Collections.emptyList(), page.getNumber(), page.getSize(), page.getTotalElements());
        }

        Set<UUID> reviewerIds = page.getContent().stream()
                .map(r -> r.getReviewer().getId())
                .collect(Collectors.toSet());

        Map<UUID, Profile> profileMap = profileRepository.findByUserIds(reviewerIds).stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p, (a, b) -> a));

        List<ReviewResponse> items = page.getContent().stream()
                .map(r -> ReviewResponse.fromEntity(r, profileMap.get(r.getReviewer().getId())))
                .toList();

        return PageResponse.of(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public RatingSummaryResponse getRatingSummary(UUID userId) {
        long count = reviewRepository.countByRevieweeId(userId);
        if (count == 0) {
            return new RatingSummaryResponse(userId, null, 0L);
        }

        Double avg = reviewRepository.calculateAverageRatingByRevieweeId(userId);
        if (avg == null) {
            return new RatingSummaryResponse(userId, null, 0L);
        }

        double rounded = BigDecimal.valueOf(avg)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();

        return new RatingSummaryResponse(userId, rounded, count);
    }

    @Transactional(readOnly = true)
    public SessionReviewStatusResponse getSessionReviewStatus(UUID userId, UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        boolean isTeacher = session.getTeacher().getId().equals(userId);
        boolean isLearner = session.getLearner().getId().equals(userId);

        if (!isTeacher && !isLearner) {
            return new SessionReviewStatusResponse(sessionId, false, false, null);
        }

        boolean isCompleted = session.getStatus() == SessionStatus.COMPLETED;
        Optional<Review> existingReview = reviewRepository.findBySessionIdAndReviewerId(sessionId, userId);

        ReviewResponse responseDto = null;
        if (existingReview.isPresent()) {
            Profile reviewerProfile = profileRepository.findByUserId(userId).orElse(null);
            responseDto = ReviewResponse.fromEntity(existingReview.get(), reviewerProfile);
        }

        return new SessionReviewStatusResponse(
                sessionId,
                isCompleted,
                existingReview.isPresent(),
                responseDto
        );
    }
}
