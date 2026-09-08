package com.skillswap.safety.dto;

import com.skillswap.safety.entity.DisputeReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class CreateDisputeRequest {

    @NotNull(message = "Session ID is required")
    private UUID sessionId;

    @NotNull(message = "Dispute reason is required")
    private DisputeReason reason;

    @NotBlank(message = "Dispute description is required")
    @Size(max = 2000, message = "Dispute description cannot exceed 2000 characters")
    private String description;

    public CreateDisputeRequest() {}

    public CreateDisputeRequest(UUID sessionId, DisputeReason reason, String description) {
        this.sessionId = sessionId;
        this.reason = reason;
        this.description = description;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
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
}
