package com.skillswap.credit.entity;

import com.skillswap.session.entity.Session;
import com.skillswap.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "credit_transactions")
public class CreditTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "wallet_id", nullable = false)
    private CreditWallet wallet;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CreditTransactionDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CreditTransactionType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private Session session;

    @Column(length = 255)
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public CreditTransaction() {
    }

    public CreditTransaction(
            CreditWallet wallet,
            User user,
            int amount,
            CreditTransactionDirection direction,
            CreditTransactionType type,
            Session session,
            String description
    ) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Transaction amount must be positive");
        }
        this.wallet = wallet;
        this.user = user;
        this.amount = amount;
        this.direction = direction;
        this.type = type;
        this.session = session;
        this.description = description;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public CreditWallet getWallet() {
        return wallet;
    }

    public User getUser() {
        return user;
    }

    public int getAmount() {
        return amount;
    }

    public CreditTransactionDirection getDirection() {
        return direction;
    }

    public CreditTransactionType getType() {
        return type;
    }

    public Session getSession() {
        return session;
    }

    public String getDescription() {
        return description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
