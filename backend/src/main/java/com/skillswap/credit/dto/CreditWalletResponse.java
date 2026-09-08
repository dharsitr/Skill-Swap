package com.skillswap.credit.dto;

import com.skillswap.credit.entity.CreditWallet;
import java.time.Instant;
import java.util.UUID;

public record CreditWalletResponse(
        UUID id,
        UUID userId,
        int balance,
        Instant createdAt,
        Instant updatedAt
) {
    public static CreditWalletResponse from(CreditWallet wallet) {
        return new CreditWalletResponse(
                wallet.getId(),
                wallet.getUser().getId(),
                wallet.getBalance(),
                wallet.getCreatedAt(),
                wallet.getUpdatedAt()
        );
    }
}
