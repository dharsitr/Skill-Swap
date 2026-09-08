package com.skillswap.availability.service;

import com.skillswap.availability.dto.CreateAvailabilityRequest;
import com.skillswap.availability.dto.UpdateAvailabilityRequest;
import com.skillswap.availability.dto.UserAvailabilityResponse;
import com.skillswap.availability.entity.UserAvailability;
import com.skillswap.availability.repository.UserAvailabilityRepository;
import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceConflictException;
import com.skillswap.common.exception.ResourceNotFoundException;
import com.skillswap.user.entity.User;
import com.skillswap.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AvailabilityService {

    private static final Logger log = LoggerFactory.getLogger(AvailabilityService.class);

    private final UserAvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;

    public AvailabilityService(
            UserAvailabilityRepository availabilityRepository,
            UserRepository userRepository
    ) {
        this.availabilityRepository = availabilityRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserAvailabilityResponse> getMyAvailability(UUID userId) {
        return availabilityRepository.findByUserIdOrderByDayOfWeekAscStartTimeAsc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserAvailabilityResponse createAvailability(UUID userId, CreateAvailabilityRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        validateTimeOrder(request.getStartTime(), request.getEndTime());

        boolean active = request.getActive() == null || request.getActive();
        if (active) {
            validateNoOverlap(userId, request.getDayOfWeek(), request.getStartTime(), request.getEndTime(), null);
        }

        UserAvailability slot = new UserAvailability(
                user,
                request.getDayOfWeek(),
                request.getStartTime(),
                request.getEndTime(),
                request.getTimezone() != null && !request.getTimezone().isBlank() ? request.getTimezone() : "UTC",
                active
        );

        UserAvailability saved = availabilityRepository.save(slot);
        log.info("Created availability slot {} for user {} on {}", saved.getId(), userId, saved.getDayOfWeek());
        return mapToResponse(saved);
    }

    @Transactional
    public UserAvailabilityResponse updateAvailability(UUID userId, UUID slotId, UpdateAvailabilityRequest request) {
        UserAvailability slot = availabilityRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Availability slot not found: " + slotId));

        if (!slot.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to modify this availability slot");
        }

        DayOfWeek targetDay = request.getDayOfWeek() != null ? request.getDayOfWeek() : slot.getDayOfWeek();
        LocalTime targetStart = request.getStartTime() != null ? request.getStartTime() : slot.getStartTime();
        LocalTime targetEnd = request.getEndTime() != null ? request.getEndTime() : slot.getEndTime();
        boolean targetActive = request.getActive() != null ? request.getActive() : slot.isActive();

        validateTimeOrder(targetStart, targetEnd);

        if (targetActive) {
            validateNoOverlap(userId, targetDay, targetStart, targetEnd, slotId);
        }

        slot.setDayOfWeek(targetDay);
        slot.setStartTime(targetStart);
        slot.setEndTime(targetEnd);
        slot.setActive(targetActive);
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            slot.setTimezone(request.getTimezone());
        }

        UserAvailability updated = availabilityRepository.save(slot);
        log.info("Updated availability slot {} for user {}", updated.getId(), userId);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteAvailability(UUID userId, UUID slotId) {
        UserAvailability slot = availabilityRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Availability slot not found: " + slotId));

        if (!slot.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to delete this availability slot");
        }

        availabilityRepository.delete(slot);
        log.info("Deleted availability slot {} for user {}", slotId, userId);
    }

    private void validateTimeOrder(LocalTime startTime, LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "End time must be strictly after start time");
        }
    }

    private void validateNoOverlap(UUID userId, DayOfWeek day, LocalTime start, LocalTime end, UUID excludeSlotId) {
        List<UserAvailability> existingSlots = (excludeSlotId == null)
                ? availabilityRepository.findByUserIdAndDayOfWeekAndActiveTrue(userId, day)
                : availabilityRepository.findByUserIdAndDayOfWeekAndActiveTrueExcluding(userId, day, excludeSlotId);

        for (UserAvailability existing : existingSlots) {
            if (isOverlapping(start, end, existing.getStartTime(), existing.getEndTime())) {
                throw new ResourceConflictException(
                        String.format("Availability slot (%s - %s) overlaps with existing slot (%s - %s) on %s",
                                start, end, existing.getStartTime(), existing.getEndTime(), day)
                );
            }
        }
    }

    private boolean isOverlapping(LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        return startA.isBefore(endB) && startB.isBefore(endA);
    }

    private UserAvailabilityResponse mapToResponse(UserAvailability slot) {
        return new UserAvailabilityResponse(
                slot.getId(),
                slot.getUser().getId(),
                slot.getDayOfWeek(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getTimezone(),
                slot.isActive(),
                slot.getCreatedAt(),
                slot.getUpdatedAt()
        );
    }
}
