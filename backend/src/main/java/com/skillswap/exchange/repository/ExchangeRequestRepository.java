package com.skillswap.exchange.repository;

import com.skillswap.exchange.entity.ExchangeRequest;
import com.skillswap.exchange.entity.ExchangeRequestStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExchangeRequestRepository extends JpaRepository<ExchangeRequest, UUID> {

    @Query("SELECT r FROM ExchangeRequest r JOIN FETCH r.requester JOIN FETCH r.recipient JOIN FETCH r.skill WHERE r.recipient.id = :recipientId")
    Page<ExchangeRequest> findByRecipientId(@Param("recipientId") UUID recipientId, Pageable pageable);

    @Query("SELECT r FROM ExchangeRequest r JOIN FETCH r.requester JOIN FETCH r.recipient JOIN FETCH r.skill WHERE r.recipient.id = :recipientId AND r.status = :status")
    Page<ExchangeRequest> findByRecipientIdAndStatus(@Param("recipientId") UUID recipientId, @Param("status") ExchangeRequestStatus status, Pageable pageable);

    @Query("SELECT r FROM ExchangeRequest r JOIN FETCH r.requester JOIN FETCH r.recipient JOIN FETCH r.skill WHERE r.requester.id = :requesterId")
    Page<ExchangeRequest> findByRequesterId(@Param("requesterId") UUID requesterId, Pageable pageable);

    @Query("SELECT r FROM ExchangeRequest r JOIN FETCH r.requester JOIN FETCH r.recipient JOIN FETCH r.skill WHERE r.requester.id = :requesterId AND r.status = :status")
    Page<ExchangeRequest> findByRequesterIdAndStatus(@Param("requesterId") UUID requesterId, @Param("status") ExchangeRequestStatus status, Pageable pageable);

    @Query("SELECT r FROM ExchangeRequest r JOIN FETCH r.requester JOIN FETCH r.recipient JOIN FETCH r.skill WHERE r.id = :id")
    Optional<ExchangeRequest> findByIdWithDetails(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM ExchangeRequest r WHERE r.id = :id")
    Optional<ExchangeRequest> findByIdForUpdate(@Param("id") UUID id);

    boolean existsByRequesterIdAndRecipientIdAndSkillIdAndStatus(
            UUID requesterId,
            UUID recipientId,
            UUID skillId,
            ExchangeRequestStatus status
    );
}
