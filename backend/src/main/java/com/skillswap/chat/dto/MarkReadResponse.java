package com.skillswap.chat.dto;

import java.util.UUID;

public record MarkReadResponse(
        UUID conversationId,
        int markedCount
) {
}
