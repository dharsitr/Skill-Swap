package com.skillswap.personalization.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record RecordProfileViewRequest(
        @NotNull(message = "targetUserId is required")
        UUID targetUserId
) {
}
