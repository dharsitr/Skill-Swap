package com.skillswap.personalization.service;

import com.skillswap.personalization.dto.RecentlyViewedProfileDto;
import com.skillswap.personalization.dto.SearchHistoryDto;
import com.skillswap.personalization.entity.RecentlyViewedProfile;
import com.skillswap.personalization.entity.SearchHistory;
import com.skillswap.personalization.repository.RecentlyViewedProfileRepository;
import com.skillswap.personalization.repository.SearchHistoryRepository;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.safety.service.UserBlockService;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillCategory;
import com.skillswap.skill.entity.UserSkill;
import com.skillswap.skill.repository.SkillCategoryRepository;
import com.skillswap.skill.repository.SkillRepository;
import com.skillswap.skill.repository.UserSkillRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HistoryService {

    private static final Logger log = LoggerFactory.getLogger(HistoryService.class);
    private static final int MAX_PROFILE_HISTORY = 20;
    private static final int MAX_SEARCH_HISTORY = 10;

    private final RecentlyViewedProfileRepository profileHistoryRepo;
    private final SearchHistoryRepository searchHistoryRepo;
    private final UserRepository userRepo;
    private final ProfileRepository profileRepo;
    private final UserSkillRepository userSkillRepo;
    private final SkillRepository skillRepo;
    private final SkillCategoryRepository categoryRepo;
    private final UserBlockService userBlockService;

    public HistoryService(
            RecentlyViewedProfileRepository profileHistoryRepo,
            SearchHistoryRepository searchHistoryRepo,
            UserRepository userRepo,
            ProfileRepository profileRepo,
            UserSkillRepository userSkillRepo,
            SkillRepository skillRepo,
            SkillCategoryRepository categoryRepo,
            UserBlockService userBlockService
    ) {
        this.profileHistoryRepo = profileHistoryRepo;
        this.searchHistoryRepo = searchHistoryRepo;
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.userSkillRepo = userSkillRepo;
        this.skillRepo = skillRepo;
        this.categoryRepo = categoryRepo;
        this.userBlockService = userBlockService;
    }

    @Transactional
    public void recordProfileView(UUID viewerId, UUID targetUserId) {
        if (viewerId == null || targetUserId == null || viewerId.equals(targetUserId)) {
            return; // Ignore self or invalid views
        }

        // Check if target user exists and is not blocked
        if (userBlockService.isBlocked(viewerId, targetUserId)) {
            return;
        }

        Optional<User> viewerOpt = userRepo.findById(viewerId);
        Optional<User> targetOpt = userRepo.findById(targetUserId);

        if (viewerOpt.isEmpty() || targetOpt.isEmpty()) {
            return;
        }

        Optional<RecentlyViewedProfile> existing = profileHistoryRepo.findByViewerIdAndViewedUserId(viewerId, targetUserId);
        if (existing.isPresent()) {
            RecentlyViewedProfile record = existing.get();
            record.setViewedAt(Instant.now());
            profileHistoryRepo.save(record);
        } else {
            RecentlyViewedProfile newRecord = new RecentlyViewedProfile(viewerOpt.get(), targetOpt.get());
            profileHistoryRepo.save(newRecord);
        }

        // Trim old records if exceeding max
        List<UUID> allIds = profileHistoryRepo.findIdsByViewerIdOrderByViewedAtDesc(viewerId);
        if (allIds.size() > MAX_PROFILE_HISTORY) {
            List<UUID> toDelete = allIds.subList(MAX_PROFILE_HISTORY, allIds.size());
            profileHistoryRepo.deleteAllById(toDelete);
        }
    }

    @Transactional(readOnly = true)
    public List<RecentlyViewedProfileDto> getRecentlyViewedProfiles(UUID viewerId, int limit) {
        int effectiveLimit = Math.min(Math.max(limit, 1), 50);
        List<RecentlyViewedProfile> records = profileHistoryRepo.findByViewerIdOrderByViewedAtDesc(
                viewerId, PageRequest.of(0, effectiveLimit)
        );

        List<UUID> blockedIds = userBlockService.getMutualBlockedUserIds(viewerId);
        Set<UUID> blockedSet = new HashSet<>(blockedIds);

        List<RecentlyViewedProfileDto> results = new ArrayList<>();
        for (RecentlyViewedProfile record : records) {
            UUID targetId = record.getViewedUser().getId();
            if (blockedSet.contains(targetId)) {
                continue;
            }

            Profile profile = profileRepo.findByUserId(targetId).orElse(null);
            List<UserSkill> skills = userSkillRepo.findByUserId(targetId);
            List<String> topSkills = skills.stream()
                    .map(us -> us.getSkill().getName())
                    .distinct()
                    .limit(4)
                    .collect(Collectors.toList());

            results.add(new RecentlyViewedProfileDto(
                    targetId,
                    profile != null ? profile.getDisplayName() : "Student",
                    profile != null ? profile.getAvatarUrl() : null,
                    profile != null ? profile.getCollegeName() : null,
                    profile != null ? profile.getDepartment() : null,
                    profile != null && profile.getYearOfStudy() != null ? profile.getYearOfStudy().name() : null,
                    topSkills,
                    record.getViewedAt()
            ));
        }

        return results;
    }

    @Transactional
    public void clearProfileHistory(UUID viewerId) {
        profileHistoryRepo.deleteAllByViewerId(viewerId);
        log.info("Cleared profile view history for user {}", viewerId);
    }

    @Transactional
    public void recordSearch(UUID userId, String query, UUID categoryId, UUID skillId) {
        if (userId == null || query == null || query.trim().isEmpty()) {
            return;
        }

        Optional<User> userOpt = userRepo.findById(userId);
        if (userOpt.isEmpty()) {
            return;
        }

        SkillCategory category = categoryId != null ? categoryRepo.findById(categoryId).orElse(null) : null;
        Skill skill = skillId != null ? skillRepo.findById(skillId).orElse(null) : null;

        SearchHistory newRecord = new SearchHistory(userOpt.get(), query.trim(), category, skill);
        searchHistoryRepo.save(newRecord);

        // Trim old records if exceeding max
        List<UUID> allIds = searchHistoryRepo.findIdsByUserIdOrderBySearchedAtDesc(userId);
        if (allIds.size() > MAX_SEARCH_HISTORY) {
            List<UUID> toDelete = allIds.subList(MAX_SEARCH_HISTORY, allIds.size());
            searchHistoryRepo.deleteAllById(toDelete);
        }
    }

    @Transactional(readOnly = true)
    public List<SearchHistoryDto> getSearchHistory(UUID userId, int limit) {
        int effectiveLimit = Math.min(Math.max(limit, 1), 30);
        List<SearchHistory> records = searchHistoryRepo.findByUserIdOrderBySearchedAtDesc(
                userId, PageRequest.of(0, effectiveLimit)
        );

        return records.stream().map(s -> new SearchHistoryDto(
                s.getId(),
                s.getQuery(),
                s.getCategory() != null ? s.getCategory().getId() : null,
                s.getCategory() != null ? s.getCategory().getName() : null,
                s.getSkill() != null ? s.getSkill().getId() : null,
                s.getSkill() != null ? s.getSkill().getName() : null,
                s.getSearchedAt()
        )).collect(Collectors.toList());
    }

    @Transactional
    public void clearSearchHistory(UUID userId) {
        searchHistoryRepo.deleteAllByUserId(userId);
        log.info("Cleared search history for user {}", userId);
    }
}
