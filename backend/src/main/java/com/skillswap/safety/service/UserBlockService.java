package com.skillswap.safety.service;

import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.common.response.PageResponse;
import com.skillswap.profile.entity.Profile;
import com.skillswap.profile.repository.ProfileRepository;
import com.skillswap.safety.dto.BlockStatusResponse;
import com.skillswap.safety.dto.UserBlockResponse;
import com.skillswap.safety.entity.UserBlock;
import com.skillswap.safety.repository.UserBlockRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserBlockService {

    private static final Logger log = LoggerFactory.getLogger(UserBlockService.class);

    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    public UserBlockService(
            UserBlockRepository userBlockRepository,
            UserRepository userRepository,
            ProfileRepository profileRepository
    ) {
        this.userBlockRepository = userBlockRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional
    public UserBlockResponse blockUser(UUID blockerId, UUID targetUserId) {
        if (blockerId.equals(targetUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot block yourself");
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", blockerId));

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        Optional<UserBlock> existing = userBlockRepository.findByBlockerIdAndBlockedUserId(blockerId, targetUserId);
        if (existing.isPresent()) {
            Profile profile = profileRepository.findByUserId(targetUserId).orElse(null);
            return UserBlockResponse.fromEntity(existing.get(), profile);
        }

        UserBlock userBlock = new UserBlock(blocker, targetUser);
        UserBlock saved = userBlockRepository.save(userBlock);

        log.info("User {} blocked user {}", blockerId, targetUserId);
        Profile targetProfile = profileRepository.findByUserId(targetUserId).orElse(null);
        return UserBlockResponse.fromEntity(saved, targetProfile);
    }

    @Transactional
    public void unblockUser(UUID blockerId, UUID targetUserId) {
        if (blockerId.equals(targetUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid user");
        }

        userBlockRepository.deleteByBlockerIdAndBlockedUserId(blockerId, targetUserId);
        log.info("User {} unblocked user {}", blockerId, targetUserId);
    }

    @Transactional(readOnly = true)
    public boolean isBlocked(UUID u1, UUID u2) {
        if (u1 == null || u2 == null || u1.equals(u2)) {
            return false;
        }
        return userBlockRepository.isBlockedBetween(u1, u2);
    }

    @Transactional(readOnly = true)
    public List<UUID> getMutualBlockedUserIds(UUID userId) {
        return userBlockRepository.findMutualBlockedUserIds(userId);
    }

    @Transactional(readOnly = true)
    public BlockStatusResponse getBlockStatus(UUID currentUserId, UUID targetUserId) {
        boolean blockedByMe = userBlockRepository.existsByBlockerIdAndBlockedUserId(currentUserId, targetUserId);
        boolean blockedByTarget = userBlockRepository.existsByBlockerIdAndBlockedUserId(targetUserId, currentUserId);
        return new BlockStatusResponse(targetUserId, blockedByMe, blockedByTarget);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserBlockResponse> getBlockedUsers(UUID blockerId, Pageable pageable) {
        Page<UserBlock> page = userBlockRepository.findByBlockerIdOrderByCreatedAtDesc(blockerId, pageable);

        if (page.isEmpty()) {
            return PageResponse.of(Collections.emptyList(), page.getNumber(), page.getSize(), page.getTotalElements());
        }

        Set<UUID> userIds = page.getContent().stream()
                .map(b -> b.getBlockedUser().getId())
                .collect(Collectors.toSet());

        Map<UUID, Profile> profileMap = profileRepository.findByUserIds(userIds).stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p, (a, b) -> a));

        List<UserBlockResponse> items = page.getContent().stream()
                .map(b -> UserBlockResponse.fromEntity(b, profileMap.get(b.getBlockedUser().getId())))
                .toList();

        return PageResponse.of(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }
}
