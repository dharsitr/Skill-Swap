package com.skillswap.credit.repository;

import com.skillswap.credit.entity.CreditWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CreditWalletRepository extends JpaRepository<CreditWallet, UUID> {

    Optional<CreditWallet> findByUserId(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM CreditWallet w WHERE w.user.id = :userId")
    Optional<CreditWallet> findByUserIdForUpdate(@Param("userId") UUID userId);
}
