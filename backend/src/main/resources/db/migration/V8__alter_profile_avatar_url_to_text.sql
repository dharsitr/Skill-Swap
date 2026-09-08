-- ==============================================================================
-- SkillSwap Migration: V8 - Alter profiles avatar_url column to TEXT
-- ==============================================================================

ALTER TABLE profiles ALTER COLUMN avatar_url TYPE TEXT;
