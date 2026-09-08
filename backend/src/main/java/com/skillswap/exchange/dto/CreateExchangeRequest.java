package com.skillswap.exchange.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public class CreateExchangeRequest {

    @NotNull(message = "Recipient ID is required")
    private UUID recipientId;

    @NotNull(message = "Skill ID is required")
    private UUID skillId;

    @Size(max = 500, message = "Message cannot exceed 500 characters")
    private String message;

    public CreateExchangeRequest() {
    }

    public CreateExchangeRequest(UUID recipientId, UUID skillId, String message) {
        this.recipientId = recipientId;
        this.skillId = skillId;
        this.message = message;
    }

    public UUID getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(UUID recipientId) {
        this.recipientId = recipientId;
    }

    public UUID getSkillId() {
        return skillId;
    }

    public void setSkillId(UUID skillId) {
        this.skillId = skillId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
