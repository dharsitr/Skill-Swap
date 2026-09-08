package com.skillswap.personalization.service;

import com.skillswap.personalization.dto.ProfileCompletionDto;
import com.skillswap.personalization.dto.ProfileCompletionDto.MissingProfileFieldDto;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.skill.entity.SkillRelationshipType;
import com.skillswap.skill.repository.UserSkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProfileCompletionService {

    private final ProfileRepository profileRepository;
    private final UserSkillRepository userSkillRepository;

    public ProfileCompletionService(ProfileRepository profileRepository, UserSkillRepository userSkillRepository) {
        this.profileRepository = profileRepository;
        this.userSkillRepository = userSkillRepository;
    }

    @Transactional(readOnly = true)
    public ProfileCompletionDto calculateCompletion(UUID userId) {
        Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
        List<MissingProfileFieldDto> missingFields = new ArrayList<>();

        int score = 0;

        if (profileOpt.isPresent()) {
            Profile profile = profileOpt.get();

            // Display Name (15%)
            if (profile.getDisplayName() != null && !profile.getDisplayName().trim().isEmpty()) {
                score += 15;
            } else {
                missingFields.add(new MissingProfileFieldDto("displayName", "Add your display name", "/profile", 15));
            }

            // Bio (15%)
            if (profile.getBio() != null && !profile.getBio().trim().isEmpty()) {
                score += 15;
            } else {
                missingFields.add(new MissingProfileFieldDto("bio", "Write a short bio about yourself", "/profile", 15));
            }

            // Avatar URL (15%)
            if (profile.getAvatarUrl() != null && !profile.getAvatarUrl().trim().isEmpty()) {
                score += 15;
            } else {
                missingFields.add(new MissingProfileFieldDto("avatarUrl", "Upload a profile photo", "/profile", 15));
            }

            // College Name (15%)
            if (profile.getCollegeName() != null && !profile.getCollegeName().trim().isEmpty()) {
                score += 15;
            } else {
                missingFields.add(new MissingProfileFieldDto("collegeName", "Specify your college / campus", "/profile", 15));
            }

            // Department / Year of Study (10%)
            if (profile.getDepartment() != null && !profile.getDepartment().trim().isEmpty()) {
                score += 10;
            } else {
                missingFields.add(new MissingProfileFieldDto("department", "Add your department / major", "/profile", 10));
            }
        } else {
            missingFields.add(new MissingProfileFieldDto("profile", "Complete your basic student profile", "/profile", 70));
        }

        // Teaching Skills (15%)
        long teachCount = userSkillRepository.findByUserIdAndRelationshipType(userId, SkillRelationshipType.TEACH).size();
        if (teachCount > 0) {
            score += 15;
        } else {
            missingFields.add(new MissingProfileFieldDto("teachingSkills", "Add skills you can teach", "/skills", 15));
        }

        // Learning Skills (15%)
        long learnCount = userSkillRepository.findByUserIdAndRelationshipType(userId, SkillRelationshipType.LEARN).size();
        if (learnCount > 0) {
            score += 15;
        } else {
            missingFields.add(new MissingProfileFieldDto("learningSkills", "Add skills you want to learn", "/skills", 15));
        }

        int percentage = Math.min(100, Math.max(0, score));
        return new ProfileCompletionDto(percentage, percentage == 100, missingFields);
    }
}
