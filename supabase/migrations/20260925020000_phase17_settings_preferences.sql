-- SkillSwap Phase 17: Settings & Account Management Tables
-- notification_preferences, privacy_preferences, user_preferences

-- 1. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  messages_enabled BOOLEAN NOT NULL DEFAULT true,
  connection_requests_enabled BOOLEAN NOT NULL DEFAULT true,
  session_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  session_updates_enabled BOOLEAN NOT NULL DEFAULT true,
  reviews_enabled BOOLEAN NOT NULL DEFAULT true,
  credit_activity_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_notification_preferences_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- 2. PRIVACY PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.privacy_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'connections', 'hidden')),
  allow_connection_requests TEXT NOT NULL DEFAULT 'everyone' CHECK (allow_connection_requests IN ('everyone', 'verified', 'none')),
  show_online_status BOOLEAN NOT NULL DEFAULT true,
  show_availability BOOLEAN NOT NULL DEFAULT true,
  show_completed_sessions BOOLEAN NOT NULL DEFAULT true,
  show_rating_summary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_privacy_preferences_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_privacy_preferences_user_id ON public.privacy_preferences(user_id);

-- 3. USER GENERAL PREFERENCES TABLE (Session, Audio/Video, Chat, Appearance, Language/Region)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  default_session_duration INT NOT NULL DEFAULT 45 CHECK (default_session_duration IN (30, 45, 60)),
  auto_accept_connections BOOLEAN NOT NULL DEFAULT false,
  cancellation_notice_hours INT NOT NULL DEFAULT 2,
  read_receipts_enabled BOOLEAN NOT NULL DEFAULT true,
  typing_indicators_enabled BOOLEAN NOT NULL DEFAULT true,
  message_sounds_enabled BOOLEAN NOT NULL DEFAULT true,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  layout_density TEXT NOT NULL DEFAULT 'comfortable' CHECK (layout_density IN ('comfortable', 'compact')),
  language TEXT NOT NULL DEFAULT 'en',
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  time_format TEXT NOT NULL DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  preferred_camera_id TEXT,
  preferred_mic_id TEXT,
  preferred_speaker_id TEXT,
  video_quality TEXT NOT NULL DEFAULT '720p' CHECK (video_quality IN ('480p', '720p', '1080p')),
  mirror_video BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_preferences_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- 4. ENABLE RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR NOTIFICATION PREFERENCES
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can view their own notification preferences') THEN
    CREATE POLICY "Users can view their own notification preferences"
      ON public.notification_preferences FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can insert their own notification preferences') THEN
    CREATE POLICY "Users can insert their own notification preferences"
      ON public.notification_preferences FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can update their own notification preferences') THEN
    CREATE POLICY "Users can update their own notification preferences"
      ON public.notification_preferences FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can delete their own notification preferences') THEN
    CREATE POLICY "Users can delete their own notification preferences"
      ON public.notification_preferences FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- 6. RLS POLICIES FOR PRIVACY PREFERENCES
DO $$
BEGIN
  -- Authenticated user can view their own full privacy settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'privacy_preferences' AND policyname = 'Users can view their own privacy preferences') THEN
    CREATE POLICY "Users can view their own privacy preferences"
      ON public.privacy_preferences FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;

  -- Peers need to read basic visibility flags (or through security invoker / public view)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'privacy_preferences' AND policyname = 'Authenticated users can check peer visibility flags') THEN
    CREATE POLICY "Authenticated users can check peer visibility flags"
      ON public.privacy_preferences FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'privacy_preferences' AND policyname = 'Users can insert their own privacy preferences') THEN
    CREATE POLICY "Users can insert their own privacy preferences"
      ON public.privacy_preferences FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'privacy_preferences' AND policyname = 'Users can update their own privacy preferences') THEN
    CREATE POLICY "Users can update their own privacy preferences"
      ON public.privacy_preferences FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'privacy_preferences' AND policyname = 'Users can delete their own privacy preferences') THEN
    CREATE POLICY "Users can delete their own privacy preferences"
      ON public.privacy_preferences FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- 7. RLS POLICIES FOR USER PREFERENCES
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can view their own general preferences') THEN
    CREATE POLICY "Users can view their own general preferences"
      ON public.user_preferences FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can insert their own general preferences') THEN
    CREATE POLICY "Users can insert their own general preferences"
      ON public.user_preferences FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can update their own general preferences') THEN
    CREATE POLICY "Users can update their own general preferences"
      ON public.user_preferences FOR UPDATE
      TO authenticated
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can delete their own general preferences') THEN
    CREATE POLICY "Users can delete their own general preferences"
      ON public.user_preferences FOR DELETE
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
END $$;

-- 8. GRANTS FOR DATA API EXPOSURE
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.privacy_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
