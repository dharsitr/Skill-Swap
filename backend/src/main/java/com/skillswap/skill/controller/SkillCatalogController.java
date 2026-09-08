package com.skillswap.skill.controller;

import com.skillswap.skill.dto.CategoryListResponse;
import com.skillswap.skill.dto.CategoryResponse;
import com.skillswap.skill.dto.SkillListResponse;
import com.skillswap.skill.dto.SkillResponse;
import com.skillswap.skill.service.SkillCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/skills")
@Tag(name = "Skill Catalog", description = "Public endpoints for browsing skill categories and catalog skills")
public class SkillCatalogController {

    private final SkillCatalogService catalogService;

    public SkillCatalogController(SkillCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all skill categories", description = "Retrieves all available high-level skill categories")
    public ResponseEntity<CategoryListResponse> getCategories() {
        List<CategoryResponse> categories = catalogService.getCategories();
        return ResponseEntity.ok(new CategoryListResponse(categories));
    }

    @GetMapping
    @Operation(summary = "Get skills catalog", description = "Retrieves skills with optional case-insensitive search and category filtering")
    public ResponseEntity<SkillListResponse> getSkills(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId
    ) {
        List<SkillResponse> skills = catalogService.getSkills(search, categoryId);
        return ResponseEntity.ok(new SkillListResponse(skills));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get skill details by ID", description = "Retrieves metadata and category information for a specific skill")
    public ResponseEntity<SkillResponse> getSkillById(@PathVariable UUID id) {
        SkillResponse skill = catalogService.getSkillById(id);
        return ResponseEntity.ok(skill);
    }
}
