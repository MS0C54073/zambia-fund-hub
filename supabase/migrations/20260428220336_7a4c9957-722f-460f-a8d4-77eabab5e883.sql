
-- Error log capture for admin observability
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  category TEXT NOT NULL CHECK (category IN ('rpc', 'rls', 'payment', 'transaction', 'auth', 'other')),
  source TEXT,
  message TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON public.error_logs (category);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Any signed-in user can write their own error rows (used by client-side capture)
CREATE POLICY "Users insert own error logs"
ON public.error_logs FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Only admins can read
CREATE POLICY "Admins view error logs"
ON public.error_logs FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can delete (for log cleanup)
CREATE POLICY "Admins delete error logs"
ON public.error_logs FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Convenience RPC: caller-context aware logger
CREATE OR REPLACE FUNCTION public.log_error(
  _category TEXT,
  _message TEXT,
  _source TEXT DEFAULT NULL,
  _context JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  INSERT INTO public.error_logs (user_id, category, source, message, context)
  VALUES (auth.uid(), _category, _source, _message, _context)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_error(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_error(TEXT, TEXT, TEXT, JSONB) TO authenticated;
