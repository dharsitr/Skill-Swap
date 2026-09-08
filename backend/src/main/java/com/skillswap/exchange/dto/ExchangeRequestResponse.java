package com.skillswap.exchange.dto;

import com.skillswap.exchange.entity.ExchangeRequestStatus;
import java.time.Instant;
import java.util.UUID;

public class ExchangeRequestResponse {

    private UUID id;
    private ExchangeParticipantDto requester;
    private ExchangeParticipantDto recipient;
    private ExchangeRequestSkillDto skill;
    private String message;
    private ExchangeRequestStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public ExchangeRequestResponse() {
    }

    public ExchangeRequestResponse(
            UUID id,
            ExchangeParticipantDto requester,
            ExchangeParticipantDto recipient,
            ExchangeRequestSkillDto skill,
            String message,
            ExchangeRequestStatus status,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.requester = requester;
        this.recipient = recipient;
        this.skill = skill;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public ExchangeParticipantDto getRequester() {
        return requester;
    }

    public void setRequester(ExchangeParticipantDto requester) {
        this.requester = requester;
    }

    public ExchangeParticipantDto getRecipient() {
        return recipient;
    }

    public void setRecipient(ExchangeParticipantDto recipient) {
        this.recipient = recipient;
    }

    public ExchangeRequestSkillDto getSkill() {
        return skill;
    }

    public void setSkill(ExchangeRequestSkillDto skill) {
        this.skill = skill;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public ExchangeRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ExchangeRequestStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
