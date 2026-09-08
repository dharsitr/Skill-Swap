package com.skillswap.chat.repository;

import com.skillswap.chat.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c JOIN FETCH c.participantOne JOIN FETCH c.participantTwo WHERE (c.participantOne.id = :p1 AND c.participantTwo.id = :p2) OR (c.participantOne.id = :p2 AND c.participantTwo.id = :p1)")
    Optional<Conversation> findByParticipantIds(@Param("p1") UUID p1, @Param("p2") UUID p2);

    @Query("SELECT c FROM Conversation c JOIN FETCH c.participantOne JOIN FETCH c.participantTwo WHERE c.participantOne.id = :userId OR c.participantTwo.id = :userId")
    Page<Conversation> findByParticipantId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT c FROM Conversation c JOIN FETCH c.participantOne JOIN FETCH c.participantTwo WHERE c.id = :id")
    Optional<Conversation> findByIdWithParticipants(@Param("id") UUID id);
}
