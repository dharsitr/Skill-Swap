package com.skillswap.user.service;

import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.entity.YearOfStudy;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.user.dto.UserResponse;
import com.skillswap.user.entity.User;
import com.skillswap.user.entity.UserStatus;
import com.skillswap.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final com.skillswap.credit.service.CreditWalletService creditWalletService;

    public UserService(
            UserRepository userRepository,
            ProfileRepository profileRepository,
            com.skillswap.credit.service.CreditWalletService creditWalletService
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.creditWalletService = creditWalletService;
    }

    @Transactional
    public User getOrCreateUser(String authUserId, String displayName, String collegeName) {
        return userRepository.findByAuthUserId(authUserId).orElseGet(() -> {
            log.info("Provisioning new application user for auth_user_id: {}", authUserId);
            User newUser = new User(authUserId);
            newUser.setStatus(UserStatus.ACTIVE);
            User savedUser = userRepository.save(newUser);

            String initialName = (displayName != null && !displayName.isBlank())
                    ? com.skillswap.common.util.InputSanitizer.sanitize(displayName.trim(), 100)
                    : "Student";
            if (initialName == null || initialName.isBlank()) {
                initialName = "Student";
            }
            String initialCollege = (collegeName != null && !collegeName.isBlank())
                    ? com.skillswap.common.util.InputSanitizer.sanitize(collegeName.trim(), 150)
                    : "Campus";
            if (initialCollege == null || initialCollege.isBlank()) {
                initialCollege = "Campus";
            }

            Profile initialProfile = new Profile(savedUser, initialName, initialCollege);
            initialProfile.setYearOfStudy(YearOfStudy.FIRST_YEAR);
            profileRepository.save(initialProfile);

            creditWalletService.getOrCreateWallet(savedUser);

            log.info("Initialized profile and credit wallet for user id: {}", savedUser.getId());
            return savedUser;
        });
    }


    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String authUserId) {
        User user = userRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "authUserId", authUserId));
        return new UserResponse(user);
    }

    @Transactional
    public void deleteCurrentUser(String authUserId) {
        User user = userRepository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "authUserId", authUserId));
        user.setStatus(UserStatus.DELETED);
        userRepository.save(user);
        log.info("Marked user as DELETED for auth_user_id: {}", authUserId);
    }
}
