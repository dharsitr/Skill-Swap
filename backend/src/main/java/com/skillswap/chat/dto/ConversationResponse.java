package com.skillswap.chat.dto;

import com.skillswap.chat.entity.Conversation;
import java.time.Instant;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        ConversationParticipantDto otherParticipant,
        MessageResponse lastMessage,
        Instant lastMessageAt,
        long unreadCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static ConversationResponse of(
            Conversation conversation,
            ConversationParticipantDto otherParticipant,
            MessageResponse lastMessage,
            long unreadCount
    ) {
        return new ConversationResponse(
                conversation.getId(),
                otherParticipant,
                lastMessage,
                conversation.getLastMessageAt(),
                unreadCount,
                conversation.getCreatedAt(),
                conversation.getUpdatedAt()
        );
    }
}
