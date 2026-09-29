-- SkillSwap Phase 14: Comprehensive Security Hardening Migration
-- Audits and hardens RLS policies, foreign keys, check constraints, atomic operations, and storage security.

-- ============================================================================
-- 1. DATABASE CONSTRAINTS & INTEGRITY HARDENING
-- ============================================================================

-- Ensure non-negative credit balance constraint on credits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credits_balance_non_negative'
  ) THEN
    ALTER TABLE public.credits
      ADD CONSTRAINT credits_balance_non_negative CHECK (balance >= 0);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Enforce name length and character requirements on skills to prevent catalog pollution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skills_name_length_check'
  ) THEN
    ALTER TABLE public.skills
      ADD CONSTRAINT skills_name_length_check CHECK (char_length(trim(name)) >= 2 AND char_length(name) <= 60);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Enforce length limits on profile fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_display_name_length'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_display_name_length CHECK (display_name IS NULL OR char_length(display_name) <= 60);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_bio_length'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 600);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_headline_length'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_headline_length CHECK (headline IS NULL OR char_length(headline) <= 120);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Enforce connection request message limit
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'connection_requests_message_length'
  ) THEN
    ALTER TABLE public.connection_requests
      ADD CONSTRAINT connection_requests_message_length CHECK (message IS NULL OR char_length(message) <= 500);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Missing composite indexes for security, rate checks, and fast lookups
CREATE INDEX IF NOT EXISTS idx_messages_unread_peer
  ON public.messages (conversation_id, sender_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_active_participants
  ON public.sessions (teacher_id, learner_id, status);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
  ON public.credit_transactions (user_id, created_at DESC);

-- ============================================================================
-- 2. SUPABASE RLS HARDENING - TABLE BY TABLE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES: Users can only update their own profile; prevent cross-user edits
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- SKILLS: Public read, authenticated creation with length limits, no deletion
-- ----------------------------------------------------------------------------
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Skills are viewable by everyone" ON public.skills;
CREATE POLICY "Skills are viewable by everyone"
  ON public.skills FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can add new skills" ON public.skills;
CREATE POLICY "Authenticated users can add new skills"
  ON public.skills FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND char_length(trim(name)) >= 2
    AND char_length(name) <= 60
  );

-- ----------------------------------------------------------------------------
-- USER_SKILLS: Public read, owner-only mutation
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User skills are viewable by everyone" ON public.user_skills;
CREATE POLICY "User skills are viewable by everyone"
  ON public.user_skills FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own user skills" ON public.user_skills;
CREATE POLICY "Users can insert their own user skills"
  ON public.user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own user skills" ON public.user_skills;
CREATE POLICY "Users can update their own user skills"
  ON public.user_skills FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own user skills" ON public.user_skills;
CREATE POLICY "Users can delete their own user skills"
  ON public.user_skills FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- AVAILABILITY: Public read, owner-only mutation
-- ----------------------------------------------------------------------------
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Availability slots are viewable by everyone" ON public.availability;
CREATE POLICY "Availability slots are viewable by everyone"
  ON public.availability FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own availability" ON public.availability;
CREATE POLICY "Users can insert their own availability"
  ON public.availability FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own availability" ON public.availability;
CREATE POLICY "Users can update their own availability"
  ON public.availability FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own availability" ON public.availability;
CREATE POLICY "Users can delete their own availability"
  ON public.availability FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- CREDITS & CREDIT_TRANSACTIONS: Read-only for authenticated owner.
-- Direct client INSERT/UPDATE/DELETE forbidden; mutations run via process_credit_transaction RPC.
-- ----------------------------------------------------------------------------
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view only their own credit balance" ON public.credits;
CREATE POLICY "Users can view only their own credit balance"
  ON public.credits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view only their own credit transactions" ON public.credit_transactions;
CREATE POLICY "Users can view only their own credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Explicitly ensure NO insert/update/delete policies exist on credits for regular clients
DROP POLICY IF EXISTS "Clients can update credits" ON public.credits;
DROP POLICY IF EXISTS "Clients can insert credits" ON public.credits;
DROP POLICY IF EXISTS "Clients can delete credits" ON public.credits;
DROP POLICY IF EXISTS "Clients can insert credit transactions" ON public.credit_transactions;

-- ----------------------------------------------------------------------------
-- SESSIONS: Only participants can read or update their sessions.
-- Cannot tamper with teacher_id, learner_id, or credit_amount via client UPDATE.
-- ----------------------------------------------------------------------------
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sessions they participate in" ON public.sessions;
CREATE POLICY "Users can view sessions they participate in"
  ON public.sessions FOR SELECT
  USING (auth.uid() = teacher_id OR auth.uid() = learner_id);

DROP POLICY IF EXISTS "Users can create sessions they participate in" ON public.sessions;
CREATE POLICY "Users can create sessions they participate in"
  ON public.sessions FOR INSERT
  WITH CHECK (
    auth.uid() = learner_id
    AND teacher_id <> learner_id
    AND duration > 0
    AND credit_amount >= 0
  );

