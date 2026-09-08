package com.skillswap.notification.entity;

import com.skillswap.user.entity.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "notification_preferences",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_user_notification_prefs", columnNames = {"user_id"})
        }
)
public class NotificationPreference {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "exchange_requests", nullable = false)
    private boolean exchangeRequests = true;

    @Column(name = "sessions", nullable = false)
    private boolean sessions = true;

    @Column(name = "messages", nullable = false)
    private boolean messages = true;

    @Column(name = "reviews", nullable = false)
    private boolean reviews = true;

    @Column(name = "safety", nullable = false)
    private boolean safety = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public NotificationPreference() {
        this.id = UUID.randomUUID();
        this.exchangeRequests = true;
        this.sessions = true;
        this.messages = true;
        this.reviews = true;
        this.safety = true;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public NotificationPreference(User user) {
        this();
        this.user = user;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isCategoryEnabled(NotificationType type) {
        return switch (type) {
            case EXCHANGE_REQUEST_RECEIVED, EXCHANGE_REQUEST_ACCEPTED, EXCHANGE_REQUEST_REJECTED -> exchangeRequests;
            case SESSION_CREATED, SESSION_STARTED, SESSION_COMPLETED, SESSION_SCHEDULED, SESSION_RESCHEDULED, SESSION_REMINDER -> sessions;
            case NEW_MESSAGE -> messages;
            case REVIEW_RECEIVED -> reviews;
            case FRIEND_REQUEST_RECEIVED, FRIEND_REQUEST_ACCEPTED -> true;
            case DISPUTE_UPDATED, SAFETY_UPDATE -> true; // Safety notifications always enabled
        };
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public boolean isExchangeRequests() {
        return exchangeRequests;
    }

    public void setExchangeRequests(boolean exchangeRequests) {
        this.exchangeRequests = exchangeRequests;
    }

    public boolean isSessions() {
        return sessions;
    }

    public void setSessions(boolean sessions) {
        this.sessions = sessions;
    }

    public boolean isMessages() {
        return messages;
    }

    public void setMessages(boolean messages) {
        this.messages = messages;
    }

    public boolean isReviews() {
        return reviews;
    }

    public void setReviews(boolean reviews) {
        this.reviews = reviews;
    }

    public boolean isSafety() {
        return safety;
    }

    public void setSafety(boolean safety) {
        this.safety = safety;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
