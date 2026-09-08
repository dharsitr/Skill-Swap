package com.skillswap.notification.service;

import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.notification.dto.NotificationPreferenceResponse;
import com.skillswap.notification.dto.UpdateNotificationPreferencesRequest;
import com.skillswap.notification.entity.NotificationPreference;
import com.skillswap.notification.entity.NotificationType;
import com.skillswap.notification.repository.NotificationPreferenceRepository;
import com.skillswap.user.entity.User;
import com.skillswap.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Service managing user notification preferences and category filtering.
 */
@Service
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    public NotificationPreferenceService(
            NotificationPreferenceRepository preferenceRepository,
            UserRepository userRepository
    ) {
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public NotificationPreference getOrCreatePreferenceEntity(UUID userId) {
        return preferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                    NotificationPreference newPref = new NotificationPreference(user);
                    return preferenceRepository.save(newPref);
                });
    }

    @Transactional(readOnly = true)
    public NotificationPreferenceResponse getPreferences(UUID userId) {
        NotificationPreference preference = getOrCreatePreferenceEntity(userId);
        return NotificationPreferenceResponse.fromEntity(preference);
    }

    @Transactional
    public NotificationPreferenceResponse updatePreferences(UUID userId, UpdateNotificationPreferencesRequest request) {
        NotificationPreference preference = getOrCreatePreferenceEntity(userId);

        if (request.exchangeRequests() != null) {
            preference.setExchangeRequests(request.exchangeRequests());
        }
        if (request.sessions() != null) {
            preference.setSessions(request.sessions());
        }
        if (request.messages() != null) {
            preference.setMessages(request.messages());
        }
        if (request.reviews() != null) {
            preference.setReviews(request.reviews());
        }
        if (request.safety() != null) {
            // Safety notifications remain protected / always on, but field is safely recorded
            preference.setSafety(request.safety());
        }

        preference.setUpdatedAt(Instant.now());
        NotificationPreference saved = preferenceRepository.save(preference);
        return NotificationPreferenceResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public boolean isCategoryEnabled(UUID userId, NotificationType type) {
        // Safety notifications are always enabled
        if (type == NotificationType.DISPUTE_UPDATED || type == NotificationType.SAFETY_UPDATE) {
            return true;
        }

        return preferenceRepository.findByUserId(userId)
                .map(pref -> pref.isCategoryEnabled(type))
                .orElse(true); // Default enabled if no preference record exists yet
    }
}
