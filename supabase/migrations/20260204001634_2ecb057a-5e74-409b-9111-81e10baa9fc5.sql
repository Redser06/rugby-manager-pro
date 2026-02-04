-- Create coach profiles table
CREATE TABLE public.coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  date_of_birth DATE,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('rookie', 'developing', 'experienced', 'veteran', 'legendary')),
  specialization TEXT NOT NULL CHECK (specialization IN ('attack', 'defense', 'set_pieces', 'conditioning', 'balanced')),
  team_id TEXT, -- Links to in-game team ID
  avatar_url TEXT,
  career_started_season INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create game saves table
CREATE TABLE public.game_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  coach_profile_id UUID REFERENCES public.coach_profiles(id) ON DELETE CASCADE,
  slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 5),
  slot_name TEXT NOT NULL DEFAULT 'Save Game',
  game_state JSONB NOT NULL,
  current_week INTEGER NOT NULL DEFAULT 1,
  current_season INTEGER NOT NULL DEFAULT 1,
  team_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, slot_number)
);

-- Create AI coaches table for other teams
CREATE TABLE public.ai_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('head_coach', 'attack_coach', 'defense_coach', 'scrum_coach', 'skills_coach')),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('rookie', 'developing', 'experienced', 'veteran', 'legendary')),
  specialization TEXT NOT NULL CHECK (specialization IN ('attack', 'defense', 'set_pieces', 'conditioning', 'balanced')),
  reputation INTEGER DEFAULT 50 CHECK (reputation BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coaches ENABLE ROW LEVEL SECURITY;

-- Helper function to check profile ownership
CREATE OR REPLACE FUNCTION public.user_owns_profile(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_profiles
    WHERE id = profile_id AND user_id = auth.uid()
  )
$$;

-- Helper function to check game save ownership
CREATE OR REPLACE FUNCTION public.user_owns_game_save(save_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_saves
    WHERE id = save_id AND user_id = auth.uid()
  )
$$;

-- RLS Policies for coach_profiles
CREATE POLICY "Users can view all coach profiles"
ON public.coach_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own profile"
ON public.coach_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.coach_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
ON public.coach_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for game_saves
CREATE POLICY "Users can view their own saves"
ON public.game_saves FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saves"
ON public.game_saves FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saves"
ON public.game_saves FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves"
ON public.game_saves FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for ai_coaches (read-only for authenticated users)
CREATE POLICY "Anyone can view AI coaches"
ON public.ai_coaches FOR SELECT
TO authenticated
USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER handle_coach_profiles_updated_at
BEFORE UPDATE ON public.coach_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_game_saves_updated_at
BEFORE UPDATE ON public.game_saves
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();