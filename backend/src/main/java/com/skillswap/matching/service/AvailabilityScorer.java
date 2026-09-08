package com.skillswap.matching.service;

import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Isolated availability scoring component.
 * In Phase 4, returns a neutral baseline contribution (50.0 / 100.0) without inventing fake schedule data.
 * When real availability is implemented in Phase 5+, this class will query session calendars.
 */
@Component
public class AvailabilityScorer {

    public double calculateAvailabilityScore(UUID currentUserId, UUID candidateUserId) {
        // Neutral baseline for Phase 4
        return 50.0;
    }
}
