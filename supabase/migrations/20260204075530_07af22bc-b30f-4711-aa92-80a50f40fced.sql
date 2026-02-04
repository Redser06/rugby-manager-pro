-- Fix coach_profiles public exposure - restrict SELECT to own profile only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all coach profiles" ON public.coach_profiles;

-- Create a new policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.coach_profiles
FOR SELECT
USING (auth.uid() = user_id);