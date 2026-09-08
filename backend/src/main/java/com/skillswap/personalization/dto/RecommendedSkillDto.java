package com.skillswap.personalization.dto;

import java.util.UUID;

public record RecommendedSkillDto(
        UUID id,
        String name,
        UUID categoryId,
        String categoryName,
        String description,
        String recommendationReasonType,
        String recommendationReason
) {
}
