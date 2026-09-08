-- SkillSwap Phase 16 / Milestone: Friend Requests & Peer Connection System
-- Creates friend_requests table to manage peer connection requests and friendships

CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_friend_requests_distinct_users CHECK (sender_id != receiver_id),
    CONSTRAINT chk_friend_requests_status_valid CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_receiver ON friend_requests(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_sender ON friend_requests(receiver_id, sender_id);
