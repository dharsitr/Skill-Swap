package com.skillswap.safety.repository;

import com.skillswap.safety.entity.Dispute;
import com.skillswap.safety.entity.DisputeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {

    Page<Dispute> findByCreatedByIdOrderByCreatedAtDesc(UUID createdById, Pageable pageable);

    List<Dispute> findBySessionId(UUID sessionId);

    Optional<Dispute> findBySessionIdAndCreatedById(UUID sessionId, UUID createdById);

    boolean existsBySessionIdAndCreatedById(UUID sessionId, UUID createdById);

    Page<Dispute> findByStatusOrderByCreatedAtDesc(DisputeStatus status, Pageable pageable);

    Page<Dispute> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
