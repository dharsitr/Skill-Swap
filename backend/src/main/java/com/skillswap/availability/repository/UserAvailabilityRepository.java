package com.skillswap.availability.repository;

import com.skillswap.availability.entity.UserAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserAvailabilityRepository extends JpaRepository<UserAvailability, UUID> {

    List<UserAvailability> findByUserIdOrderByDayOfWeekAscStartTimeAsc(UUID userId);

    List<UserAvailability> findByUserIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(UUID userId);

    List<UserAvailability> findByUserIdAndDayOfWeekAndActiveTrue(UUID userId, DayOfWeek dayOfWeek);

    @Query("SELECT a FROM UserAvailability a WHERE a.user.id = :userId AND a.dayOfWeek = :dayOfWeek AND a.id <> :excludeId AND a.active = true")
    List<UserAvailability> findByUserIdAndDayOfWeekAndActiveTrueExcluding(
            @Param("userId") UUID userId,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("excludeId") UUID excludeId
    );
}
