package com.skillswap.personalization.entity;

import com.skillswap.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "recently_viewed_profiles",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_viewer_viewed", columnNames = {"viewer_id", "viewed_user_id"})
        }
)
public class RecentlyViewedProfile {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "viewer_id", nullable = false)
    private User viewer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "viewed_user_id", nullable = false)
    private User viewedUser;

    @Column(name = "viewed_at", nullable = false)
    private Instant viewedAt;

    public RecentlyViewedProfile() {
        this.id = UUID.randomUUID();
        this.viewedAt = Instant.now();
    }

    public RecentlyViewedProfile(User viewer, User viewedUser) {
        this();
        this.viewer = viewer;
        this.viewedUser = viewedUser;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (viewedAt == null) {
            viewedAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getViewer() {
        return viewer;
    }

    public void setViewer(User viewer) {
        this.viewer = viewer;
    }

    public User getViewedUser() {
        return viewedUser;
    }

    public void setViewedUser(User viewedUser) {
        this.viewedUser = viewedUser;
    }

    public Instant getViewedAt() {
        return viewedAt;
    }

    public void setViewedAt(Instant viewedAt) {
        this.viewedAt = viewedAt;
    }
}
