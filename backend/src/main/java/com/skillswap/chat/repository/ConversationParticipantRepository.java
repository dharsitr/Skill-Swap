package com.skillswap.chat.repository;

import com.skillswap.chat.entity.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, UUID> {

    @Query("SELECT cp FROM ConversationParticipant cp JOIN FETCH cp.user WHERE cp.conversation.id = :conversationId")
    List<ConversationParticipant> findByConversationId(@Param("conversationId") UUID conversationId);

    @Query("SELECT cp FROM ConversationParticipant cp JOIN FETCH cp.user WHERE cp.conversation.id = :conversationId AND cp.user.id = :userId")
    Optional<ConversationParticipant> findByConversationIdAndUserId(
            @Param("conversationId") UUID conversationId,
            @Param("userId") UUID userId
    );

    boolean existsByConversationIdAndUserId(UUID conversationId, UUID userId);
}
