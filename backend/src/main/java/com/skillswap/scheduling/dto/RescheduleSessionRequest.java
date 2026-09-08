package com.skillswap.scheduling.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public class RescheduleSessionRequest {

    @NotNull(message = "New start time is required")
    @Schema(description = "New session start time in UTC", example = "2026-09-12T16:00:00Z")
    private Instant startAt;

    @NotNull(message = "New end time is required")
    @Schema(description = "New session end time in UTC", example = "2026-09-12T17:00:00Z")
    private Instant endAt;

    @Schema(description = "Timezone string", example = "America/New_York")
    private String timezone = "UTC";

    @Schema(description = "Optional reason for rescheduling", example = "Conflict with midterm exam")
    private String reason;

    public RescheduleSessionRequest() {
    }

    public RescheduleSessionRequest(Instant startAt, Instant endAt, String timezone, String reason) {
        this.startAt = startAt;
        this.endAt = endAt;
        this.timezone = timezone != null ? timezone : "UTC";
        this.reason = reason;
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

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
