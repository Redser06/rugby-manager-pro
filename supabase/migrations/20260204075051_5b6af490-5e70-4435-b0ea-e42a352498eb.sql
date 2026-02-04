-- Convert SECURITY DEFINER functions to SECURITY INVOKER to reduce privilege escalation risk
-- These functions are currently unused and the RLS policies already enforce ownership

CREATE OR REPLACE FUNCTION public.user_owns_profile(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_profiles
    WHERE id = profile_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.user_owns_game_save(save_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_saves
    WHERE id = save_id AND user_id = auth.uid()
  )
$$;