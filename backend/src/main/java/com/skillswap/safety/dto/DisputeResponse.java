package com.skillswap.safety.dto;

import com.skillswap.profile.entity.Profile;
import com.skillswap.safety.entity.Dispute;
import com.skillswap.safety.entity.DisputeReason;
import com.skillswap.safety.entity.DisputeStatus;

import java.time.Instant;
import java.util.UUID;

public class DisputeResponse {

    private UUID id;
    private UUID sessionId;
    private String skillName;
    private UUID createdById;
    private String createdByName;
    private DisputeReason reason;
    private String description;
    private DisputeStatus status;
    private Instant createdAt;

    public DisputeResponse() {}

    public DisputeResponse(
            UUID id,
            UUID sessionId,
            String skillName,
            UUID createdById,
            String createdByName,
            DisputeReason reason,
            String description,
            DisputeStatus status,
            Instant createdAt
    ) {
        this.id = id;
        this.sessionId = sessionId;
        this.skillName = skillName;
        this.createdById = createdById;
        this.createdByName = createdByName;
        this.reason = reason;
        this.description = description;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static DisputeResponse fromEntity(Dispute dispute, Profile creatorProfile) {
        String name = creatorProfile != null ? creatorProfile.getDisplayName() : "Student";
        String skill = dispute.getSession() != null && dispute.getSession().getSkill() != null
                ? dispute.getSession().getSkill().getName()
                : null;

        return new DisputeResponse(
                dispute.getId(),
                dispute.getSession().getId(),
                skill,
                dispute.getCreatedBy().getId(),
                name,
                dispute.getReason(),
                dispute.getDescription(),
                dispute.getStatus(),
                dispute.getCreatedAt()
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
