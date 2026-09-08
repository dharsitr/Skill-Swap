package com.skillswap.credit.dto;

import java.util.UUID;

public record SessionSettlementResponse(
        UUID sessionId,
        String status,
        int amount
) {
}
