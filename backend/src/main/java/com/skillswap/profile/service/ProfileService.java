package com.skillswap.profile.service;

import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.profile.dto.ProfileResponse;
import com.skillswap.profile.dto.UpdateProfileRequest;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileService.class);

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfileByAuthUserId(String authUserId) {
        Profile profile = profileRepository.findByUserAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "authUserId", authUserId));
        return new ProfileResponse(profile);
    }

    @Transactional
    public ProfileResponse updateProfile(String authUserId, UpdateProfileRequest request) {
        Profile profile = profileRepository.findByUserAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "authUserId", authUserId));

        if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
            profile.setDisplayName(com.skillswap.common.util.InputSanitizer.sanitize(request.getDisplayName().trim(), 100));
        }

        if (request.getCollegeName() != null && !request.getCollegeName().isBlank()) {
            profile.setCollegeName(com.skillswap.common.util.InputSanitizer.sanitize(request.getCollegeName().trim(), 150));
        }

        profile.setBio(request.getBio() != null ? com.skillswap.common.util.InputSanitizer.sanitize(request.getBio().trim(), 1000) : null);
        profile.setDepartment(request.getDepartment() != null ? com.skillswap.common.util.InputSanitizer.sanitize(request.getDepartment().trim(), 100) : null);
        profile.setAvatarUrl(request.getAvatarUrl() != null ? com.skillswap.common.util.InputSanitizer.sanitize(request.getAvatarUrl().trim(), 500) : null);

        if (request.getYearOfStudy() != null) {
            profile.setYearOfStudy(request.getYearOfStudy());
        }

        Profile savedProfile = profileRepository.save(profile);
        log.info("Updated profile id: {} for user: {}", savedProfile.getId(), authUserId);
        return new ProfileResponse(savedProfile);
    }
}