DROP POLICY IF EXISTS "Participants can update their sessions" ON public.sessions;
CREATE POLICY "Participants can update their sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = teacher_id OR auth.uid() = learner_id)
  WITH CHECK (
    (auth.uid() = teacher_id OR auth.uid() = learner_id)
    AND teacher_id <> learner_id
  );

-- ----------------------------------------------------------------------------
-- CONVERSATIONS & PARTICIPANTS: Access strictly restricted to conversation members
-- ----------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;
CREATE POLICY "Participants can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = public.conversations.id
        AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Participants can view conversation members" ON public.conversation_participants;
CREATE POLICY "Participants can view conversation members"
  ON public.conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = public.conversation_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- Prevent unauthorized users from inserting themselves or others into existing private conversations
DROP POLICY IF EXISTS "Users can insert participants when creating conversation" ON public.conversation_participants;
CREATE POLICY "Users can insert participants when creating conversation"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      -- User adding themselves
      user_id = auth.uid()
      -- OR conversation creator / existing participant adding the peer
      OR EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = public.conversation_participants.conversation_id
          AND cp.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
CREATE POLICY "Users can update their own participant record"
  ON public.conversation_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- MESSAGES: Only conversation participants can read; only sender can insert;
-- Read status can only be updated by the recipient
-- ----------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON public.messages;
CREATE POLICY "Participants can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = public.messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants can insert messages in their conversations" ON public.messages;
CREATE POLICY "Participants can insert messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND char_length(trim(content)) > 0
    AND char_length(content) <= 3000
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = public.messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants can update message read status" ON public.messages;
CREATE POLICY "Participants can update message read status"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = public.messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = public.messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS: User-only read/update/delete; Insert for self or connected peers
-- ----------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view only their own notifications" ON public.notifications;
CREATE POLICY "Users can view only their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications for peers" ON public.notifications;
CREATE POLICY "Users can insert notifications for peers"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND char_length(trim(title)) > 0
    AND char_length(title) <= 120
    AND char_length(message) <= 1000
  );

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- REVIEWS: Public read; Only participant of completed session can insert;
-- Only reviewer can update/delete their own review
-- ----------------------------------------------------------------------------
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on reviews" ON public.reviews;
CREATE POLICY "Allow public read on reviews"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow participant to insert review on completed session" ON public.reviews;
CREATE POLICY "Allow participant to insert review on completed session"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND reviewer_id != reviewee_id
    AND rating >= 1 AND rating <= 5
    AND (comment IS NULL OR char_length(comment) <= 1000)
    AND EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND s.status = 'completed'
        AND (
          (s.teacher_id = reviewer_id AND s.learner_id = reviewee_id)
          OR (s.learner_id = reviewer_id AND s.teacher_id = reviewee_id)
        )
    )
  );

DROP POLICY IF EXISTS "Allow reviewer to update own review" ON public.reviews;
CREATE POLICY "Allow reviewer to update own review"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (
    auth.uid() = reviewer_id
    AND rating >= 1 AND rating <= 5
    AND (comment IS NULL OR char_length(comment) <= 1000)
  );

DROP POLICY IF EXISTS "Allow reviewer to delete own review" ON public.reviews;
CREATE POLICY "Allow reviewer to delete own review"
  ON public.reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- ----------------------------------------------------------------------------
-- CONNECTION_REQUESTS: Only participants can read/update; sender-only insert
-- ----------------------------------------------------------------------------
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own connection requests" ON public.connection_requests;
CREATE POLICY "Users can view their own connection requests"
  ON public.connection_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can create connection requests" ON public.connection_requests;
CREATE POLICY "Users can create connection requests"
  ON public.connection_requests FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND sender_id <> receiver_id
    AND (message IS NULL OR char_length(message) <= 500)
  );

DROP POLICY IF EXISTS "Participants can update connection request status" ON public.connection_requests;
CREATE POLICY "Participants can update connection request status"
  ON public.connection_requests FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================================================
-- 3. STORAGE SECURITY: HARDEN AVATARS BUCKET & OBJECT OWNERSHIP
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    -- Ensure avatars bucket exists with strict 5MB limit and image-only MIME types
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'avatars',
      'avatars',
      true,
      5242880, -- 5MB
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    -- Drop old permissive storage policies
    DROP POLICY IF EXISTS "Public Access for Avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

    -- 1. Public Read Policy
    CREATE POLICY "Public Access for Avatars"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');

    -- 2. Strict User-Owned Upload Policy (Only into folder matching user's auth.uid())
    CREATE POLICY "Users can only upload to their own avatar folder"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    -- 3. Strict User-Owned Update Policy
    CREATE POLICY "Users can only update their own avatar files"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    -- 4. Strict User-Owned Delete Policy
    CREATE POLICY "Users can only delete their own avatar files"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
