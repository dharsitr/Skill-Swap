package com.skillswap.version.controller;

import com.skillswap.version.dto.AppVersionResponse;
import com.skillswap.version.service.VersionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/version")
@Tag(name = "Version", description = "Endpoints for checking API service and version metadata")
public class VersionController {

    private final VersionService versionService;

    public VersionController(VersionService versionService) {
        this.versionService = versionService;
    }

    @GetMapping
    @Operation(summary = "Get API version metadata", description = "Returns the name and semantic version of the SkillSwap backend API.")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Version metadata returned successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AppVersionResponse.class))
            )
    })
    public ResponseEntity<AppVersionResponse> getVersion() {
        return ResponseEntity.ok(versionService.getVersionInfo());
    }
}
