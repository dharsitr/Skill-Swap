-- SkillSwap Phase 6 Database Migration
-- Creates credit_wallets and credit_transactions tables

CREATE TABLE IF NOT EXISTS credit_wallets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_credit_wallets_non_negative_balance CHECK (balance >= 0)
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY,
    wallet_id UUID NOT NULL REFERENCES credit_wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    direction VARCHAR(16) NOT NULL,
    type VARCHAR(32) NOT NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_credit_transactions_positive_amount CHECK (amount > 0),
    CONSTRAINT chk_credit_transactions_valid_direction CHECK (direction IN ('CREDIT', 'DEBIT')),
    CONSTRAINT chk_credit_transactions_valid_type CHECK (type IN ('INITIAL_CREDIT', 'SESSION_EARNING', 'SESSION_SPENDING'))
);

-- Ensure a session can only be settled once per transaction type (e.g. 1 SESSION_SPENDING and 1 SESSION_EARNING)
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_transactions_session_type 
    ON credit_transactions(session_id, type) 
    WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_credit_wallets_user_id ON credit_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_wallet_id ON credit_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_session_id ON credit_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);
