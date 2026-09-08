package com.skillswap.safety.dto;

import com.skillswap.safety.entity.DisputeStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateDisputeStatusRequest {

    @NotNull(message = "Status is required")
    private DisputeStatus status;

    private String moderatorNotes;

    public UpdateDisputeStatusRequest() {}

    public UpdateDisputeStatusRequest(DisputeStatus status, String moderatorNotes) {
        this.status = status;
        this.moderatorNotes = moderatorNotes;
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
}
