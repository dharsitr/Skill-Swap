-- SkillSwap Phase 4: Initial Database Schema & RLS Policies
-- Description: Core tables for profiles, skills, user_skills, availability, sessions, credits, and notifications.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER FUNCTIONS FOR AUTOMATIC TIMESTAMP UPDATES
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. USER_SKILLS TABLE
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('teach', 'learn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_skills_user_skill_type_unique UNIQUE (user_id, skill_id, type)
);

-- 6. AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT availability_time_check CHECK (end_time > start_time)
);

-- 7. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT sessions_teacher_learner_distinct CHECK (teacher_id <> learner_id)
);

CREATE TRIGGER set_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 8. CREDITS TABLE
CREATE TABLE IF NOT EXISTS public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER set_credits_updated_at
  BEFORE UPDATE ON public.credits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills (category);
CREATE INDEX IF NOT EXISTS idx_skills_name ON public.skills (name);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills (user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON public.user_skills (skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_type ON public.user_skills (type);
CREATE INDEX IF NOT EXISTS idx_availability_user_id ON public.availability (user_id);
CREATE INDEX IF NOT EXISTS idx_availability_day ON public.availability (day_of_week);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON public.sessions (teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner_id ON public.sessions (learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_skill_id ON public.sessions (skill_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions (status);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON public.sessions (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, read) WHERE read = false;

-- 11. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 12. RLS POLICIES

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- SKILLS POLICIES
CREATE POLICY "Skills are viewable by everyone"
  ON public.skills FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add new skills"
  ON public.skills FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- USER_SKILLS POLICIES
CREATE POLICY "User skills are viewable by everyone"
  ON public.user_skills FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own user skills"
  ON public.user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own user skills"
  ON public.user_skills FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own user skills"
  ON public.user_skills FOR DELETE
  USING (auth.uid() = user_id);

-- AVAILABILITY POLICIES
CREATE POLICY "Availability slots are viewable by everyone"
  ON public.availability FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own availability"
  ON public.availability FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability"
  ON public.availability FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability"
  ON public.availability FOR DELETE
  USING (auth.uid() = user_id);

-- SESSIONS POLICIES
CREATE POLICY "Users can view sessions they participate in"
  ON public.sessions FOR SELECT
  USING (auth.uid() = teacher_id OR auth.uid() = learner_id);

CREATE POLICY "Users can create sessions they participate in"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = learner_id OR auth.uid() = teacher_id);

CREATE POLICY "Participants can update their sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = teacher_id OR auth.uid() = learner_id)
  WITH CHECK (auth.uid() = teacher_id OR auth.uid() = learner_id);

-- CREDITS POLICIES
CREATE POLICY "Users can view only their own credit balance"
  ON public.credits FOR SELECT
  USING (auth.uid() = user_id);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view only their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 13. AUTOMATED USER ONBOARDING TRIGGER
-- Automatically creates a profile record and gives starter credits when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credits (user_id, balance)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to hook into auth.users (if running on Supabase instance)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
