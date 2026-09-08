package com.skillswap.skill.service;

import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceConflictException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.skill.dto.CreateUserSkillRequest;
import com.skillswap.skill.dto.UpdateUserSkillRequest;
import com.skillswap.skill.dto.UserSkillProfileResponse;
import com.skillswap.skill.dto.UserSkillResponse;
import com.skillswap.skill.entity.Skill;
import com.skillswap.skill.entity.SkillProficiency;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.entity.UserSkill;
import com.skillswap.skill.repository.SkillRepository;
import com.skillswap.skill.repository.UserSkillRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserSkillService {

    private static final Logger log = LoggerFactory.getLogger(UserSkillService.class);

    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;

    public UserSkillService(
            UserSkillRepository userSkillRepository,
            SkillRepository skillRepository,
            UserRepository userRepository
    ) {
        this.userSkillRepository = userSkillRepository;
        this.skillRepository = skillRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserSkillProfileResponse getUserSkillProfile(UUID userId) {
        List<UserSkill> allSkills = userSkillRepository.findByUserId(userId);

        List<UserSkillResponse> teaching = allSkills.stream()
                .filter(us -> us.getRelationshipType() == SkillRelationshipType.TEACH)
                .map(UserSkillResponse::fromEntity)
                .collect(Collectors.toList());

        List<UserSkillResponse> learning = allSkills.stream()
                .filter(us -> us.getRelationshipType() == SkillRelationshipType.LEARN)
                .map(UserSkillResponse::fromEntity)
                .collect(Collectors.toList());

        return new UserSkillProfileResponse(teaching, learning);
    }

    public UserSkillResponse addUserSkill(UUID userId, CreateUserSkillRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Skill skill = skillRepository.findById(request.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + request.getSkillId()));

        validateProficiencyForRelationship(request.getRelationshipType(), request.getProficiency());

        if (userSkillRepository.existsByUserIdAndSkillIdAndRelationshipType(
                userId,
                request.getSkillId(),
                request.getRelationshipType()
        )) {
            String relationshipName = request.getRelationshipType() == SkillRelationshipType.TEACH ? "teaching" : "learning";
            throw new ResourceConflictException("Skill already exists in your " + relationshipName + " skills");
        }

        String cleanDescription = request.getDescription() != null ? request.getDescription().trim() : null;

        UserSkill userSkill = new UserSkill();
        userSkill.setUser(user);
        userSkill.setSkill(skill);
        userSkill.setRelationshipType(request.getRelationshipType());
        userSkill.setProficiency(request.getProficiency());
        userSkill.setDescription(cleanDescription);

        UserSkill saved = userSkillRepository.save(userSkill);
        log.info("Added {} skill '{}' (level: {}) for user id: {}",
                saved.getRelationshipType(), skill.getName(), saved.getProficiency(), userId);

        return UserSkillResponse.fromEntity(saved);
    }

    public UserSkillResponse updateUserSkill(UUID userId, UUID userSkillId, UpdateUserSkillRequest request) {
        UserSkill userSkill = userSkillRepository.findByIdAndUserId(userSkillId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill relationship not found"));

        validateProficiencyForRelationship(userSkill.getRelationshipType(), request.getProficiency());

        String cleanDescription = request.getDescription() != null ? request.getDescription().trim() : null;

        userSkill.setProficiency(request.getProficiency());
        userSkill.setDescription(cleanDescription);

        UserSkill updated = userSkillRepository.save(userSkill);
        log.info("Updated {} skill id: {} (new level: {}) for user id: {}",
                updated.getRelationshipType(), userSkillId, updated.getProficiency(), userId);

        return UserSkillResponse.fromEntity(updated);
    }

    public void deleteUserSkill(UUID userId, UUID userSkillId) {
        UserSkill userSkill = userSkillRepository.findByIdAndUserId(userSkillId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill relationship not found"));

        userSkillRepository.delete(userSkill);
        log.info("Removed {} skill id: {} for user id: {}",
                userSkill.getRelationshipType(), userSkillId, userId);
    }

    private void validateProficiencyForRelationship(SkillRelationshipType relationshipType, SkillProficiency proficiency) {
        if (relationshipType == SkillRelationshipType.LEARN && proficiency == SkillProficiency.EXPERT) {
            throw new ApiException("Learning proficiency level can only be BEGINNER, INTERMEDIATE, or ADVANCED");
        }
    }
}
