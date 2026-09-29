-- SkillSwap Phase 9: Sessions & Booking System
-- Description: Updates sessions table check constraints, indexes, and creates atomic RPC functions for booking, confirmation, cancellation, rejection, and completion with credit lifecycle.

-- 1. SESSIONS TABLE ALTERATIONS
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS credit_amount INTEGER NOT NULL DEFAULT 10;

-- Drop existing status check constraint and re-add with 'rejected'
ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_status_check;

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected'));

-- 2. COLLISION & OVERLAP INDEXES
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_schedule
  ON public.sessions (teacher_id, scheduled_at, status);

CREATE INDEX IF NOT EXISTS idx_sessions_learner_schedule
  ON public.sessions (learner_id, scheduled_at, status);

-- 3. BOOK SESSION RPC FUNCTION
CREATE OR REPLACE FUNCTION public.book_session(
  p_teacher_id UUID,
  p_learner_id UUID,
  p_skill_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_duration INTEGER DEFAULT 30,
  p_credit_amount INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_learner_balance INTEGER;
  v_overlap_count INTEGER;
BEGIN
  -- Authenticated user must be the learner
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_learner_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only book sessions for yourself as the learner';
  END IF;

  -- Cannot book oneself
  IF p_teacher_id = p_learner_id THEN
    RAISE EXCEPTION 'Invalid booking: Teacher and learner cannot be the same user';
  END IF;

  -- Must be in the future
  IF p_scheduled_at <= timezone('utc'::text, now()) THEN
    RAISE EXCEPTION 'Invalid booking time: Scheduled time must be in the future';
  END IF;

  -- Check learner credit balance
  SELECT balance INTO v_learner_balance
  FROM public.credits
  WHERE user_id = p_learner_id;

  IF v_learner_balance IS NULL OR v_learner_balance < p_credit_amount THEN
    RAISE EXCEPTION 'Insufficient credits: You need at least % credits to book this session', p_credit_amount;
  END IF;

  -- Check collision / overlapping sessions for teacher or learner
  SELECT COUNT(*) INTO v_overlap_count
  FROM public.sessions
  WHERE (teacher_id = p_teacher_id OR learner_id = p_teacher_id OR teacher_id = p_learner_id OR learner_id = p_learner_id)
    AND scheduled_at = p_scheduled_at
    AND status IN ('pending', 'confirmed');

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'Time slot unavailable: A session is already scheduled at this time for one of the participants';
  END IF;

  -- Insert pending session
  INSERT INTO public.sessions (
    teacher_id,
    learner_id,
    skill_id,
    scheduled_at,
    duration,
    credit_amount,
    status
  )
  VALUES (
    p_teacher_id,
    p_learner_id,
    p_skill_id,
    p_scheduled_at,
    p_duration,
    p_credit_amount,
    'pending'
  )
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'status', 'pending',
    'scheduled_at', p_scheduled_at,
    'credit_amount', p_credit_amount
  );
END;
$$;

-- 4. CONFIRM SESSION RPC FUNCTION (Teacher confirms, learner credits deducted)
CREATE OR REPLACE FUNCTION public.confirm_session(
  p_session_id UUID,
  p_caller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_skill_name TEXT;
  v_credit_res JSONB;
BEGIN
  -- Fetch session with row lock
  SELECT s.*, sk.name AS skill_name
  INTO v_session
  FROM public.sessions s
  LEFT JOIN public.skills sk ON sk.id = s.skill_id
  WHERE s.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Only teacher can confirm
  IF auth.uid() IS NOT NULL AND auth.uid() <> v_session.teacher_id THEN
    RAISE EXCEPTION 'Unauthorized: Only the teacher can confirm this session request';
  END IF;

  IF v_session.status <> 'pending' THEN
    RAISE EXCEPTION 'Cannot confirm session: Current status is %', v_session.status;
  END IF;

  -- Deduct credits from learner atomically
  v_skill_name := COALESCE(v_session.skill_name, 'Skill Swap');
  v_credit_res := public.process_credit_transaction(
    v_session.learner_id,
    -v_session.credit_amount,
    'learn_spend',
    'Confirmed learning session: ' || v_skill_name,
    p_session_id
  );

  -- Update session status
  UPDATE public.sessions
  SET status = 'confirmed',
      updated_at = timezone('utc'::text, now())
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'status', 'confirmed',
    'learner_balance', (v_credit_res->>'balance')::INTEGER
  );
