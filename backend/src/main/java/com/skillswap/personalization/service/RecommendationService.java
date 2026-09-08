package com.skillswap.personalization.service;

import com.skillswap.discovery.entity.DiscoveryMode;
import com.skillswap.matching.dto.MatchScoreResult;
import com.skillswap.matching.service.MatchingService;
import com.skillswap.personalization.dto.RecommendedSkillDto;
import com.skillswap.personalization.dto.RecommendedStudentDto;
import com.skillswap.personalization.dto.RecommendedStudentDto.SkillSummaryDto;
import com.skillswap.personalization.entity.SearchHistory;
import com.skillswap.personalization.repository.SearchHistoryRepository;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.safety.service.UserBlockService;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.entity.UserSkill;
import com.skillswap.skill.repository.SkillRepository;
import com.skillswap.skill.repository.UserSkillRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final UserBlockService userBlockService;
    private final MatchingService matchingService;

    public RecommendationService(
            UserRepository userRepository,
            ProfileRepository profileRepository,
            UserSkillRepository userSkillRepository,
            SkillRepository skillRepository,
            SearchHistoryRepository searchHistoryRepository,
            UserBlockService userBlockService,
            MatchingService matchingService
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.userSkillRepository = userSkillRepository;
        this.skillRepository = skillRepository;
        this.searchHistoryRepository = searchHistoryRepository;
        this.userBlockService = userBlockService;
        this.matchingService = matchingService;
    }

    @Transactional(readOnly = true)
    public List<RecommendedStudentDto> getRecommendedStudents(UUID currentUserId, int limit) {
        int effectiveLimit = Math.min(Math.max(limit, 1), 30);

        List<UserSkill> currentUserSkills = userSkillRepository.findByUserId(currentUserId);
        Optional<Profile> currentProfileOpt = profileRepository.findByUserId(currentUserId);
        Profile currentProfile = currentProfileOpt.orElse(null);

        List<UUID> blockedIds = userBlockService.getMutualBlockedUserIds(currentUserId);
        Set<UUID> excludedUserIds = new HashSet<>(blockedIds);
        excludedUserIds.add(currentUserId);

        // Fetch recent searches for relevance signals
        List<SearchHistory> recentSearches = searchHistoryRepository.findByUserIdOrderBySearchedAtDesc(
                currentUserId, PageRequest.of(0, 5)
        );
        Set<String> searchKeywords = recentSearches.stream()
                .map(s -> s.getQuery().toLowerCase().trim())
                .filter(q -> !q.isEmpty())
                .collect(Collectors.toSet());

        // Find all active users except excluded
        List<User> candidateUsers = userRepository.findAll().stream()
                .filter(u -> !excludedUserIds.contains(u.getId()))
                .collect(Collectors.toList());

        List<ScoredCandidate> scoredCandidates = new ArrayList<>();

        for (User candidate : candidateUsers) {
            UUID candId = candidate.getId();
            Profile candProfile = profileRepository.findByUserId(candId).orElse(null);
            List<UserSkill> candSkills = userSkillRepository.findByUserId(candId);

            if (candSkills.isEmpty() && candProfile == null) {
                continue;
            }

            MatchScoreResult matchResult = matchingService.calculateMatch(
                    currentUserId,
                    currentUserSkills,
                    candId,
                    candSkills,
                    DiscoveryMode.GENERAL,
                    null
            );

            double score = matchResult.getTotalScore();
            String reasonType = "PROFILE_COMPATIBILITY";
            String reason = "General campus peer match";

            // Check specific reasons
            boolean teachesWhatIWant = currentUserSkills.stream()
                    .filter(us -> us.getRelationshipType() == SkillRelationshipType.LEARN)
                    .anyMatch(learnSkill -> candSkills.stream().anyMatch(cs ->
                            cs.getRelationshipType() == SkillRelationshipType.TEACH &&
                                    cs.getSkill().getId().equals(learnSkill.getSkill().getId())));

            boolean learnsWhatITeach = currentUserSkills.stream()
                    .filter(us -> us.getRelationshipType() == SkillRelationshipType.TEACH)
                    .anyMatch(teachSkill -> candSkills.stream().anyMatch(cs ->
                            cs.getRelationshipType() == SkillRelationshipType.LEARN &&
                                    cs.getSkill().getId().equals(teachSkill.getSkill().getId())));

            if (teachesWhatIWant && learnsWhatITeach) {
                reasonType = "MUTUAL_EXCHANGE";
                reason = "Perfect mutual skill match for two-way exchange";
                score += 15.0;
            } else if (teachesWhatIWant) {
                Optional<UserSkill> matchedSkill = currentUserSkills.stream()
                        .filter(us -> us.getRelationshipType() == SkillRelationshipType.LEARN)
                        .filter(learnSkill -> candSkills.stream().anyMatch(cs ->
                                cs.getRelationshipType() == SkillRelationshipType.TEACH &&
                                        cs.getSkill().getId().equals(learnSkill.getSkill().getId())))
                        .findFirst();

                reasonType = "SKILL_MATCH";
                reason = matchedSkill.map(us -> "Teaches " + us.getSkill().getName() + " which you want to learn")
                        .orElse("Matches skills you want to learn");
            } else {
                // Check search keywords
                boolean matchesSearch = candSkills.stream().anyMatch(cs ->
                        searchKeywords.stream().anyMatch(kw ->
                                cs.getSkill().getName().toLowerCase().contains(kw) ||
                                        (cs.getSkill().getCategory() != null && cs.getSkill().getCategory().getName().toLowerCase().contains(kw))));

                if (matchesSearch) {
                    reasonType = "RECENT_SEARCH";
                    reason = "Matches skills from your recent search activity";
                    score += 10.0;
                } else if (currentProfile != null && candProfile != null &&
                        currentProfile.getCollegeName() != null &&
                        currentProfile.getCollegeName().equalsIgnoreCase(candProfile.getCollegeName())) {
                    reasonType = "CAMPUS_PEER";
                    reason = "Peer from " + candProfile.getCollegeName();
                }
            }

            List<SkillSummaryDto> teaching = candSkills.stream()
                    .filter(s -> s.getRelationshipType() == SkillRelationshipType.TEACH)
                    .map(s -> new SkillSummaryDto(
                            s.getSkill().getId(),
                            s.getSkill().getName(),
                            s.getSkill().getCategory() != null ? s.getSkill().getCategory().getName() : "General",
                            s.getProficiency().name(),
                            s.getRelationshipType().name()
                    )).collect(Collectors.toList());

            List<SkillSummaryDto> learning = candSkills.stream()
                    .filter(s -> s.getRelationshipType() == SkillRelationshipType.LEARN)
                    .map(s -> new SkillSummaryDto(
                            s.getSkill().getId(),
                            s.getSkill().getName(),
                            s.getSkill().getCategory() != null ? s.getSkill().getCategory().getName() : "General",
                            s.getProficiency().name(),
                            s.getRelationshipType().name()
                    )).collect(Collectors.toList());

            RecommendedStudentDto dto = new RecommendedStudentDto(
                    candId,
                    candProfile != null ? candProfile.getDisplayName() : "Student",
                    candProfile != null ? candProfile.getAvatarUrl() : null,
                    candProfile != null ? candProfile.getCollegeName() : null,
                    candProfile != null ? candProfile.getDepartment() : null,
                    candProfile != null && candProfile.getYearOfStudy() != null ? candProfile.getYearOfStudy().name() : null,
                    Math.round(score * 10.0) / 10.0,
                    teaching,
                    learning,
                    reasonType,
                    reason,
                    matchResult.getExplanation()
            );

            scoredCandidates.add(new ScoredCandidate(score, dto));
        }

        // Sort descending by score, tie-break by userId
        scoredCandidates.sort((a, b) -> {
            int cmp = Double.compare(b.score, a.score);
            if (cmp != 0) return cmp;
            return a.dto.userId().compareTo(b.dto.userId());
        });

        return scoredCandidates.stream()
                .map(sc -> sc.dto)
                .limit(effectiveLimit)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RecommendedSkillDto> getRecommendedSkills(UUID currentUserId, int limit) {
        int effectiveLimit = Math.min(Math.max(limit, 1), 30);

        List<UserSkill> userSkills = userSkillRepository.findByUserId(currentUserId);
        Set<UUID> existingSkillIds = userSkills.stream()
                .map(us -> us.getSkill().getId())
                .collect(Collectors.toSet());

        Set<UUID> userCategoryIds = userSkills.stream()
                .map(us -> us.getSkill().getCategory() != null ? us.getSkill().getCategory().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<SearchHistory> recentSearches = searchHistoryRepository.findByUserIdOrderBySearchedAtDesc(
                currentUserId, PageRequest.of(0, 5)
        );
        Set<String> searchKeywords = recentSearches.stream()
                .map(s -> s.getQuery().toLowerCase().trim())
                .filter(q -> !q.isEmpty())
                .collect(Collectors.toSet());

        List<Skill> allSkills = skillRepository.findAll();
        List<RecommendedSkillDto> recommendations = new ArrayList<>();

        for (Skill skill : allSkills) {
            if (existingSkillIds.contains(skill.getId())) {
                continue; // Exclude already assigned skills
            }

            String reasonType = "POPULAR_PLATFORM";
            String reason = "Popular skill on SkillSwap";

            boolean matchesSearch = searchKeywords.stream().anyMatch(kw ->
                    skill.getName().toLowerCase().contains(kw) ||
                            (skill.getCategory() != null && skill.getCategory().getName().toLowerCase().contains(kw)));

            if (matchesSearch) {
                reasonType = "RECENT_SEARCH";
                reason = "Based on your recent search history";
            } else if (skill.getCategory() != null && userCategoryIds.contains(skill.getCategory().getId())) {
                reasonType = "RELATED_CATEGORY";
                reason = "Popular in " + skill.getCategory().getName();
            }

            recommendations.add(new RecommendedSkillDto(
                    skill.getId(),
                    skill.getName(),
                    skill.getCategory() != null ? skill.getCategory().getId() : null,
                    skill.getCategory() != null ? skill.getCategory().getName() : "General",
                    skill.getDescription(),
                    reasonType,
                    reason
            ));
        }

        // Prioritize RECENT_SEARCH, then RELATED_CATEGORY, then POPULAR_PLATFORM
        recommendations.sort((a, b) -> {
            int pA = getPriority(a.recommendationReasonType());
            int pB = getPriority(b.recommendationReasonType());
            if (pA != pB) {
                return Integer.compare(pB, pA);
            }
            return a.name().compareToIgnoreCase(b.name());
        });

        return recommendations.stream().limit(effectiveLimit).collect(Collectors.toList());
    }

    private int getPriority(String reasonType) {
        return switch (reasonType) {
            case "RECENT_SEARCH" -> 3;
            case "RELATED_CATEGORY" -> 2;
            default -> 1;
        };
    }

    private static class ScoredCandidate {
        final double score;
        final RecommendedStudentDto dto;

        ScoredCandidate(double score, RecommendedStudentDto dto) {
            this.score = score;
            this.dto = dto;
        }
    }
}
