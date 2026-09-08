package com.skillswap.credit.repository;

import com.skillswap.credit.entity.CreditTransaction;
import com.skillswap.credit.entity.CreditTransactionDirection;
import com.skillswap.credit.entity.CreditTransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, UUID> {

    @Query("SELECT t FROM CreditTransaction t WHERE t.user.id = :userId ORDER BY t.createdAt DESC")
    Page<CreditTransaction> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    Optional<CreditTransaction> findByIdAndUserId(UUID id, UUID userId);

    boolean existsBySessionId(UUID sessionId);

    boolean existsBySessionIdAndType(UUID sessionId, CreditTransactionType type);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM CreditTransaction t WHERE t.wallet.id = :walletId AND t.direction = :direction")
    int sumAmountByWalletIdAndDirection(
            @Param("walletId") UUID walletId,
            @Param("direction") CreditTransactionDirection direction
    );
}
