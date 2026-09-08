package com.skillswap.session.dto;

import com.skillswap.exchange.dto.ExchangeParticipantDto;
import com.skillswap.exchange.dto.ExchangeRequestSkillDto;
import com.skillswap.session.entity.SessionStatus;
import java.time.Instant;
import java.util.UUID;

public class SessionResponse {

    private UUID id;
    private UUID exchangeRequestId;
    private ExchangeParticipantDto teacher;
    private ExchangeParticipantDto learner;
    private ExchangeRequestSkillDto skill;
    private SessionStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public SessionResponse() {
    }

    public SessionResponse(
            UUID id,
            UUID exchangeRequestId,
            ExchangeParticipantDto teacher,
            ExchangeParticipantDto learner,
            ExchangeRequestSkillDto skill,
            SessionStatus status,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.exchangeRequestId = exchangeRequestId;
        this.teacher = teacher;
        this.learner = learner;
        this.skill = skill;
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

    public UUID getExchangeRequestId() {
        return exchangeRequestId;
    }

    public void setExchangeRequestId(UUID exchangeRequestId) {
        this.exchangeRequestId = exchangeRequestId;
    }

    public ExchangeParticipantDto getTeacher() {
        return teacher;
    }

    public void setTeacher(ExchangeParticipantDto teacher) {
        this.teacher = teacher;
    }

    public ExchangeParticipantDto getLearner() {
        return learner;
    }

    public void setLearner(ExchangeParticipantDto learner) {
        this.learner = learner;
    }

    public ExchangeRequestSkillDto getSkill() {
        return skill;
    }

    public void setSkill(ExchangeRequestSkillDto skill) {
        this.skill = skill;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
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
