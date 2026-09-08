package com.skillswap.health.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Backend readiness probe response")
public class ReadinessResponse {

    @Schema(description = "Overall service readiness", example = "READY")
    private String status;

    @Schema(description = "Database connectivity probe", example = "UP")
    private String database;

    public ReadinessResponse() {
    }

    public ReadinessResponse(String status, String database) {
        this.status = status;
        this.database = database;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDatabase() {
        return database;
    }

    public void setDatabase(String database) {
        this.database = database;
    }
}
