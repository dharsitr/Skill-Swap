package com.skillswap.personalization.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record RecordSearchRequest(
        @NotBlank(message = "query cannot be blank")
        String query,
        UUID categoryId,
        UUID skillId
) {
}
