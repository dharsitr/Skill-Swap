package com.skillswap.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
        @NotBlank(message = "Message content cannot be blank")
        @Size(max = 2000, message = "Message cannot exceed 2000 characters")
        String content,

        @Size(max = 100, message = "Client message ID cannot exceed 100 characters")
        String clientMessageId
) {
}
