package com.skillswap.discovery.controller;

import com.skillswap.common.response.PageResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.discovery.dto.DiscoveryCandidateDto;
import com.skillswap.discovery.dto.DiscoveryFilterRequest;
import com.skillswap.discovery.entity.DiscoveryMode;
import com.skillswap.discovery.service.DiscoveryService;
import com.skillswap.skill.entity.SkillProficiency;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/discover")
@Tag(name = "Discovery & Matching", description = "Endpoints for discovering student peers, searching by skill, and compatibility matching")
@SecurityRequirement(name = "BearerAuth")
public class DiscoveryController {

    private final DiscoveryService discoveryService;

    public DiscoveryController(DiscoveryService discoveryService) {
        this.discoveryService = discoveryService;
    }

    @GetMapping
    @Operation(
            summary = "Discover students",
            description = "Searches and filters active students based on teaching/learning skills, categories, proficiency, and calculates compatibility scores."
    )
    public ResponseEntity<PageResponse<DiscoveryCandidateDto>> discoverStudents(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(required = false) DiscoveryMode mode,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID skillId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) SkillProficiency proficiency,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "score,desc") String sort
    ) {
        DiscoveryFilterRequest filter = new DiscoveryFilterRequest(
                mode != null ? mode : DiscoveryMode.GENERAL,
                search,
                skillId,
                categoryId,
                proficiency,
                page,
                size,
                sort
        );

        PageResponse<DiscoveryCandidateDto> result = discoveryService.discoverCandidates(principal.getUserId(), filter);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/recommended")
    @Operation(
            summary = "Get recommended students",
            description = "Returns top recommended student peers ordered by matching compatibility score."
    )
    public ResponseEntity<PageResponse<DiscoveryCandidateDto>> getRecommendedStudents(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<DiscoveryCandidateDto> result = discoveryService.getRecommendedCandidates(principal.getUserId(), page, size);
        return ResponseEntity.ok(result);
    }
}
