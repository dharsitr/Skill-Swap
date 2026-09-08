-- SkillSwap Phase 1 Database Migration Baseline
-- This migration establishes the Flyway schema tracking baseline for SkillSwap.
-- Future phases will incrementally add business entities (users, profiles, skills, sessions, etc.).

CREATE TABLE IF NOT EXISTS schema_metadata (
    id VARCHAR(64) PRIMARY KEY,
    initialized_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_metadata (id, description)
VALUES ('phase-01', 'SkillSwap Phase 1 Foundation Baseline')
ON CONFLICT (id) DO NOTHING;
