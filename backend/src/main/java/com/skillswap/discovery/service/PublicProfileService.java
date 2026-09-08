package com.skillswap.discovery.service;

import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.discovery.dto.PublicProfileDto;
import com.skillswap.discovery.dto.PublicUserSkillDto;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.entity.UserSkill;
import com.skillswap.skill.repository.UserSkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PublicProfileService {

    private final ProfileRepository profileRepository;
    private final UserSkillRepository userSkillRepository;

    public PublicProfileService(ProfileRepository profileRepository, UserSkillRepository userSkillRepository) {
        this.profileRepository = profileRepository;
        this.userSkillRepository = userSkillRepository;
    }

    public PublicProfileDto getPublicProfileByUserId(UUID userId) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user id: " + userId));

        List<UserSkill> skills = userSkillRepository.findByUserId(userId);

        List<PublicUserSkillDto> teaching = skills.stream()
                .filter(s -> s.getRelationshipType() == SkillRelationshipType.TEACH)
                .map(PublicUserSkillDto::fromEntity)
                .collect(Collectors.toList());

        List<PublicUserSkillDto> learning = skills.stream()
                .filter(s -> s.getRelationshipType() == SkillRelationshipType.LEARN)
                .map(PublicUserSkillDto::fromEntity)
                .collect(Collectors.toList());

        return PublicProfileDto.fromEntity(profile, teaching, learning);
    }
}
