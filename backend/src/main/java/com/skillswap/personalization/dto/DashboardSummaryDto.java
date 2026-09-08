package com.skillswap.personalization.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DashboardSummaryDto(
        ProfileCompletionDto profileCompletion,
        List<RecommendedStudentDto> recommendedStudents,
        List<RecommendedSkillDto> recommendedSkills,
        RequestSummaryDto requestSummary,
        SessionSummaryDto sessionSummary,
        List<UserActivityDto> recentActivity,
        NotificationSummaryDto notificationSummary,
        List<RecentlyViewedProfileDto> recentlyViewed,
        List<SearchHistoryDto> recentSearches
) {
    public record RequestSummaryDto(
            long incomingPendingCount,
            long outgoingPendingCount,
            List<RecentRequestItemDto> recentRequests
    ) {}

    public record RecentRequestItemDto(
            UUID requestId,
            String type, // INCOMING or OUTGOING
            String counterpartName,
            String counterpartAvatarUrl,
            String skillName,
            String status,
            Instant createdAt
    ) {}

    public record SessionSummaryDto(
            long upcomingCount,
            long completedCount,
            UpcomingSessionItemDto nextSession
    ) {}

    public record UpcomingSessionItemDto(
            UUID sessionId,
            String counterpartName,
            String counterpartAvatarUrl,
            String skillName,
            String role, // TEACHER or LEARNER
            String status,
            Instant scheduledStartTime,
            Integer durationMinutes
    ) {}

    public record NotificationSummaryDto(
            long unreadCount
    ) {}
}
