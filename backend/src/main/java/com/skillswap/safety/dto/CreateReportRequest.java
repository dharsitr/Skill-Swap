package com.skillswap.safety.dto;

import com.skillswap.safety.entity.ReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class CreateReportRequest {

    @NotNull(message = "Reported user ID is required")
    private UUID reportedUserId;

    private UUID sessionId;

    @NotNull(message = "Report reason is required")
    private ReportReason reason;

    @Size(max = 2000, message = "Report description cannot exceed 2000 characters")
    private String description;

    public CreateReportRequest() {}

    public CreateReportRequest(UUID reportedUserId, UUID sessionId, ReportReason reason, String description) {
        this.reportedUserId = reportedUserId;
        this.sessionId = sessionId;
        this.reason = reason;
        this.description = description;
    }

    public UUID getReportedUserId() {
        return reportedUserId;
    }

    public void setReportedUserId(UUID reportedUserId) {
        this.reportedUserId = reportedUserId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public ReportReason getReason() {
        return reason;
    }

    public void setReason(ReportReason reason) {
        this.reason = reason;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
