package com.skillswap.skill.controller;

import com.skillswap.common.response.ApiResponse;
import com.skillswap.common.security.AuthenticatedUserPrincipal;
import com.skillswap.skill.dto.CreateUserSkillRequest;
import com.skillswap.skill.dto.UpdateUserSkillRequest;
import com.skillswap.skill.dto.UserSkillProfileResponse;
import com.skillswap.skill.dto.UserSkillResponse;
import com.skillswap.skill.service.UserSkillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profile/me/skills")
@Tag(name = "User Skill Profile", description = "Endpoints for managing the authenticated student's teaching and learning skills")
@SecurityRequirement(name = "BearerAuth")
public class UserSkillController {

    private final UserSkillService userSkillService;

    public UserSkillController(UserSkillService userSkillService) {
        this.userSkillService = userSkillService;
    }

    @GetMapping
    @Operation(summary = "Get user skill profile", description = "Retrieves all teaching and learning skills for the authenticated student")
    public ResponseEntity<UserSkillProfileResponse> getMySkills(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        UserSkillProfileResponse profile = userSkillService.getUserSkillProfile(principal.getUserId());
        return ResponseEntity.ok(profile);
    }

    @PostMapping
    @Operation(summary = "Add a skill to profile", description = "Adds a teaching or learning skill with proficiency and optional description")
    public ResponseEntity<UserSkillResponse> addSkill(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CreateUserSkillRequest request
    ) {
        UserSkillResponse response = userSkillService.addUserSkill(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update skill proficiency or description", description = "Updates proficiency and description for a user-owned skill")
    public ResponseEntity<UserSkillResponse> updateSkill(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserSkillRequest request
    ) {
        UserSkillResponse response = userSkillService.updateUserSkill(principal.getUserId(), id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove skill from profile", description = "Deletes a user-owned skill relationship")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable UUID id
    ) {
        userSkillService.deleteUserSkill(principal.getUserId(), id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Skill removed from profile successfully", null));
    }
}
