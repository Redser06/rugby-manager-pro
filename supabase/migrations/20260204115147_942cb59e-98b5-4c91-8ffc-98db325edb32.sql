-- Drop the SECURITY DEFINER function - we'll handle cleanup differently
DROP FUNCTION IF EXISTS public.cleanup_old_rate_limits();