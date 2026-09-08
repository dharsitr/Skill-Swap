package com.skillswap.personalization.service;

import com.skillswap.exchange.entity.ExchangeRequest;
import com.skillswap.exchange.entity.ExchangeRequestStatus;
import com.skillswap.exchange.repository.ExchangeRequestRepository;
import com.skillswap.notification.repository.NotificationRepository;
import com.skillswap.personalization.dto.*;
import com.skillswap.personalization.dto.DashboardSummaryDto.*;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.session.entity.Session;
import com.skillswap.session.entity.SessionStatus;
import com.skillswap.session.repository.SessionRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class DashboardService {

    private final ProfileCompletionService profileCompletionService;
    private final RecommendationService recommendationService;
    private final HistoryService historyService;
    private final UserActivityService userActivityService;
    private final ExchangeRequestRepository exchangeRequestRepository;
    private final SessionRepository sessionRepository;
    private final NotificationRepository notificationRepository;
    private final ProfileRepository profileRepository;

    public DashboardService(
            ProfileCompletionService profileCompletionService,
            RecommendationService recommendationService,
            HistoryService historyService,
            UserActivityService userActivityService,
            ExchangeRequestRepository exchangeRequestRepository,
            SessionRepository sessionRepository,
            NotificationRepository notificationRepository,
            ProfileRepository profileRepository
    ) {
        this.profileCompletionService = profileCompletionService;
        this.recommendationService = recommendationService;
        this.historyService = historyService;
        this.userActivityService = userActivityService;
        this.exchangeRequestRepository = exchangeRequestRepository;
        this.sessionRepository = sessionRepository;
        this.notificationRepository = notificationRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getDashboardSummary(UUID userId) {
        // 1. Profile Completion
        ProfileCompletionDto profileCompletion = profileCompletionService.calculateCompletion(userId);

        // 2. Recommendations
        List<RecommendedStudentDto> recommendedStudents = recommendationService.getRecommendedStudents(userId, 6);
        List<RecommendedSkillDto> recommendedSkills = recommendationService.getRecommendedSkills(userId, 6);

        // 3. Requests Summary
        long incomingPending = exchangeRequestRepository.findByRecipientIdAndStatus(
                userId, ExchangeRequestStatus.PENDING, PageRequest.of(0, 1)
        ).getTotalElements();

        long outgoingPending = exchangeRequestRepository.findByRequesterIdAndStatus(
                userId, ExchangeRequestStatus.PENDING, PageRequest.of(0, 1)
        ).getTotalElements();

        List<RecentRequestItemDto> recentRequests = new ArrayList<>();
        List<ExchangeRequest> inRequests = exchangeRequestRepository.findByRecipientId(userId, PageRequest.of(0, 3)).getContent();
        for (ExchangeRequest req : inRequests) {
            Profile senderProfile = profileRepository.findByUserId(req.getRequester().getId()).orElse(null);
            recentRequests.add(new RecentRequestItemDto(
                    req.getId(),
                    "INCOMING",
                    senderProfile != null ? senderProfile.getDisplayName() : "Peer",
                    senderProfile != null ? senderProfile.getAvatarUrl() : null,
                    req.getSkill() != null ? req.getSkill().getName() : "Skill",
                    req.getStatus().name(),
                    req.getCreatedAt()
            ));
        }

        List<ExchangeRequest> outRequests = exchangeRequestRepository.findByRequesterId(userId, PageRequest.of(0, 3)).getContent();
        for (ExchangeRequest req : outRequests) {
            Profile targetProfile = profileRepository.findByUserId(req.getRecipient().getId()).orElse(null);
            recentRequests.add(new RecentRequestItemDto(
                    req.getId(),
                    "OUTGOING",
                    targetProfile != null ? targetProfile.getDisplayName() : "Peer",
                    targetProfile != null ? targetProfile.getAvatarUrl() : null,
                    req.getSkill() != null ? req.getSkill().getName() : "Skill",
                    req.getStatus().name(),
                    req.getCreatedAt()
            ));
        }

        // 4. Session Summary
        long upcomingCount = sessionRepository.findByParticipantAndStatus(
                userId, SessionStatus.SCHEDULED, PageRequest.of(0, 1)
        ).getTotalElements();

        long completedCount = sessionRepository.findByParticipantAndStatus(
                userId, SessionStatus.COMPLETED, PageRequest.of(0, 1)
        ).getTotalElements();

        UpcomingSessionItemDto nextSession = null;
        List<Session> scheduledList = sessionRepository.findByParticipantAndStatus(
                userId, SessionStatus.SCHEDULED, PageRequest.of(0, 1)
        ).getContent();

        if (!scheduledList.isEmpty()) {
            Session s = scheduledList.get(0);
            boolean isTeacher = s.getTeacher().getId().equals(userId);
            UUID partnerId = isTeacher ? s.getLearner().getId() : s.getTeacher().getId();
            Profile partnerProfile = profileRepository.findByUserId(partnerId).orElse(null);

            nextSession = new UpcomingSessionItemDto(
                    s.getId(),
                    partnerProfile != null ? partnerProfile.getDisplayName() : "Peer",
                    partnerProfile != null ? partnerProfile.getAvatarUrl() : null,
                    s.getSkill() != null ? s.getSkill().getName() : "Skill",
                    isTeacher ? "TEACHER" : "LEARNER",
                    s.getStatus().name(),
                    s.getCreatedAt(),
                    60
            );
        }

        // 5. Activity
        List<UserActivityDto> recentActivity = userActivityService.getRecentActivity(userId, 6);

        // 6. Notifications
        long unreadNotifications = notificationRepository.countByRecipientIdAndIsReadFalse(userId);

        // 7. History
        List<RecentlyViewedProfileDto> recentlyViewed = historyService.getRecentlyViewedProfiles(userId, 6);
        List<SearchHistoryDto> recentSearches = historyService.getSearchHistory(userId, 5);

        return new DashboardSummaryDto(
                profileCompletion,
                recommendedStudents,
                recommendedSkills,
                new RequestSummaryDto(incomingPending, outgoingPending, recentRequests),
                new SessionSummaryDto(upcomingCount, completedCount, nextSession),
                recentActivity,
                new NotificationSummaryDto(unreadNotifications),
                recentlyViewed,
                recentSearches
        );
    }
}
