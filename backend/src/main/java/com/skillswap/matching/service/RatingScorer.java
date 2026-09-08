package com.skillswap.matching.service;

import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Isolated rating scoring component.
 * In Phase 4, returns a neutral baseline contribution (50.0 / 100.0) without fabricating fake review data.
 * When real ratings/reviews are implemented in Phase 5+, this class will query historical session feedback.
 */
@Component
public class RatingScorer {

    public double calculateRatingScore(UUID candidateUserId) {
        // Neutral baseline for Phase 4
        return 50.0;
    }
}