END;
$$;

-- 5. CANCEL SESSION RPC FUNCTION (Refunds learner if confirmed)
CREATE OR REPLACE FUNCTION public.cancel_session(
  p_session_id UUID,
  p_caller_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_skill_name TEXT;
  v_credit_res JSONB;
BEGIN
  SELECT s.*, sk.name AS skill_name
  INTO v_session
  FROM public.sessions s
  LEFT JOIN public.skills sk ON sk.id = s.skill_id
  WHERE s.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Caller must be teacher or learner
  IF auth.uid() IS NOT NULL AND auth.uid() NOT IN (v_session.teacher_id, v_session.learner_id) THEN
    RAISE EXCEPTION 'Unauthorized: You are not a participant in this session';
  END IF;

  IF v_session.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Cannot cancel session: Current status is %', v_session.status;
  END IF;

  -- If session was confirmed, refund credits to learner
  IF v_session.status = 'confirmed' THEN
    v_skill_name := COALESCE(v_session.skill_name, 'Skill Swap');
    v_credit_res := public.process_credit_transaction(
      v_session.learner_id,
      v_session.credit_amount,
      'refund',
      'Refund for cancelled session: ' || v_skill_name,
      p_session_id
    );
  END IF;

  -- Update session status
  UPDATE public.sessions
  SET status = 'cancelled',
      updated_at = timezone('utc'::text, now())
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'status', 'cancelled',
    'refunded', (v_session.status = 'confirmed')
  );
END;
$$;

-- 6. REJECT SESSION RPC FUNCTION (Teacher declines pending request)
CREATE OR REPLACE FUNCTION public.reject_session(
  p_session_id UUID,
  p_caller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session
  FROM public.sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> v_session.teacher_id THEN
    RAISE EXCEPTION 'Unauthorized: Only the teacher can decline this request';
  END IF;

  IF v_session.status <> 'pending' THEN
    RAISE EXCEPTION 'Cannot decline session: Current status is %', v_session.status;
  END IF;

  UPDATE public.sessions
  SET status = 'rejected',
      updated_at = timezone('utc'::text, now())
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'status', 'rejected'
  );
END;
$$;

-- 7. COMPLETE SESSION RPC FUNCTION (Awards teacher credits)
CREATE OR REPLACE FUNCTION public.complete_session(
  p_session_id UUID,
  p_caller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_skill_name TEXT;
  v_credit_res JSONB;
BEGIN
  SELECT s.*, sk.name AS skill_name
  INTO v_session
  FROM public.sessions s
  LEFT JOIN public.skills sk ON sk.id = s.skill_id
  WHERE s.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Caller must be teacher or learner
  IF auth.uid() IS NOT NULL AND auth.uid() NOT IN (v_session.teacher_id, v_session.learner_id) THEN
    RAISE EXCEPTION 'Unauthorized: You are not a participant in this session';
  END IF;

  IF v_session.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Cannot complete session: Current status is %', v_session.status;
  END IF;

  -- Reward teacher with teaching credits (process_credit_transaction has duplicate prevention)
  v_skill_name := COALESCE(v_session.skill_name, 'Skill Swap');
  v_credit_res := public.process_credit_transaction(
    v_session.teacher_id,
    v_session.credit_amount,
    'teach_reward',
    'Completed teaching session: ' || v_skill_name,
    p_session_id
  );

  -- Update session status
  UPDATE public.sessions
  SET status = 'completed',
      updated_at = timezone('utc'::text, now())
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'status', 'completed',
    'teacher_rewarded', true
  );
END;
$$;
