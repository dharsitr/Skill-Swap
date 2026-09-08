package com.skillswap.version.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Backend application version information")
public class AppVersionResponse {

    @Schema(description = "Application name", example = "SkillSwap API")
    private String name;

    @Schema(description = "Application version string", example = "0.1.0")
    private String version;

    public AppVersionResponse() {
    }

    public AppVersionResponse(String name, String version) {
        this.name = name;
        this.version = version;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }
}
