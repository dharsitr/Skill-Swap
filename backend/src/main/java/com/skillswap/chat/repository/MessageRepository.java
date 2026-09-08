package com.skillswap.chat.repository;

import com.skillswap.chat.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("SELECT m FROM Message m JOIN FETCH m.sender WHERE m.conversation.id = :conversationId ORDER BY m.createdAt ASC")
    List<Message> findByConversationIdOrderByCreatedAtAsc(@Param("conversationId") UUID conversationId);

    @Query(
            value = "SELECT m FROM Message m JOIN FETCH m.sender WHERE m.conversation.id = :conversationId ORDER BY m.createdAt DESC",
            countQuery = "SELECT count(m) FROM Message m WHERE m.conversation.id = :conversationId"
    )
    Page<Message> findByConversationIdOrderByCreatedAtDesc(
            @Param("conversationId") UUID conversationId,
            Pageable pageable
    );

    @Query("SELECT m FROM Message m JOIN FETCH m.sender WHERE m.conversation.id = :conversationId ORDER BY m.createdAt DESC LIMIT 1")
    Optional<Message> findLatestMessageByConversationId(@Param("conversationId") UUID conversationId);

    Optional<Message> findByConversationIdAndClientMessageId(UUID conversationId, String clientMessageId);

    boolean existsByConversationIdAndClientMessageId(UUID conversationId, String clientMessageId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId AND m.sender.id != :userId AND m.readAt IS NULL")
    long countUnreadMessagesByConversationAndUser(
            @Param("conversationId") UUID conversationId,
            @Param("userId") UUID userId
    );

    @Query("SELECT COUNT(m) FROM Message m JOIN m.conversation c WHERE (c.participantOne.id = :userId OR c.participantTwo.id = :userId) AND m.sender.id != :userId AND m.readAt IS NULL")
    long countTotalUnreadMessagesByUser(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE Message m SET m.readAt = :now WHERE m.conversation.id = :conversationId AND m.sender.id != :userId AND m.readAt IS NULL")
    int markUnreadMessagesAsRead(
            @Param("conversationId") UUID conversationId,
            @Param("userId") UUID userId,
            @Param("now") Instant now
    );
}
