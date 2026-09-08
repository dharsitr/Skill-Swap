package com.skillswap.safety.dto;

import com.skillswap.profile.entity.Profile;
import com.skillswap.safety.entity.Report;
import com.skillswap.safety.entity.ReportReason;
import com.skillswap.safety.entity.ReportStatus;

import java.time.Instant;
import java.util.UUID;

public class ModerationReportDetailResponse {

    private UUID id;
    private UUID reporterId;
    private String reporterName;
    private UUID reportedUserId;
    private String reportedUserName;
    private UUID sessionId;
    private String sessionSkillName;
    private ReportReason reason;
    private String description;
    private ReportStatus status;
    private String moderatorNotes;
    private UUID resolvedById;
    private Instant resolvedAt;
    private Instant createdAt;
    private Instant updatedAt;

    public ModerationReportDetailResponse() {}

    public ModerationReportDetailResponse(
            UUID id,
            UUID reporterId,
            String reporterName,
            UUID reportedUserId,
            String reportedUserName,
            UUID sessionId,
            String sessionSkillName,
            ReportReason reason,
            String description,
            ReportStatus status,
            String moderatorNotes,
            UUID resolvedById,
            Instant resolvedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.reporterId = reporterId;
        this.reporterName = reporterName;
        this.reportedUserId = reportedUserId;
        this.reportedUserName = reportedUserName;
        this.sessionId = sessionId;
        this.sessionSkillName = sessionSkillName;
        this.reason = reason;
        this.description = description;
        this.status = status;
        this.moderatorNotes = moderatorNotes;
        this.resolvedById = resolvedById;
        this.resolvedAt = resolvedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ModerationReportDetailResponse fromEntity(Report report, Profile reporterProfile, Profile reportedProfile) {
        String reporterName = reporterProfile != null ? reporterProfile.getDisplayName() : "Student";
        String reportedName = reportedProfile != null ? reportedProfile.getDisplayName() : "Student";
        UUID sessId = report.getSession() != null ? report.getSession().getId() : null;
        String skillName = report.getSession() != null && report.getSession().getSkill() != null
                ? report.getSession().getSkill().getName()
                : null;
        UUID resolvedById = report.getResolvedBy() != null ? report.getResolvedBy().getId() : null;

        return new ModerationReportDetailResponse(
                report.getId(),
                report.getReporter().getId(),
                reporterName,
                report.getReportedUser().getId(),
                reportedName,
                sessId,
                skillName,
                report.getReason(),
                report.getDescription(),
                report.getStatus(),
                report.getModeratorNotes(),
                resolvedById,
                report.getResolvedAt(),
                report.getCreatedAt(),
                report.getUpdatedAt()
        );
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getReporterId() {
        return reporterId;
    }

    public void setReporterId(UUID reporterId) {
        this.reporterId = reporterId;
    }

    public String getReporterName() {
        return reporterName;
    }

    public void setReporterName(String reporterName) {
        this.reporterName = reporterName;
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

    public String getSessionSkillName() {
        return sessionSkillName;
    }

    public void setSessionSkillName(String sessionSkillName) {
        this.sessionSkillName = sessionSkillName;
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

    public String getModeratorNotes() {
        return moderatorNotes;
    }

    public void setModeratorNotes(String moderatorNotes) {
        this.moderatorNotes = moderatorNotes;
    }

    public UUID getResolvedById() {
        return resolvedById;
    }

    public void setResolvedById(UUID resolvedById) {
        this.resolvedById = resolvedById;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
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
