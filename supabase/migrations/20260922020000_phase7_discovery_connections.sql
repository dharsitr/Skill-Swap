-- SkillSwap Phase 7: Connection Requests & Discovery
-- Description: Migration creating connection_requests table with RLS policies and performance indexes.

-- 1. CONNECTION_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT connection_requests_distinct CHECK (sender_id <> receiver_id),
  CONSTRAINT connection_requests_unique_pair UNIQUE (sender_id, receiver_id)
);

-- 2. UPDATED_AT TRIGGER
CREATE TRIGGER set_connection_requests_updated_at
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. INDEXES FOR FAST LOOKUP & STATUS CHECKS
CREATE INDEX IF NOT EXISTS idx_connection_requests_sender ON public.connection_requests (sender_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_receiver ON public.connection_requests (receiver_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON public.connection_requests (status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_pair ON public.connection_requests (sender_id, receiver_id, status);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

-- Senders and receivers can view their requests
CREATE POLICY "Users can view their own connection requests"
  ON public.connection_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Authenticated users can send a connection request
CREATE POLICY "Users can create connection requests"
  ON public.connection_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Senders can cancel and receivers can accept or decline
CREATE POLICY "Participants can update connection request status"
  ON public.connection_requests FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);
