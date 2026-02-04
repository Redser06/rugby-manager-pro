import { Json } from '@/integrations/supabase/types';

export type ExperienceLevel = 'rookie' | 'developing' | 'experienced' | 'veteran' | 'legendary';
export type Specialization = 'attack' | 'defense' | 'set_pieces' | 'conditioning' | 'balanced';
export type CoachRole = 'head_coach' | 'attack_coach' | 'defense_coach' | 'scrum_coach' | 'skills_coach';

export interface CoachProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  nationality: string;
  date_of_birth?: string;
  experience_level: ExperienceLevel;
  specialization: Specialization;
  team_id?: string;
  avatar_url?: string;
  career_started_season: number;
  created_at: string;
  updated_at: string;
}

export interface AICoach {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  nationality: string;
  role: CoachRole;
  experience_level: ExperienceLevel;
  specialization: Specialization;
  reputation: number;
  created_at: string;
}

export interface GameSave {
  id: string;
  user_id: string;
  coach_profile_id: string;
  slot_number: number;
  slot_name: string;
  game_state: Json;
  current_week: number;
  current_season: number;
  team_name?: string;
  created_at: string;
  updated_at: string;
}

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'rookie', label: 'Rookie' },
  { value: 'developing', label: 'Developing' },
  { value: 'experienced', label: 'Experienced' },
  { value: 'veteran', label: 'Veteran' },
  { value: 'legendary', label: 'Legendary' }
];

export const SPECIALIZATIONS: { value: Specialization; label: string; description: string }[] = [
  { value: 'attack', label: 'Attack', description: 'Focuses on offensive plays and scoring' },
  { value: 'defense', label: 'Defense', description: 'Focuses on defensive organization and tackling' },
  { value: 'set_pieces', label: 'Set Pieces', description: 'Expert in scrums, lineouts, and restarts' },
  { value: 'conditioning', label: 'Conditioning', description: 'Prioritizes fitness and endurance' },
  { value: 'balanced', label: 'Balanced', description: 'Well-rounded approach to coaching' }
];

export const COACH_ROLES: { value: CoachRole; label: string }[] = [
  { value: 'head_coach', label: 'Head Coach' },
  { value: 'attack_coach', label: 'Attack Coach' },
  { value: 'defense_coach', label: 'Defense Coach' },
  { value: 'scrum_coach', label: 'Scrum Coach' },
  { value: 'skills_coach', label: 'Skills Coach' }
];
