package com.skillswap.session.repository;

import com.skillswap.session.entity.Session;
import com.skillswap.session.entity.SessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    @Query("SELECT s FROM Session s JOIN FETCH s.teacher JOIN FETCH s.learner JOIN FETCH s.skill WHERE s.teacher.id = :userId OR s.learner.id = :userId")
    Page<Session> findByParticipant(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT s FROM Session s JOIN FETCH s.teacher JOIN FETCH s.learner JOIN FETCH s.skill WHERE (s.teacher.id = :userId OR s.learner.id = :userId) AND s.status = :status")
    Page<Session> findByParticipantAndStatus(
            @Param("userId") UUID userId,
            @Param("status") SessionStatus status,
            Pageable pageable
    );

    @Query("SELECT s FROM Session s JOIN FETCH s.teacher JOIN FETCH s.learner JOIN FETCH s.skill WHERE s.id = :id")
    Optional<Session> findByIdWithDetails(@Param("id") UUID id);

    boolean existsByExchangeRequestId(UUID exchangeRequestId);
}
