package com.skillswap.scheduling.dto;

import java.time.Instant;
import java.util.UUID;

public class SessionScheduleResponse {

    private UUID id;
    private UUID sessionId;
    private Instant startAt;
    private Instant endAt;
    private String timezone;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    public SessionScheduleResponse() {
    }

    public SessionScheduleResponse(
            UUID id,
            UUID sessionId,
            Instant startAt,
            Instant endAt,
            String timezone,
            String status,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.sessionId = sessionId;
        this.startAt = startAt;
        this.endAt = endAt;
        this.timezone = timezone;
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

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public Instant getStartAt() {
        return startAt;
    }

    public void setStartAt(Instant startAt) {
        this.startAt = startAt;
    }

    public Instant getEndAt() {
        return endAt;
    }

    public void setEndAt(Instant endAt) {
        this.endAt = endAt;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
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
