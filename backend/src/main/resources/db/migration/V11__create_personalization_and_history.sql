-- SkillSwap Phase 12 Migration: Personalization, History & Dashboard
-- Creates recently_viewed_profiles and search_history tables

CREATE TABLE IF NOT EXISTS recently_viewed_profiles (
    id UUID PRIMARY KEY,
    viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_viewer_viewed UNIQUE (viewer_id, viewed_user_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewer_time ON recently_viewed_profiles(viewer_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_user ON recently_viewed_profiles(viewed_user_id);

CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES skill_categories(id) ON DELETE SET NULL,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_time ON search_history(user_id, searched_at DESC);
