package com.skillswap.safety.dto;

import com.skillswap.safety.entity.ReportStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateReportStatusRequest {

    @NotNull(message = "Status is required")
    private ReportStatus status;

    private String moderatorNotes;

    public UpdateReportStatusRequest() {}

    public UpdateReportStatusRequest(ReportStatus status, String moderatorNotes) {
        this.status = status;
        this.moderatorNotes = moderatorNotes;
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
}
