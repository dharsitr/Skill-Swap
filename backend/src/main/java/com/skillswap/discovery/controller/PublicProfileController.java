package com.skillswap.discovery.controller;

import com.skillswap.discovery.dto.PublicProfileDto;
import com.skillswap.discovery.service.PublicProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Public Profiles", description = "Endpoints for viewing safe public student profiles and skills")
@SecurityRequirement(name = "BearerAuth")
public class PublicProfileController {

    private final PublicProfileService publicProfileService;

    public PublicProfileController(PublicProfileService publicProfileService) {
        this.publicProfileService = publicProfileService;
    }

    @GetMapping("/{id}/public-profile")
    @Operation(
            summary = "Get student public profile",
            description = "Returns safe public profile information, college affiliation, teaching skills, and learning skills for a student."
    )
    public ResponseEntity<PublicProfileDto> getPublicProfile(@PathVariable UUID id) {
        PublicProfileDto profile = publicProfileService.getPublicProfileByUserId(id);
        return ResponseEntity.ok(profile);
    }
}
