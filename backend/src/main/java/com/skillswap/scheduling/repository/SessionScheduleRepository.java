package com.skillswap.scheduling.repository;

import com.skillswap.scheduling.entity.SessionSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionScheduleRepository extends JpaRepository<SessionSchedule, UUID> {

    Optional<SessionSchedule> findBySessionId(UUID sessionId);

    @Query("SELECT s FROM SessionSchedule s " +
           "JOIN s.session sess " +
           "WHERE (sess.teacher.id = :userId OR sess.learner.id = :userId) " +
           "AND sess.status IN ('SCHEDULED', 'IN_PROGRESS') " +
           "AND (:excludeSessionId IS NULL OR sess.id <> :excludeSessionId) " +
           "AND s.startAt < :endAt AND s.endAt > :startAt")
    List<SessionSchedule> findConflictingSchedulesForUser(
            @Param("userId") UUID userId,
            @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt,
            @Param("excludeSessionId") UUID excludeSessionId
    );

    @Query("SELECT s FROM SessionSchedule s " +
           "JOIN s.session sess " +
           "WHERE (sess.teacher.id = :userId OR sess.learner.id = :userId) " +
           "AND sess.status IN ('SCHEDULED', 'IN_PROGRESS') " +
           "ORDER BY s.startAt ASC")
    List<SessionSchedule> findUpcomingSchedulesForUser(@Param("userId") UUID userId);
}
