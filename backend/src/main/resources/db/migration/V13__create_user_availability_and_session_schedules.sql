-- ==============================================================================
-- SkillSwap Phase 8 Migration: Smart Scheduling, User Availability & Notifications
-- ==============================================================================

-- 1. User Availability Table
CREATE TABLE IF NOT EXISTS user_availability (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week VARCHAR(16) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_availability_user ON user_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_user_availability_user_day ON user_availability(user_id, day_of_week);

-- 2. Session Schedules Table
CREATE TABLE IF NOT EXISTS session_schedules (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_schedules_session ON session_schedules(session_id);
CREATE INDEX IF NOT EXISTS idx_session_schedules_times ON session_schedules(start_at, end_at);

-- 3. Enhance Notification Preferences with Phase 8 Flags
ALTER TABLE notification_preferences
    ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS session_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS message_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS exchange_notifications BOOLEAN NOT NULL DEFAULT TRUE;
