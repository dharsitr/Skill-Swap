-- SkillSwap Phase 8: Credit System & Transaction Ledger
-- Description: Creates credit_transactions table, indexes, RLS policies, and secure atomic RPC function process_credit_transaction.

-- 1. CREDIT_TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('welcome_bonus', 'teach_reward', 'learn_spend', 'refund', 'adjustment')),
  description TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_ref ON public.credit_transactions (user_id, reference_id, transaction_type);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view ONLY their own credit transactions
CREATE POLICY "Users can view only their own credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Direct client modifications are forbidden. All transactions run through process_credit_transaction.

-- 4. SECURE ATOMIC RPC FUNCTION FOR CREDIT MUTATIONS
CREATE OR REPLACE FUNCTION public.process_credit_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
  v_existing_tx UUID;
BEGIN
  -- Security check: callers can only mutate their own credits unless service role
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify credit balance of another user';
  END IF;

  -- Validate transaction type
  IF p_transaction_type NOT IN ('welcome_bonus', 'teach_reward', 'learn_spend', 'refund', 'adjustment') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
  END IF;

  -- Prevent duplicate credit reward if reference_id is provided for non-adjustment rewards
  IF p_reference_id IS NOT NULL AND p_amount > 0 THEN
    SELECT id INTO v_existing_tx
    FROM public.credit_transactions
    WHERE user_id = p_user_id
      AND reference_id = p_reference_id
      AND transaction_type = p_transaction_type
    LIMIT 1;

    IF v_existing_tx IS NOT NULL THEN
      RAISE EXCEPTION 'Duplicate credit reward already processed for reference: %', p_reference_id;
    END IF;
  END IF;

  -- Ensure credits row exists for user (create with 0 if missing)
  INSERT INTO public.credits (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock row for update to guarantee atomicity and prevent race conditions
  SELECT balance INTO v_current_balance
  FROM public.credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Negative balance prevention check
  v_new_balance := v_current_balance + p_amount;
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient credits: Current balance is %, requested spend is %', v_current_balance, ABS(p_amount);
  END IF;

  -- Update credit balance
  UPDATE public.credits
  SET balance = v_new_balance,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id;

  -- Record transaction ledger entry
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    reference_id
  )
  VALUES (
    p_user_id,
    p_amount,
    p_transaction_type,
    p_description,
    p_reference_id
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'balance', v_new_balance,
    'previous_balance', v_current_balance,
    'amount', p_amount
  );
END;
$$;

-- 5. UPDATE ONBOARDING TRIGGER TO AWARD 50 CREDITS AND LOG TRANSACTION
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
  VALUES (NEW.id, 50)
  ON CONFLICT (user_id) DO UPDATE SET balance = GREATEST(credits.balance, 50);

  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (NEW.id, 50, 'welcome_bonus', 'Welcome to SkillSwap! Free starter credits to begin learning.')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
