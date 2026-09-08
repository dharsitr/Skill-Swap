package com.skillswap.personalization.dto;

import java.util.List;

public record ProfileCompletionDto(
        int completionPercentage,
        boolean isComplete,
        List<MissingProfileFieldDto> missingFields
) {
    public record MissingProfileFieldDto(
            String fieldKey,
            String label,
            String actionUrl,
            int weight
    ) {}
}
