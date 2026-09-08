package com.skillswap.personalization.controller;

import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.personalization.dto.RecommendedSkillDto;
import com.skillswap.personalization.dto.RecommendedStudentDto;
import com.skillswap.personalization.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@Tag(name = "Personalization & Recommendations", description = "Endpoints for personalized student and skill recommendations")
@SecurityRequirement(name = "BearerAuth")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/students")
    @Operation(
            summary = "Get recommended students",
            description = "Returns ranked student peer recommendations based on skill compatibility, search history, and college affiliation."
    )
    public ResponseEntity<List<RecommendedStudentDto>> getRecommendedStudents(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<RecommendedStudentDto> recommendations = recommendationService.getRecommendedStudents(principal.getUserId(), limit);
        return ResponseEntity.ok(recommendations);
    }

    @GetMapping("/skills")
    @Operation(
            summary = "Get recommended skills",
            description = "Returns skill recommendations based on user interests, related categories, and campus trends."
    )
    public ResponseEntity<List<RecommendedSkillDto>> getRecommendedSkills(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<RecommendedSkillDto> skills = recommendationService.getRecommendedSkills(principal.getUserId(), limit);
        return ResponseEntity.ok(skills);
    }
}
