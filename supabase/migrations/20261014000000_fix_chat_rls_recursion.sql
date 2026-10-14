-- Description: Fix infinite recursion in conversation_participants and chat RLS policies
-- When conversation_participants queried itself in its SELECT policy, Postgres threw error 42P17.
-- We introduce a SECURITY DEFINER helper function to safely verify participant membership without triggering RLS recursion.

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
  );
$$;

DROP POLICY IF EXISTS "Participants can view conversation members" ON public.conversation_participants;
CREATE POLICY "Participants can view conversation members"
  ON public.conversation_participants FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR is_conversation_participant(conversation_id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "Users can insert participants when creating conversation" ON public.conversation_participants;
CREATE POLICY "Users can insert participants when creating conversation"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      user_id = (select auth.uid())
      OR is_conversation_participant(conversation_id, (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON public.messages;
CREATE POLICY "Participants can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    is_conversation_participant(conversation_id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "Participants can insert messages in their conversations" ON public.messages;
CREATE POLICY "Participants can insert messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = (select auth.uid())
    AND char_length(trim(content)) > 0
    AND char_length(content) <= 3000
    AND is_conversation_participant(conversation_id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "Participants can update message read status" ON public.messages;
CREATE POLICY "Participants can update message read status"
  ON public.messages FOR UPDATE
  USING (
    is_conversation_participant(conversation_id, (select auth.uid()))
  )
  WITH CHECK (
    is_conversation_participant(conversation_id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;
CREATE POLICY "Participants can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    is_conversation_participant(id, (select auth.uid()))
  );
