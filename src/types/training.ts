// Training Unit Groups
export type UnitGroup = 
  | 'squad'
  | 'forwards' 
  | 'backs'
  | 'front_row'
  | 'second_row'
  | 'back_row'
  | 'halfbacks'
  | 'midfield'
  | 'back_three';

export const UNIT_GROUPS: Record<UnitGroup, { name: string; positions: number[] }> = {
  squad: { name: 'Full Squad', positions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  forwards: { name: 'Forwards', positions: [1, 2, 3, 4, 5, 6, 7, 8] },
  backs: { name: 'Backs', positions: [9, 10, 11, 12, 13, 14, 15] },
  front_row: { name: 'Front Row', positions: [1, 2, 3] },
  second_row: { name: 'Second Row / Locks', positions: [4, 5] },
  back_row: { name: 'Back Row', positions: [6, 7, 8] },
  halfbacks: { name: 'Halfbacks (9 & 10)', positions: [9, 10] },
  midfield: { name: 'Midfield (12 & 13)', positions: [12, 13] },
  back_three: { name: 'Back Three', positions: [11, 14, 15] },
};

// S&C Focus Areas
export type SCFocusArea = 
  | 'speed'
  | 'flexibility'
  | 'strength'
  | 'endurance'
  | 'power'
  | 'agility'
  | 'jumping'
  | 'low_body'
  | 'core_stability'
  | 'recovery';

export const SC_FOCUS_AREAS: Record<SCFocusArea, { name: string; description: string; icon: string }> = {
  speed: { name: 'Speed', description: 'Sprint training, acceleration drills', icon: '⚡' },
  flexibility: { name: 'Flexibility', description: 'Mobility, stretching, yoga', icon: '🧘' },
  strength: { name: 'Strength', description: 'Weightlifting, resistance training', icon: '💪' },
  endurance: { name: 'Endurance', description: 'Cardio, stamina building', icon: '❤️' },
  power: { name: 'Power', description: 'Explosive movements, plyometrics', icon: '🔥' },
  agility: { name: 'Agility', description: 'Change of direction, footwork', icon: '🦿' },
  jumping: { name: 'Jumping / Lineout', description: 'Vertical leap, aerial dominance', icon: '🦘' },
  low_body: { name: 'Low Body Position', description: 'Tackle height, ruck technique', icon: '⬇️' },
  core_stability: { name: 'Core Stability', description: 'Balance, collision readiness', icon: '🎯' },
  recovery: { name: 'Recovery', description: 'Active recovery, regeneration', icon: '🧊' },
};

// Training Session Types
export type TrainingSessionType = 
  | 'skills'
  | 'tactical'
  | 'set_piece'
  | 'contact'
  | 'conditioning'
  | 'recovery'
  | 'match_prep'
  | 'video_analysis';

export const TRAINING_SESSION_TYPES: Record<TrainingSessionType, { name: string; description: string }> = {
  skills: { name: 'Skills Session', description: 'Technical skill development' },
  tactical: { name: 'Tactical Session', description: 'Game plan and patterns' },
  set_piece: { name: 'Set Piece', description: 'Scrum, lineout, restarts' },
  contact: { name: 'Contact Session', description: 'Tackling, rucking, mauling' },
  conditioning: { name: 'Conditioning', description: 'Fitness and endurance work' },
  recovery: { name: 'Recovery Session', description: 'Light work, stretching' },
  match_prep: { name: 'Match Preparation', description: 'Opposition-specific prep' },
  video_analysis: { name: 'Video Analysis', description: 'Review and learning' },
};

// Macro Cycle Phases
export type MacroPhase = 
  | 'pre_season_foundation'
  | 'pre_season_build'
  | 'pre_season_peak'
  | 'early_season'
  | 'mid_season'
  | 'late_season'
  | 'playoffs'
  | 'off_season';

export const MACRO_PHASES: Record<MacroPhase, { name: string; description: string; weeks: number; intensity: number }> = {
  pre_season_foundation: { name: 'Pre-Season Foundation', description: 'Base fitness and strength building', weeks: 4, intensity: 60 },
  pre_season_build: { name: 'Pre-Season Build', description: 'Progressive overload, skill integration', weeks: 3, intensity: 75 },
  pre_season_peak: { name: 'Pre-Season Peak', description: 'Match simulation, final prep', weeks: 2, intensity: 90 },
  early_season: { name: 'Early Season', description: 'Maintain fitness, focus on match demands', weeks: 8, intensity: 80 },
  mid_season: { name: 'Mid Season', description: 'Recovery balance, maintain performance', weeks: 8, intensity: 70 },
  late_season: { name: 'Late Season', description: 'Push for playoffs, injury management', weeks: 6, intensity: 75 },
  playoffs: { name: 'Playoffs', description: 'Peak performance, minimal volume', weeks: 4, intensity: 85 },
  off_season: { name: 'Off Season', description: 'Active recovery, address weaknesses', weeks: 6, intensity: 40 },
};

// Exercise definition
export interface Exercise {
  id: string;
  name: string;
  category: SCFocusArea;
  description: string;
  duration: number; // minutes
  intensity: 'low' | 'medium' | 'high' | 'max';
  equipment: string[];
  positionBenefits: number[]; // Position numbers that benefit most
}

// S&C Session
export interface SCSession {
  id: string;
  name: string;
  focusAreas: SCFocusArea[];
  exercises: Exercise[];
  totalDuration: number;
  intensity: number; // 1-100
  targetGroup: UnitGroup | 'individual';
  notes: string;
}

// S&C Program (collection of sessions over time)
export interface SCProgram {
  id: string;
  name: string;
  description: string;
  phase: MacroPhase;
  weeklySchedule: WeeklySCSchedule;
  duration: number; // weeks
  isPreset: boolean;
  targetGroups: UnitGroup[];
}

export interface WeeklySCSchedule {
  monday?: SCSession;
  tuesday?: SCSession;
  wednesday?: SCSession;
  thursday?: SCSession;
  friday?: SCSession;
  saturday?: SCSession;
  sunday?: SCSession;
}

// Training Plan (rugby skills/tactics)
export interface TrainingSession {
  id: string;
  name: string;
  type: TrainingSessionType;
  duration: number; // minutes
  intensity: number; // 1-100
  description: string;
  drills: TrainingDrill[];
  targetGroup: UnitGroup | 'individual';
  playerIds?: string[]; // For individual training
}

export interface TrainingDrill {
  id: string;
  name: string;
  duration: number;
  description: string;
  focusAttributes: string[]; // Which attributes this drill improves
}

export interface WeeklyTrainingSchedule {
  monday?: TrainingSession[];
  tuesday?: TrainingSession[];
  wednesday?: TrainingSession[];
  thursday?: TrainingSession[];
  friday?: TrainingSession[];
  saturday?: TrainingSession[];
  sunday?: TrainingSession[];
}

// Macro Cycle
export interface MacroCycle {
  id: string;
  name: string;
  phase: MacroPhase;
  startWeek: number;
  endWeek: number;
  scProgram: SCProgram;
  weeklyPlans: WeeklyPlan[];
  goals: string[];
}

export interface WeeklyPlan {
  weekNumber: number;
  trainingSchedule: WeeklyTrainingSchedule;
  scSchedule: WeeklySCSchedule;
  matchDay?: 'saturday' | 'sunday' | 'friday';
  loadTarget: number; // 1-100
  notes: string;
}

// Training State
export interface TrainingState {
  macroCycles: MacroCycle[];
  activeMacroCycle: string | null;
  currentWeek: number;
  scPrograms: SCProgram[];
  trainingSessions: TrainingSession[];
  individualPlans: Map<string, TrainingSession[]>;
}

// Training Effects
export interface TrainingEffect {
  attributeKey: string;
  improvement: number; // Positive for boost, negative for fatigue
  duration: number; // Weeks the effect lasts
}

export interface PlayerTrainingStatus {
  playerId: string;
  form: number; // 1-10
  fitness: number; // 0-100
  fatigue: number; // 0-100
  injuryRisk: number; // 0-100
  activeEffects: TrainingEffect[];
  weeklyLoad: number;
}
