package com.skillswap.review.repository;

import com.skillswap.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Optional<Review> findBySessionIdAndReviewerId(UUID sessionId, UUID reviewerId);

    boolean existsBySessionIdAndReviewerId(UUID sessionId, UUID reviewerId);

    Page<Review> findByRevieweeIdOrderByCreatedAtDesc(UUID revieweeId, Pageable pageable);

    long countByRevieweeId(UUID revieweeId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewee.id = :revieweeId")
    Double calculateAverageRatingByRevieweeId(@Param("revieweeId") UUID revieweeId);
}
