package com.skillswap.chat.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateConversationRequest(
        @NotNull(message = "Target user ID is required")
        UUID userId
) {
}
