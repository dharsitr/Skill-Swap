-- Phase 12: Notifications & Scheduling Migration
-- Extends notifications table with link_url, reference_id, deduplication, and automated reminder functions

-- 1. Extend notifications table
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link_url TEXT,
  ADD COLUMN IF NOT EXISTS reference_id UUID;

-- 2. Indexes for fast retrieval and deduplication
CREATE INDEX IF NOT EXISTS idx_notifications_user_reference
  ON public.notifications(user_id, type, reference_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications(created_at DESC);

-- 3. Update Row Level Security Policies
DROP POLICY IF EXISTS "Users can insert notifications for peers" ON public.notifications;
CREATE POLICY "Users can insert notifications for peers"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 4. Atomic Stored Function: create_notification
-- Creates a notification with optional deduplication based on user_id, type, and reference_id
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link_url TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notif_id UUID;
BEGIN
  -- Prevent duplicate notifications if reference_id is provided
  IF p_reference_id IS NOT NULL THEN
    SELECT id INTO v_notif_id
    FROM public.notifications
    WHERE user_id = p_user_id
      AND type = p_type
      AND reference_id = p_reference_id
    LIMIT 1;

    IF v_notif_id IS NOT NULL THEN
      RETURN v_notif_id;
    END IF;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link_url,
    reference_id,
    read,
    created_at
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link_url,
    p_reference_id,
    false,
    now()
  )
  RETURNING id INTO v_notif_id;

  RETURN v_notif_id;
END;
$$;

-- 5. Stored Function: check_and_create_session_reminders
-- Scans confirmed sessions in the next 24 hours for a user and creates reminder notifications
CREATE OR REPLACE FUNCTION public.check_and_create_session_reminders(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_count INTEGER := 0;
  v_partner_name TEXT;
  v_skill_name TEXT;
  v_scheduled_formatted TEXT;
BEGIN
  -- Find confirmed sessions starting within the next 24 hours that haven't passed
  FOR v_session IN
    SELECT
      s.id,
      s.teacher_id,
      s.learner_id,
      s.scheduled_at,
      s.duration,
      sk.name as skill_name,
      tp.display_name as teacher_name,
      lp.display_name as learner_name
    FROM public.sessions s
    JOIN public.skills sk ON s.skill_id = sk.id
    JOIN public.profiles tp ON s.teacher_id = tp.id
    JOIN public.profiles lp ON s.learner_id = lp.id
    WHERE (s.teacher_id = p_user_id OR s.learner_id = p_user_id)
      AND s.status = 'confirmed'
      AND s.scheduled_at >= now()
      AND s.scheduled_at <= (now() + interval '24 hours')
  LOOP
    -- Format date/time
    v_scheduled_formatted := to_char(v_session.scheduled_at, 'Dy, Mon DD at HH12:MI AM');
    v_skill_name := v_session.skill_name;

    IF v_session.teacher_id = p_user_id THEN
      v_partner_name := v_session.learner_name;
    ELSE
      v_partner_name := v_session.teacher_name;
    END IF;

    -- Check if reminder already created for this session and user
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = p_user_id
        AND type = 'session_reminder'
        AND reference_id = v_session.id
    ) THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        link_url,
        reference_id,
        read,
        created_at
      ) VALUES (
        p_user_id,
        'session_reminder',
        'Upcoming Session Reminder',
        'Your ' || v_skill_name || ' swap with ' || v_partner_name || ' is scheduled for ' || v_scheduled_formatted || '.',
        '/dashboard/sessions/' || v_session.id || '/room',
        v_session.id,
        false,
        now()
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 6. Enable Realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
