package com.skillswap.safety.dto;

import com.skillswap.profile.entity.Profile;
import com.skillswap.safety.entity.Dispute;
import com.skillswap.safety.entity.DisputeReason;
import com.skillswap.safety.entity.DisputeStatus;

import java.time.Instant;
import java.util.UUID;

public class ModerationDisputeDetailResponse {

    private UUID id;
    private UUID sessionId;
    private String skillName;
    private UUID teacherId;
    private String teacherName;
    private UUID learnerId;
    private String learnerName;
    private UUID createdById;
    private String createdByName;
    private DisputeReason reason;
    private String description;
    private DisputeStatus status;
    private String moderatorNotes;
    private UUID resolvedById;
    private Instant resolvedAt;
    private Instant createdAt;
    private Instant updatedAt;

    public ModerationDisputeDetailResponse() {}

    public ModerationDisputeDetailResponse(
            UUID id,
            UUID sessionId,
            String skillName,
            UUID teacherId,
            String teacherName,
            UUID learnerId,
            String learnerName,
            UUID createdById,
            String createdByName,
            DisputeReason reason,
            String description,
            DisputeStatus status,
            String moderatorNotes,
            UUID resolvedById,
            Instant resolvedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.sessionId = sessionId;
        this.skillName = skillName;
        this.teacherId = teacherId;
        this.teacherName = teacherName;
        this.learnerId = learnerId;
        this.learnerName = learnerName;
        this.createdById = createdById;
        this.createdByName = createdByName;
        this.reason = reason;
        this.description = description;
        this.status = status;
        this.moderatorNotes = moderatorNotes;
        this.resolvedById = resolvedById;
        this.resolvedAt = resolvedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static ModerationDisputeDetailResponse fromEntity(
            Dispute dispute,
            Profile teacherProfile,
            Profile learnerProfile,
            Profile creatorProfile
    ) {
        String teacherName = teacherProfile != null ? teacherProfile.getDisplayName() : "Teacher";
        String learnerName = learnerProfile != null ? learnerProfile.getDisplayName() : "Learner";
        String creatorName = creatorProfile != null ? creatorProfile.getDisplayName() : "Student";
        String skill = dispute.getSession() != null && dispute.getSession().getSkill() != null
                ? dispute.getSession().getSkill().getName()
                : null;
        UUID resolvedById = dispute.getResolvedBy() != null ? dispute.getResolvedBy().getId() : null;

        return new ModerationDisputeDetailResponse(
                dispute.getId(),
                dispute.getSession().getId(),
                skill,
                dispute.getSession().getTeacher().getId(),
                teacherName,
                dispute.getSession().getLearner().getId(),
                learnerName,
                dispute.getCreatedBy().getId(),
                creatorName,
                dispute.getReason(),
                dispute.getDescription(),
                dispute.getStatus(),
                dispute.getModeratorNotes(),
                resolvedById,
                dispute.getResolvedAt(),
                dispute.getCreatedAt(),
                dispute.getUpdatedAt()
        );
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

    public String getSkillName() {
        return skillName;
    }

    public void setSkillName(String skillName) {
        this.skillName = skillName;
    }

    public UUID getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(UUID teacherId) {
        this.teacherId = teacherId;
    }

    public String getTeacherName() {
        return teacherName;
    }

    public void setTeacherName(String teacherName) {
        this.teacherName = teacherName;
    }

    public UUID getLearnerId() {
        return learnerId;
    }

    public void setLearnerId(UUID learnerId) {
        this.learnerId = learnerId;
    }

    public String getLearnerName() {
        return learnerName;
    }

    public void setLearnerName(String learnerName) {
        this.learnerName = learnerName;
    }

    public UUID getCreatedById() {
        return createdById;
    }

    public void setCreatedById(UUID createdById) {
        this.createdById = createdById;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public DisputeReason getReason() {
        return reason;
    }

    public void setReason(DisputeReason reason) {
        this.reason = reason;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public DisputeStatus getStatus() {
        return status;
    }

    public void setStatus(DisputeStatus status) {
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
