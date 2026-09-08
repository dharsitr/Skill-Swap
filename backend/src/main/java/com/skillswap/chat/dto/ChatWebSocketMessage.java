package com.skillswap.chat.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChatWebSocketMessage(
        String type,
        UUID conversationId,
        UUID userId,
        String content,
        String clientMessageId,
        UUID messageId,
        List<UUID> messageIds,
        MessageResponse message,
        String code,
        String error
) {
    public static ChatWebSocketMessage messageCreated(MessageResponse message) {
        return new ChatWebSocketMessage(
                "MESSAGE_CREATED",
                message.conversationId(),
                message.senderId(),
                null,
                null,
                message.id(),
                null,
                message,
                null,
                null
        );
    }

    public static ChatWebSocketMessage messageAck(String clientMessageId, UUID messageId) {
        return new ChatWebSocketMessage(
                "MESSAGE_ACK",
                null,
                null,
                null,
                clientMessageId,
                messageId,
                null,
                null,
                null,
                null
        );
    }

    public static ChatWebSocketMessage messageRead(UUID conversationId, List<UUID> messageIds) {
        return new ChatWebSocketMessage(
                "MESSAGE_READ",
                conversationId,
                null,
                null,
                null,
                null,
                messageIds,
                null,
                null,
                null
        );
    }

    public static ChatWebSocketMessage typing(String type, UUID conversationId) {
        return new ChatWebSocketMessage(
                type,
                conversationId,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    public static ChatWebSocketMessage typing(String type, UUID conversationId, UUID userId) {
        return new ChatWebSocketMessage(
                type,
                conversationId,
                userId,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    public static ChatWebSocketMessage error(String code, String message) {
        return new ChatWebSocketMessage(
                "ERROR",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                code,
                message
        );
    }
}
