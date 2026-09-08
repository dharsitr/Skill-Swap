package com.skillswap.scheduling.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public class ScheduleSessionRequest {

    @NotNull(message = "Start time is required")
    @Schema(description = "Session start time in UTC", example = "2026-09-10T14:00:00Z")
    private Instant startAt;

    @NotNull(message = "End time is required")
    @Schema(description = "Session end time in UTC", example = "2026-09-10T15:00:00Z")
    private Instant endAt;

    @Schema(description = "Timezone string", example = "America/New_York")
    private String timezone = "UTC";

    public ScheduleSessionRequest() {
    }

    public ScheduleSessionRequest(Instant startAt, Instant endAt, String timezone) {
        this.startAt = startAt;
        this.endAt = endAt;
        this.timezone = timezone != null ? timezone : "UTC";
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
}
