-- SkillSwap Phase 5 Database Migration
-- Creates exchange_requests and sessions tables

CREATE TABLE IF NOT EXISTS exchange_requests (
    id UUID PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    message VARCHAR(500),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_exchange_requests_not_self CHECK (requester_id != recipient_id)
);

-- Ensure only one active PENDING request exists between the same requester, recipient, and skill
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_exchange_request 
    ON exchange_requests(requester_id, recipient_id, skill_id) 
    WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_exchange_requests_requester ON exchange_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_recipient ON exchange_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_skill ON exchange_requests(skill_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_status ON exchange_requests(status);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_created_at ON exchange_requests(created_at);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    exchange_request_id UUID UNIQUE NOT NULL REFERENCES exchange_requests(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sessions_not_self CHECK (teacher_id != learner_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_exchange_request_id ON sessions(exchange_request_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner_id ON sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
