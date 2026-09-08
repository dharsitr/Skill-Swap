package com.skillswap.availability;

import com.skillswap.availability.dto.CreateAvailabilityRequest;
import com.skillswap.availability.dto.UpdateAvailabilityRequest;
import com.skillswap.availability.dto.UserAvailabilityResponse;
import com.skillswap.availability.entity.UserAvailability;
import com.skillswap.availability.repository.UserAvailabilityRepository;
import com.skillswap.availability.service.AvailabilityService;
import com.skillswap.common.exception.ApiException;
import com.skillswap.common.exception.ResourceConflictException;
import com.skillswap.user.entity.User;
import com.skillswap.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock
    private UserAvailabilityRepository availabilityRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AvailabilityService availabilityService;

    private User mockUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        mockUser = new User();
        mockUser.setId(userId);
    }

    @Test
    @DisplayName("Successfully creates an availability slot when valid and non-overlapping")
    void createAvailability_Success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(availabilityRepository.findByUserIdAndDayOfWeekAndActiveTrue(userId, DayOfWeek.MONDAY))
                .thenReturn(List.of());

        when(availabilityRepository.save(any(UserAvailability.class))).thenAnswer(invocation -> {
            UserAvailability saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        CreateAvailabilityRequest request = new CreateAvailabilityRequest(
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0),
                LocalTime.of(12, 0),
                "UTC",
                true
        );

        UserAvailabilityResponse response = availabilityService.createAvailability(userId, request);

        assertThat(response).isNotNull();
        assertThat(response.getDayOfWeek()).isEqualTo(DayOfWeek.MONDAY);
        assertThat(response.getStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(response.getEndTime()).isEqualTo(LocalTime.of(12, 0));
        assertThat(response.isActive()).isTrue();
        verify(availabilityRepository, times(1)).save(any(UserAvailability.class));
    }

    @Test
    @DisplayName("Fails creation when start time is after end time")
    void createAvailability_InvalidTimeOrder_ThrowsBadRequest() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

        CreateAvailabilityRequest request = new CreateAvailabilityRequest(
                DayOfWeek.MONDAY,
                LocalTime.of(14, 0),
                LocalTime.of(10, 0),
                "UTC",
                true
        );

        assertThatThrownBy(() -> availabilityService.createAvailability(userId, request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("End time must be strictly after start time")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(availabilityRepository, never()).save(any());
    }

    @Test
    @DisplayName("Fails creation when slot overlaps with an existing slot on the same day")
    void createAvailability_OverlappingSlotSameDay_ThrowsConflict() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

        UserAvailability existing = new UserAvailability(
                mockUser,
                DayOfWeek.MONDAY,
                LocalTime.of(10, 0),
                LocalTime.of(13, 0),
                "UTC",
                true
        );
        existing.setId(UUID.randomUUID());

        when(availabilityRepository.findByUserIdAndDayOfWeekAndActiveTrue(userId, DayOfWeek.MONDAY))
                .thenReturn(List.of(existing));

        CreateAvailabilityRequest request = new CreateAvailabilityRequest(
                DayOfWeek.MONDAY,
                LocalTime.of(11, 0),
                LocalTime.of(14, 0),
                "UTC",
                true
        );

        assertThatThrownBy(() -> availabilityService.createAvailability(userId, request))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessageContaining("overlaps with existing slot");

        verify(availabilityRepository, never()).save(any());
    }

    @Test
    @DisplayName("Fails update when attempting to modify another student's availability slot")
    void updateAvailability_UnauthorizedUser_ThrowsForbidden() {
        UUID otherUserId = UUID.randomUUID();
        User otherUser = new User();
        otherUser.setId(otherUserId);

        UUID slotId = UUID.randomUUID();
        UserAvailability slot = new UserAvailability(
                otherUser,
                DayOfWeek.TUESDAY,
                LocalTime.of(10, 0),
                LocalTime.of(12, 0),
                "UTC",
                true
        );
        slot.setId(slotId);

        when(availabilityRepository.findById(slotId)).thenReturn(Optional.of(slot));

        UpdateAvailabilityRequest request = new UpdateAvailabilityRequest(
                DayOfWeek.TUESDAY,
                LocalTime.of(10, 0),
                LocalTime.of(13, 0),
                "UTC",
                true
        );

        assertThatThrownBy(() -> availabilityService.updateAvailability(userId, slotId, request))
                .isInstanceOf(ApiException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.FORBIDDEN);

        verify(availabilityRepository, never()).save(any());
    }

    @Test
    @DisplayName("Successfully deletes availability slot owned by the student")
    void deleteAvailability_Success() {
        UUID slotId = UUID.randomUUID();
        UserAvailability slot = new UserAvailability(
                mockUser,
                DayOfWeek.FRIDAY,
                LocalTime.of(14, 0),
                LocalTime.of(16, 0),
                "UTC",
                true
        );
        slot.setId(slotId);

        when(availabilityRepository.findById(slotId)).thenReturn(Optional.of(slot));

        availabilityService.deleteAvailability(userId, slotId);

        verify(availabilityRepository, times(1)).delete(slot);
    }
}
