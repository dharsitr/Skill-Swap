package com.skillswap.matching.service;

import com.skillswap.discovery.entity.DiscoveryMode;
import com.skillswap.matching.config.MatchingWeights;
import com.skillswap.matching.dto.MatchScoreResult;
import com.skillswap.skill.entity.SkillProficiency;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.entity.UserSkill;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    private final AvailabilityScorer availabilityScorer;
    private final RatingScorer ratingScorer;

    public MatchingService(AvailabilityScorer availabilityScorer, RatingScorer ratingScorer) {
        this.availabilityScorer = availabilityScorer;
        this.ratingScorer = ratingScorer;
    }

    public MatchScoreResult calculateMatch(
            UUID currentUserId,
            List<UserSkill> currentUserSkills,
            UUID candidateUserId,
            List<UserSkill> candidateSkills,
            DiscoveryMode mode,
            UUID targetSkillId
    ) {
        List<UserSkill> userLearnSkills = currentUserSkills.stream()
                .filter(us -> us.getRelationshipType() == SkillRelationshipType.LEARN)
                .collect(Collectors.toList());

        List<UserSkill> userTeachSkills = currentUserSkills.stream()
                .filter(us -> us.getRelationshipType() == SkillRelationshipType.TEACH)
                .collect(Collectors.toList());

        List<UserSkill> candTeachSkills = candidateSkills.stream()
                .filter(us -> us.getRelationshipType() == SkillRelationshipType.TEACH)
                .collect(Collectors.toList());

        List<UserSkill> candLearnSkills = candidateSkills.stream()
                .filter(us -> us.getRelationshipType() == SkillRelationshipType.LEARN)
                .collect(Collectors.toList());

        // Find matching skills (where user learns and candidate teaches)
        Map<UUID, UserSkill> userLearnMap = userLearnSkills.stream()
                .collect(Collectors.toMap(us -> us.getSkill().getId(), us -> us, (a, b) -> a));

        Map<UUID, UserSkill> candTeachMap = candTeachSkills.stream()
                .collect(Collectors.toMap(us -> us.getSkill().getId(), us -> us, (a, b) -> a));

        Map<UUID, UserSkill> userTeachMap = userTeachSkills.stream()
                .collect(Collectors.toMap(us -> us.getSkill().getId(), us -> us, (a, b) -> a));

        Map<UUID, UserSkill> candLearnMap = candLearnSkills.stream()
                .collect(Collectors.toMap(us -> us.getSkill().getId(), us -> us, (a, b) -> a));

        Set<UUID> directLearnMatchIds = new LinkedHashSet<>(userLearnMap.keySet());
        directLearnMatchIds.retainAll(candTeachMap.keySet());

        Set<UUID> directTeachMatchIds = new LinkedHashSet<>(userTeachMap.keySet());
        directTeachMatchIds.retainAll(candLearnMap.keySet());

        Set<String> matchedSkillNames = new LinkedHashSet<>();
        List<String> explanations = new ArrayList<>();

        for (UUID skillId : directLearnMatchIds) {
            UserSkill candSkill = candTeachMap.get(skillId);
            String name = candSkill.getSkill().getName();
            matchedSkillNames.add(name);
            explanations.add("They teach " + name + " at " + formatProficiency(candSkill.getProficiency()) + " level");
            explanations.add("You want to learn " + name);
        }

        for (UUID skillId : directTeachMatchIds) {
            UserSkill candSkill = candLearnMap.get(skillId);
            String name = candSkill.getSkill().getName();
            matchedSkillNames.add(name);
            explanations.add("They want to learn " + name);
            explanations.add("You teach " + name);
        }

        // 1. Skill Match Calculation (40%)
        double skillMatchScore;
        if (mode == DiscoveryMode.LEARN) {
            if (directLearnMatchIds.isEmpty()) {
                if (targetSkillId != null && candTeachMap.containsKey(targetSkillId)) {
                    skillMatchScore = 100.0;
                    String name = candTeachMap.get(targetSkillId).getSkill().getName();
                    matchedSkillNames.add(name);
                    explanations.add("They teach " + name);
                } else {
                    skillMatchScore = 0.0;
                }
            } else {
                skillMatchScore = Math.min(100.0, 70.0 + (30.0 * Math.min(directLearnMatchIds.size(), 3) / 3.0));
            }
        } else if (mode == DiscoveryMode.TEACH) {
            if (directTeachMatchIds.isEmpty()) {
                if (targetSkillId != null && candLearnMap.containsKey(targetSkillId)) {
                    skillMatchScore = 100.0;
                    String name = candLearnMap.get(targetSkillId).getSkill().getName();
                    matchedSkillNames.add(name);
                    explanations.add("They want to learn " + name);
                } else {
                    skillMatchScore = 0.0;
                }
            } else {
                skillMatchScore = Math.min(100.0, 70.0 + (30.0 * Math.min(directTeachMatchIds.size(), 3) / 3.0));
            }
        } else { // GENERAL mode
            int totalOverlap = directLearnMatchIds.size() + directTeachMatchIds.size();
            if (totalOverlap > 0) {
                skillMatchScore = Math.min(100.0, 60.0 + (40.0 * Math.min(totalOverlap, 3) / 3.0));
            } else if (targetSkillId != null && (candTeachMap.containsKey(targetSkillId) || candLearnMap.containsKey(targetSkillId))) {
                skillMatchScore = 80.0;
                String targetName = candTeachMap.containsKey(targetSkillId)
                        ? candTeachMap.get(targetSkillId).getSkill().getName()
                        : candLearnMap.get(targetSkillId).getSkill().getName();
                matchedSkillNames.add(targetName);
                explanations.add("Matches searched skill: " + targetName);
            } else {
                skillMatchScore = 30.0; // Baseline general discovery
            }
        }

        // 2. Learning Overlap / Reciprocal 2-Way Match Calculation (25%)
        double learningOverlapScore;
        boolean hasReciprocalMatch = !directLearnMatchIds.isEmpty() && !directTeachMatchIds.isEmpty();
        if (hasReciprocalMatch) {
            learningOverlapScore = 100.0;
            explanations.add("Direct 2-way skill exchange match!");
        } else if (!directLearnMatchIds.isEmpty() || !directTeachMatchIds.isEmpty()) {
            learningOverlapScore = 40.0;
        } else {
            learningOverlapScore = 0.0;
        }

        // 3. Skill Level / Proficiency Compatibility (10%)
        double skillLevelScore = calculateProficiencyScore(directLearnMatchIds, userLearnMap, candTeachMap);

        // 4. Availability Contribution (15%) - Isolated Neutral Baseline
        double availabilityScore = availabilityScorer.calculateAvailabilityScore(currentUserId, candidateUserId);

        // 5. Rating Contribution (10%) - Isolated Neutral Baseline
        double ratingScore = ratingScorer.calculateRatingScore(candidateUserId);

        // Calculate Weighted Total (0 - 100)
        double weightedTotal = (skillMatchScore * MatchingWeights.SKILL_MATCH_WEIGHT)
                + (learningOverlapScore * MatchingWeights.LEARNING_OVERLAP_WEIGHT)
                + (availabilityScore * MatchingWeights.AVAILABILITY_WEIGHT)
                + (ratingScore * MatchingWeights.RATING_WEIGHT)
                + (skillLevelScore * MatchingWeights.SKILL_LEVEL_WEIGHT);

        int totalScore = (int) Math.round(Math.max(0.0, Math.min(100.0, weightedTotal)));

        if (explanations.isEmpty()) {
            if (!candTeachSkills.isEmpty()) {
                explanations.add("They teach " + candTeachSkills.get(0).getSkill().getName());
            } else if (!candLearnSkills.isEmpty()) {
                explanations.add("They want to learn " + candLearnSkills.get(0).getSkill().getName());
            } else {
                explanations.add("Registered peer student");
            }
        }

        return new MatchScoreResult(
                totalScore,
                skillMatchScore,
                learningOverlapScore,
                availabilityScore,
                ratingScore,
                skillLevelScore,
                new ArrayList<>(matchedSkillNames),
                explanations
        );
    }

    private double calculateProficiencyScore(
            Set<UUID> matchingSkillIds,
            Map<UUID, UserSkill> userLearnMap,
            Map<UUID, UserSkill> candTeachMap
    ) {
        if (matchingSkillIds.isEmpty()) {
            return 50.0; // Neutral default
        }

        double totalScore = 0;
        for (UUID skillId : matchingSkillIds) {
            UserSkill userSkill = userLearnMap.get(skillId);
            UserSkill candSkill = candTeachMap.get(skillId);

            int userLevel = getProficiencyValue(userSkill != null ? userSkill.getProficiency() : SkillProficiency.BEGINNER);
            int candLevel = getProficiencyValue(candSkill != null ? candSkill.getProficiency() : SkillProficiency.BEGINNER);

            int diff = candLevel - userLevel;
            if (diff >= 2) {
                totalScore += 100.0; // Candidate is Expert/Advanced, learner is Beginner
            } else if (diff == 1) {
                totalScore += 90.0;
            } else if (diff == 0) {
                totalScore += 75.0; // Same level peer study
            } else if (diff == -1) {
                totalScore += 50.0;
            } else {
                totalScore += 30.0;
            }
        }

        return totalScore / matchingSkillIds.size();
    }

    private int getProficiencyValue(SkillProficiency proficiency) {
        if (proficiency == null) return 1;
        switch (proficiency) {
            case BEGINNER: return 1;
            case INTERMEDIATE: return 2;
            case ADVANCED: return 3;
            case EXPERT: return 4;
            default: return 1;
        }
    }

    private String formatProficiency(SkillProficiency proficiency) {
        if (proficiency == null) return "Beginner";
        String s = proficiency.name();
        return s.charAt(0) + s.substring(1).toLowerCase();
    }
}
