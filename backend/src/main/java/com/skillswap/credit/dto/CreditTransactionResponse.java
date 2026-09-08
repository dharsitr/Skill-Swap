package com.skillswap.credit.dto;

import com.skillswap.credit.entity.CreditTransaction;
import com.skillswap.credit.entity.CreditTransactionDirection;
import com.skillswap.credit.entity.CreditTransactionType;
import java.time.Instant;
import java.util.UUID;

public record CreditTransactionResponse(
        UUID id,
        UUID walletId,
        UUID userId,
        int amount,
        CreditTransactionDirection direction,
        CreditTransactionType type,
        UUID sessionId,
        String description,
        Instant createdAt
) {
    public static CreditTransactionResponse from(CreditTransaction transaction) {
        return new CreditTransactionResponse(
                transaction.getId(),
                transaction.getWallet().getId(),
                transaction.getUser().getId(),
                transaction.getAmount(),
                transaction.getDirection(),
                transaction.getType(),
                transaction.getSession() != null ? transaction.getSession().getId() : null,
                transaction.getDescription(),
                transaction.getCreatedAt()
        );
    }
}
