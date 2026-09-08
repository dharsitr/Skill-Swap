package com.skillswap.discovery.service;

import com.skillswap.common.response.PageResponse;
import com.skillswap.discovery.dto.DiscoveryCandidateDto;
import com.skillswap.discovery.dto.DiscoveryFilterRequest;
import com.skillswap.discovery.dto.PublicProfileDto;
import com.skillswap.discovery.dto.PublicUserSkillDto;
import com.skillswap.discovery.entity.DiscoveryMode;
import com.skillswap.matching.dto.MatchScoreResult;
import com.skillswap.matching.service.MatchingService;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.skill.entity.SkillProficiency;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.entity.UserSkill;
import com.skillswap.skill.repository.UserSkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DiscoveryService {

    private final ProfileRepository profileRepository;
    private final UserSkillRepository userSkillRepository;
    private final MatchingService matchingService;
    private final com.skillswap.safety.service.UserBlockService userBlockService;

    public DiscoveryService(
            ProfileRepository profileRepository,
            UserSkillRepository userSkillRepository,
            MatchingService matchingService,
            com.skillswap.safety.service.UserBlockService userBlockService
    ) {
        this.profileRepository = profileRepository;
        this.userSkillRepository = userSkillRepository;
        this.matchingService = matchingService;
        this.userBlockService = userBlockService;
    }

    public PageResponse<DiscoveryCandidateDto> discoverCandidates(UUID currentUserId, DiscoveryFilterRequest filter) {
        List<UserSkill> currentUserSkills = userSkillRepository.findByUserId(currentUserId);
        List<Profile> candidateProfiles = profileRepository.findAllActiveCandidates(currentUserId);

        // Filter out mutually blocked users
        List<UUID> blockedIds = userBlockService.getMutualBlockedUserIds(currentUserId);
        if (!blockedIds.isEmpty()) {
            Set<UUID> blockedSet = new HashSet<>(blockedIds);
            candidateProfiles = candidateProfiles.stream()
                    .filter(p -> !blockedSet.contains(p.getUser().getId()))
                    .collect(Collectors.toList());
        }

        if (candidateProfiles.isEmpty()) {
            return PageResponse.of(Collections.emptyList(), filter.getPage(), filter.getSize(), 0);
        }

        List<UUID> candidateUserIds = candidateProfiles.stream()
                .map(p -> p.getUser().getId())
                .collect(Collectors.toList());

        List<UserSkill> allCandidateSkills = userSkillRepository.findByUserIds(candidateUserIds);
        Map<UUID, List<UserSkill>> skillsByCandidateId = allCandidateSkills.stream()
                .collect(Collectors.groupingBy(us -> us.getUser().getId()));

        List<DiscoveryCandidateDto> matchedCandidates = new ArrayList<>();

        for (Profile profile : candidateProfiles) {
            UUID candUserId = profile.getUser().getId();
            List<UserSkill> candSkills = skillsByCandidateId.getOrDefault(candUserId, Collections.emptyList());

            if (!matchesFilters(profile, candSkills, filter)) {
                continue;
            }

            MatchScoreResult matchResult = matchingService.calculateMatch(
                    currentUserId,
                    currentUserSkills,
                    candUserId,
                    candSkills,
                    filter.getMode(),
                    filter.getSkillId()
            );

            List<PublicUserSkillDto> teaching = candSkills.stream()
                    .filter(s -> s.getRelationshipType() == SkillRelationshipType.TEACH)
                    .map(PublicUserSkillDto::fromEntity)
                    .collect(Collectors.toList());

            List<PublicUserSkillDto> learning = candSkills.stream()
                    .filter(s -> s.getRelationshipType() == SkillRelationshipType.LEARN)
                    .map(PublicUserSkillDto::fromEntity)
                    .collect(Collectors.toList());

            PublicProfileDto candidateDto = PublicProfileDto.fromEntity(profile, teaching, learning);
            matchedCandidates.add(new DiscoveryCandidateDto(
                    candidateDto,
                    matchResult.getTotalScore(),
                    matchResult.getMatchedSkills(),
                    matchResult.getExplanation()
            ));
        }

        // Sorting
        sortCandidates(matchedCandidates, filter.getSort());

        // Pagination
        int totalElements = matchedCandidates.size();
        int page = Math.max(0, filter.getPage());
        int size = Math.max(1, filter.getSize());
        int fromIndex = page * size;

        List<DiscoveryCandidateDto> pagedItems;
        if (fromIndex >= totalElements) {
            pagedItems = Collections.emptyList();
        } else {
            int toIndex = Math.min(fromIndex + size, totalElements);
            pagedItems = matchedCandidates.subList(fromIndex, toIndex);
        }

        return PageResponse.of(pagedItems, page, size, totalElements);
    }

    public PageResponse<DiscoveryCandidateDto> getRecommendedCandidates(UUID currentUserId, int page, int size) {
        DiscoveryFilterRequest filter = new DiscoveryFilterRequest();
        filter.setMode(DiscoveryMode.GENERAL);
        filter.setSort("score,desc");
        filter.setPage(page);
        filter.setSize(size);
        return discoverCandidates(currentUserId, filter);
    }

    private boolean matchesFilters(Profile profile, List<UserSkill> candSkills, DiscoveryFilterRequest filter) {
        DiscoveryMode mode = filter.getMode() != null ? filter.getMode() : DiscoveryMode.GENERAL;

        // Mode constraint
        if (mode == DiscoveryMode.LEARN) {
            boolean teachesAny = candSkills.stream().anyMatch(s -> s.getRelationshipType() == SkillRelationshipType.TEACH);
            if (!teachesAny) {
                return false;
            }
        } else if (mode == DiscoveryMode.TEACH) {
            boolean learnsAny = candSkills.stream().anyMatch(s -> s.getRelationshipType() == SkillRelationshipType.LEARN);
            if (!learnsAny) {
                return false;
            }
        }

        // Search text constraint (case-insensitive across student name, bio, college, skills, category)
        if (filter.getSearch() != null && !filter.getSearch().trim().isEmpty()) {
            String query = filter.getSearch().trim().toLowerCase();
            boolean nameMatch = profile.getDisplayName().toLowerCase().contains(query);
            boolean bioMatch = profile.getBio() != null && profile.getBio().toLowerCase().contains(query);
            boolean collegeMatch = profile.getCollegeName().toLowerCase().contains(query);
            boolean departmentMatch = profile.getDepartment() != null && profile.getDepartment().toLowerCase().contains(query);

            boolean skillMatch = candSkills.stream().anyMatch(s ->
                    s.getSkill().getName().toLowerCase().contains(query) ||
                    (s.getSkill().getCategory() != null && s.getSkill().getCategory().getName().toLowerCase().contains(query))
            );

            if (!nameMatch && !bioMatch && !collegeMatch && !departmentMatch && !skillMatch) {
                return false;
            }
        }

        // Skill ID constraint
        if (filter.getSkillId() != null) {
            boolean hasSkill;
            if (mode == DiscoveryMode.LEARN) {
                hasSkill = candSkills.stream().anyMatch(s -> s.getSkill().getId().equals(filter.getSkillId()) && s.getRelationshipType() == SkillRelationshipType.TEACH);
            } else if (mode == DiscoveryMode.TEACH) {
                hasSkill = candSkills.stream().anyMatch(s -> s.getSkill().getId().equals(filter.getSkillId()) && s.getRelationshipType() == SkillRelationshipType.LEARN);
            } else {
                hasSkill = candSkills.stream().anyMatch(s -> s.getSkill().getId().equals(filter.getSkillId()));
            }

            if (!hasSkill) {
                return false;
            }
        }

        // Category ID constraint
        if (filter.getCategoryId() != null) {
            boolean hasCategory;
            if (mode == DiscoveryMode.LEARN) {
                hasCategory = candSkills.stream().anyMatch(s ->
                        s.getSkill().getCategory() != null &&
                        s.getSkill().getCategory().getId().equals(filter.getCategoryId()) &&
                        s.getRelationshipType() == SkillRelationshipType.TEACH
                );
            } else if (mode == DiscoveryMode.TEACH) {
                hasCategory = candSkills.stream().anyMatch(s ->
                        s.getSkill().getCategory() != null &&
                        s.getSkill().getCategory().getId().equals(filter.getCategoryId()) &&
                        s.getRelationshipType() == SkillRelationshipType.LEARN
                );
            } else {
                hasCategory = candSkills.stream().anyMatch(s ->
                        s.getSkill().getCategory() != null &&
                        s.getSkill().getCategory().getId().equals(filter.getCategoryId())
                );
            }

            if (!hasCategory) {
                return false;
            }
        }

        // Proficiency constraint
        if (filter.getProficiency() != null) {
            SkillProficiency targetProficiency = filter.getProficiency();
            boolean hasProficiency;
            if (mode == DiscoveryMode.LEARN) {
                hasProficiency = candSkills.stream().anyMatch(s ->
                        s.getRelationshipType() == SkillRelationshipType.TEACH &&
                        s.getProficiency() == targetProficiency
                );
            } else if (mode == DiscoveryMode.TEACH) {
                hasProficiency = candSkills.stream().anyMatch(s ->
                        s.getRelationshipType() == SkillRelationshipType.LEARN &&
                        s.getProficiency() == targetProficiency
                );
            } else {
                hasProficiency = candSkills.stream().anyMatch(s ->
                        s.getProficiency() == targetProficiency
                );
            }

            if (!hasProficiency) {
                return false;
            }
        }

        return true;
    }

    private void sortCandidates(List<DiscoveryCandidateDto> list, String sortParam) {
        String sort = (sortParam != null && !sortParam.trim().isEmpty()) ? sortParam.trim().toLowerCase() : "score,desc";

        Comparator<DiscoveryCandidateDto> comparator;
        if (sort.startsWith("displayname,asc") || sort.startsWith("name,asc")) {
            comparator = Comparator.comparing(c -> c.getCandidate().getDisplayName(), String.CASE_INSENSITIVE_ORDER);
        } else if (sort.startsWith("displayname,desc") || sort.startsWith("name,desc")) {
            comparator = Comparator.comparing((DiscoveryCandidateDto c) -> c.getCandidate().getDisplayName(), String.CASE_INSENSITIVE_ORDER).reversed();
        } else if (sort.startsWith("score,asc")) {
            comparator = Comparator.comparingInt(DiscoveryCandidateDto::getScore);
        } else if (sort.startsWith("createdat,desc") || sort.startsWith("newest")) {
            comparator = Comparator.comparing((DiscoveryCandidateDto c) -> c.getCandidate().getCreatedAt(), Comparator.nullsLast(Comparator.reverseOrder()));
        } else {
            // Default: score desc, then name asc
            comparator = Comparator.comparingInt(DiscoveryCandidateDto::getScore).reversed()
                    .thenComparing(c -> c.getCandidate().getDisplayName(), String.CASE_INSENSITIVE_ORDER);
        }

        list.sort(comparator);
    }
}
