package com.skillswap.safety.repository;

import com.skillswap.safety.entity.UserBlock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, UUID> {

    Page<UserBlock> findByBlockerIdOrderByCreatedAtDesc(UUID blockerId, Pageable pageable);

    Optional<UserBlock> findByBlockerIdAndBlockedUserId(UUID blockerId, UUID blockedUserId);

    boolean existsByBlockerIdAndBlockedUserId(UUID blockerId, UUID blockedUserId);

    void deleteByBlockerIdAndBlockedUserId(UUID blockerId, UUID blockedUserId);

    @Query("SELECT CASE WHEN COUNT(ub) > 0 THEN true ELSE false END FROM UserBlock ub " +
           "WHERE (ub.blocker.id = :u1 AND ub.blockedUser.id = :u2) " +
           "   OR (ub.blocker.id = :u2 AND ub.blockedUser.id = :u1)")
    boolean isBlockedBetween(@Param("u1") UUID u1, @Param("u2") UUID u2);

    @Query("SELECT ub.blockedUser.id FROM UserBlock ub WHERE ub.blocker.id = :userId " +
           "UNION " +
           "SELECT ub.blocker.id FROM UserBlock ub WHERE ub.blockedUser.id = :userId")
    List<UUID> findMutualBlockedUserIds(@Param("userId") UUID userId);
}
