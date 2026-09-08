package com.skillswap.availability.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.LocalTime;

public class CreateAvailabilityRequest {

    @NotNull(message = "Day of week is required")
    @Schema(description = "Day of the week", example = "MONDAY")
    private DayOfWeek dayOfWeek;

    @NotNull(message = "Start time is required")
    @JsonFormat(pattern = "HH:mm[:ss]")
    @Schema(description = "Slot start time (HH:mm or HH:mm:ss)", example = "09:00")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    @JsonFormat(pattern = "HH:mm[:ss]")
    @Schema(description = "Slot end time (HH:mm or HH:mm:ss)", example = "12:00")
    private LocalTime endTime;

    @Schema(description = "User timezone", example = "America/New_York")
    private String timezone = "UTC";

    @Schema(description = "Whether slot is active", example = "true")
    private Boolean active = true;

    public CreateAvailabilityRequest() {
    }

    public CreateAvailabilityRequest(
            DayOfWeek dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            String timezone,
            Boolean active
    ) {
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.timezone = timezone;
        this.active = active != null ? active : true;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(DayOfWeek dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
