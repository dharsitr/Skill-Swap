package com.skillswap.personalization.dto;

import java.util.List;
import java.util.UUID;

public record RecommendedStudentDto(
        UUID userId,
        String displayName,
        String avatarUrl,
        String collegeName,
        String department,
        String yearOfStudy,
        double matchScore,
        List<SkillSummaryDto> teachingSkills,
        List<SkillSummaryDto> learningSkills,
        String recommendationReasonType,
        String recommendationReason,
        List<String> matchHighlights
) {
    public record SkillSummaryDto(
            UUID id,
            String name,
            String categoryName,
            String proficiency,
            String relationshipType
    ) {}
}
