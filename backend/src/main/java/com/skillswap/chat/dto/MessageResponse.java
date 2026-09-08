package com.skillswap.chat.dto;

import com.skillswap.chat.entity.Message;
import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID conversationId,
        UUID senderId,
        String senderName,
        String content,
        String clientMessageId,
        Instant readAt,
        Instant createdAt
) {
    public static MessageResponse from(Message message, String senderName) {
        return new MessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                senderName != null ? senderName : "Student",
                message.getContent(),
                message.getClientMessageId(),
                message.getReadAt(),
                message.getCreatedAt()
        );
    }
}
