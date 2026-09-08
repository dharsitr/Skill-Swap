package com.skillswap.safety.dto;

import com.skillswap.profile.entity.Profile;
import com.skillswap.safety.entity.Report;
import com.skillswap.safety.entity.ReportReason;
import com.skillswap.safety.entity.ReportStatus;

import java.time.Instant;
import java.util.UUID;

public class ReportResponse {

    private UUID id;
    private UUID reportedUserId;
    private String reportedUserName;
    private UUID sessionId;
    private ReportReason reason;
    private String description;
    private ReportStatus status;
    private Instant createdAt;

    public ReportResponse() {}

    public ReportResponse(
            UUID id,
            UUID reportedUserId,
            String reportedUserName,
            UUID sessionId,
            ReportReason reason,
            String description,
            ReportStatus status,
            Instant createdAt
    ) {
        this.id = id;
        this.reportedUserId = reportedUserId;
        this.reportedUserName = reportedUserName;
        this.sessionId = sessionId;
        this.reason = reason;
        this.description = description;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static ReportResponse fromEntity(Report report, Profile reportedProfile) {
        String name = reportedProfile != null ? reportedProfile.getDisplayName() : "Student";
        UUID sessId = report.getSession() != null ? report.getSession().getId() : null;

        return new ReportResponse(
                report.getId(),
                report.getReportedUser().getId(),
                name,
                sessId,
                report.getReason(),
                report.getDescription(),
                report.getStatus(),
                report.getCreatedAt()
        );
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getReportedUserId() {
        return reportedUserId;
    }

    public void setReportedUserId(UUID reportedUserId) {
        this.reportedUserId = reportedUserId;
    }

    public String getReportedUserName() {
        return reportedUserName;
    }

    public void setReportedUserName(String reportedUserName) {
        this.reportedUserName = reportedUserName;
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

    public ReportStatus getStatus() {
        return status;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
