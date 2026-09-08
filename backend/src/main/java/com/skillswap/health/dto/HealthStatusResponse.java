package com.skillswap.health.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Backend health status response")
public class HealthStatusResponse {

    @Schema(description = "System operational status", example = "UP")
    private String status;

    public HealthStatusResponse() {
    }

    public HealthStatusResponse(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
