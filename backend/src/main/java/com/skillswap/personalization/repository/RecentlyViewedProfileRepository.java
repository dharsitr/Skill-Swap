package com.skillswap.personalization.repository;

import com.skillswap.personalization.entity.RecentlyViewedProfile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecentlyViewedProfileRepository extends JpaRepository<RecentlyViewedProfile, UUID> {

    @Query("SELECT r FROM RecentlyViewedProfile r WHERE r.viewer.id = :viewerId ORDER BY r.viewedAt DESC")
    List<RecentlyViewedProfile> findByViewerIdOrderByViewedAtDesc(@Param("viewerId") UUID viewerId, Pageable pageable);

    Optional<RecentlyViewedProfile> findByViewerIdAndViewedUserId(UUID viewerId, UUID viewedUserId);

    long countByViewerId(UUID viewerId);

    @Modifying
    @Query("DELETE FROM RecentlyViewedProfile r WHERE r.viewer.id = :viewerId")
    void deleteAllByViewerId(@Param("viewerId") UUID viewerId);

    @Query("SELECT r.id FROM RecentlyViewedProfile r WHERE r.viewer.id = :viewerId ORDER BY r.viewedAt DESC")
    List<UUID> findIdsByViewerIdOrderByViewedAtDesc(@Param("viewerId") UUID viewerId);
}
