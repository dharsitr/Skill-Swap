package com.skillswap.personalization.dto;

import java.time.Instant;
import java.util.UUID;

public record SearchHistoryDto(
        UUID id,
        String query,
        UUID categoryId,
        String categoryName,
        UUID skillId,
        String skillName,
        Instant searchedAt
) {
}
