package com.skillswap.personalization.repository;

import com.skillswap.personalization.entity.SearchHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, UUID> {

    @Query("SELECT s FROM SearchHistory s WHERE s.user.id = :userId ORDER BY s.searchedAt DESC")
    List<SearchHistory> findByUserIdOrderBySearchedAtDesc(@Param("userId") UUID userId, Pageable pageable);

    long countByUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM SearchHistory s WHERE s.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);

    @Query("SELECT s.id FROM SearchHistory s WHERE s.user.id = :userId ORDER BY s.searchedAt DESC")
    List<UUID> findIdsByUserIdOrderBySearchedAtDesc(@Param("userId") UUID userId);
}
