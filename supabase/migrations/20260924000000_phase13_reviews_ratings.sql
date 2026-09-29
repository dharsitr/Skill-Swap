-- Phase 13: Reviews & Ratings for Completed Sessions
-- Migration: 20260924000000_phase13_reviews_ratings.sql

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (comment IS NULL OR length(comment) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_session_reviewer UNIQUE (session_id, reviewer_id),
  CONSTRAINT reviewer_not_reviewee CHECK (reviewer_id != reviewee_id)
);

-- 2. Indexes for fast aggregation and lookup
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_session ON public.reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: Public / Authenticated read
CREATE POLICY "Allow public read on reviews"
  ON public.reviews
  FOR SELECT
  USING (true);

-- INSERT: Only a participant of a completed session can review the other participant
CREATE POLICY "Allow participant to insert review on completed session"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND reviewer_id != reviewee_id
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

-- UPDATE: Only reviewer can edit their own review
CREATE POLICY "Allow reviewer to update own review"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- DELETE: Only reviewer can delete their own review
CREATE POLICY "Allow reviewer to delete own review"
  ON public.reviews
  FOR DELETE
  USING (auth.uid() = reviewer_id);

-- 4. Automatically update updated_at timestamp on edit
CREATE OR REPLACE FUNCTION public.set_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_reviews_updated_at ON public.reviews;
CREATE TRIGGER trigger_set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_reviews_updated_at();

-- 5. Stored function to get user rating summary dynamically
CREATE OR REPLACE FUNCTION public.get_user_rating_summary(p_user_id UUID)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews BIGINT,
  five_star BIGINT,
  four_star BIGINT,
  three_star BIGINT,
  two_star BIGINT,
  one_star BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0) AS average_rating,
    COUNT(*)::bigint AS total_reviews,
    COUNT(*) FILTER (WHERE rating = 5)::bigint AS five_star,
    COUNT(*) FILTER (WHERE rating = 4)::bigint AS four_star,
    COUNT(*) FILTER (WHERE rating = 3)::bigint AS three_star,
    COUNT(*) FILTER (WHERE rating = 2)::bigint AS two_star,
    COUNT(*) FILTER (WHERE rating = 1)::bigint AS one_star
  FROM public.reviews
  WHERE reviewee_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add reviews table to realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
