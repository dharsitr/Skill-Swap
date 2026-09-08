package com.skillswap.skill.service;

import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.skill.dto.CategoryResponse;
import com.skillswap.skill.dto.SkillResponse;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.repository.SkillCategoryRepository;
import com.skillswap.skill.repository.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SkillCatalogService {

    private final SkillCategoryRepository categoryRepository;
    private final SkillRepository skillRepository;

    public SkillCatalogService(
            SkillCategoryRepository categoryRepository,
            SkillRepository skillRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.skillRepository = skillRepository;
    }

    public List<CategoryResponse> getCategories() {
        return categoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SkillResponse> getSkills(String search, UUID categoryId) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<Skill> skills = skillRepository.findFiltered(cleanSearch, categoryId);
        return skills.stream()
                .map(SkillResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public SkillResponse getSkillById(UUID id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + id));
        return SkillResponse.fromEntity(skill);
    }
}
