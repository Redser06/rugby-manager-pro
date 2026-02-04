-- Create rate_limits table for tracking API usage
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can insert their own rate limit records
CREATE POLICY "Users can insert their own rate limits"
ON public.rate_limits FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create index for efficient lookups
CREATE INDEX idx_rate_limits_user_endpoint_time 
ON public.rate_limits(user_id, endpoint, created_at DESC);

-- Create function to clean up old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '24 hours';
$$;