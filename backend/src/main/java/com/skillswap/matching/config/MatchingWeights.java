package com.skillswap.matching.config;

/**
 * Centralized weights for the deterministic SkillSwap compatibility matching engine.
 * Total weights sum to 1.00 (100%).
 */
public final class MatchingWeights {

    private MatchingWeights() {
        // Prevent instantiation
    }

    /**
     * Primary skill match weight (40%).
     * Measures how well candidate teaching/learning skills fulfill user needs.
     */
    public static final double SKILL_MATCH_WEIGHT = 0.40;

    /**
     * Learning overlap / Reciprocal 2-way match weight (25%).
     * Measures whether both students have complementary exchange interests (A teaches B, B teaches A).
     */
    public static final double LEARNING_OVERLAP_WEIGHT = 0.25;

    /**
     * Availability score weight (15%).
     * Isolated neutral contribution in Phase 4 until scheduling domain is added in Phase 5+.
     */
    public static final double AVAILABILITY_WEIGHT = 0.15;

    /**
     * Rating score weight (10%).
     * Isolated neutral contribution in Phase 4 until ratings domain is added in Phase 5+.
     */
    public static final double RATING_WEIGHT = 0.10;

    /**
     * Skill level proficiency alignment weight (10%).
     * Compares teacher proficiency relative to learner proficiency.
     */
    public static final double SKILL_LEVEL_WEIGHT = 0.10;
}
