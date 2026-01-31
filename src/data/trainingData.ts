import { 
  Exercise, 
  SCSession, 
  SCProgram, 
  TrainingDrill, 
  TrainingSession,
  SCFocusArea,
  MacroPhase 
} from '@/types/training';

// Preset Exercises
export const PRESET_EXERCISES: Exercise[] = [
  // Speed
  { id: 'ex1', name: '40m Sprints', category: 'speed', description: 'Flat-out 40m sprints with full recovery', duration: 15, intensity: 'max', equipment: [], positionBenefits: [9, 10, 11, 13, 14, 15] },
  { id: 'ex2', name: 'Acceleration Ladders', category: 'speed', description: 'Progressive acceleration through markers', duration: 12, intensity: 'high', equipment: ['cones'], positionBenefits: [6, 7, 9, 11, 14] },
  { id: 'ex3', name: 'Flying 20s', category: 'speed', description: 'Build-up run into 20m max sprint', duration: 10, intensity: 'max', equipment: [], positionBenefits: [11, 14, 15] },
  
  // Strength
  { id: 'ex4', name: 'Back Squats', category: 'strength', description: 'Heavy compound lower body strength', duration: 20, intensity: 'high', equipment: ['barbell', 'squat rack'], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8] },
  { id: 'ex5', name: 'Bench Press', category: 'strength', description: 'Upper body pushing strength', duration: 15, intensity: 'high', equipment: ['barbell', 'bench'], positionBenefits: [1, 2, 3, 4, 5] },
  { id: 'ex6', name: 'Deadlifts', category: 'strength', description: 'Full posterior chain development', duration: 20, intensity: 'high', equipment: ['barbell'], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8] },
  { id: 'ex7', name: 'Romanian Deadlifts', category: 'strength', description: 'Hamstring and glute focus', duration: 15, intensity: 'medium', equipment: ['barbell'], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8, 11, 14, 15] },
  
  // Power
  { id: 'ex8', name: 'Power Cleans', category: 'power', description: 'Olympic lift for explosive power', duration: 20, intensity: 'high', equipment: ['barbell'], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8] },
  { id: 'ex9', name: 'Box Jumps', category: 'power', description: 'Plyometric lower body power', duration: 12, intensity: 'high', equipment: ['plyo box'], positionBenefits: [4, 5, 6, 7, 8, 11, 14, 15] },
  { id: 'ex10', name: 'Medicine Ball Throws', category: 'power', description: 'Rotational and linear power', duration: 10, intensity: 'medium', equipment: ['medicine ball'], positionBenefits: [9, 10, 12, 13] },
  
  // Endurance
  { id: 'ex11', name: '3km Time Trial', category: 'endurance', description: 'Aerobic base testing', duration: 15, intensity: 'high', equipment: [], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  { id: 'ex12', name: 'Repeated High Intensity', category: 'endurance', description: '10x100m with 30s recovery', duration: 20, intensity: 'high', equipment: [], positionBenefits: [6, 7, 9, 11, 14, 15] },
  { id: 'ex13', name: 'Bronco Test', category: 'endurance', description: 'Rugby-specific conditioning test', duration: 8, intensity: 'max', equipment: ['cones'], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  
  // Agility
  { id: 'ex14', name: 'Cone Agility Drills', category: 'agility', description: 'Multi-directional movement patterns', duration: 15, intensity: 'high', equipment: ['cones'], positionBenefits: [6, 7, 9, 10, 11, 12, 13, 14, 15] },
  { id: 'ex15', name: 'Reactive Agility', category: 'agility', description: 'Decision-based direction changes', duration: 12, intensity: 'high', equipment: ['cones'], positionBenefits: [9, 10, 12, 13, 15] },
  { id: 'ex16', name: 'Ladder Footwork', category: 'agility', description: 'Fast feet coordination', duration: 10, intensity: 'medium', equipment: ['agility ladder'], positionBenefits: [9, 10, 11, 12, 13, 14, 15] },
  
  // Jumping / Lineout
  { id: 'ex17', name: 'Depth Jumps', category: 'jumping', description: 'Reactive jumping power', duration: 12, intensity: 'high', equipment: ['plyo box'], positionBenefits: [4, 5, 6, 8] },
  { id: 'ex18', name: 'Single Leg Hops', category: 'jumping', description: 'Unilateral power development', duration: 10, intensity: 'medium', equipment: [], positionBenefits: [4, 5, 11, 14, 15] },
  { id: 'ex19', name: 'Lineout Simulation Jumps', category: 'jumping', description: 'Sport-specific vertical leap with timing', duration: 15, intensity: 'high', equipment: ['lineout simulator'], positionBenefits: [4, 5, 6, 8] },
  
  // Low Body Position
  { id: 'ex20', name: 'Tackle Bag Hits', category: 'low_body', description: 'Low body tackle technique', duration: 15, intensity: 'high', equipment: ['tackle bags'], positionBenefits: [1, 2, 3, 6, 7, 12, 13] },
  { id: 'ex21', name: 'Ruck Entry Drills', category: 'low_body', description: 'Low entry and body position at breakdown', duration: 12, intensity: 'high', equipment: ['ruck pads'], positionBenefits: [1, 2, 3, 6, 7, 8] },
  { id: 'ex22', name: 'Scrummaging Machine', category: 'low_body', description: 'Scrum technique and power', duration: 20, intensity: 'high', equipment: ['scrum machine'], positionBenefits: [1, 2, 3] },
  
  // Flexibility
  { id: 'ex23', name: 'Dynamic Warm-up', category: 'flexibility', description: 'Movement prep and mobility', duration: 15, intensity: 'low', equipment: [], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  { id: 'ex24', name: 'Hip Mobility Flow', category: 'flexibility', description: 'Rugby-specific hip opening', duration: 12, intensity: 'low', equipment: ['mat'], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8] },
  { id: 'ex25', name: 'Shoulder Mobility', category: 'flexibility', description: 'Upper body mobility for tackling', duration: 10, intensity: 'low', equipment: ['bands'], positionBenefits: [1, 2, 3, 4, 5, 12, 13] },
  
  // Core Stability
  { id: 'ex26', name: 'Anti-Rotation Holds', category: 'core_stability', description: 'Core stability under pressure', duration: 10, intensity: 'medium', equipment: ['cable machine'], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8, 12, 13] },
  { id: 'ex27', name: 'Pallof Press', category: 'core_stability', description: 'Dynamic core stability', duration: 8, intensity: 'medium', equipment: ['bands'], positionBenefits: [9, 10, 12, 13, 15] },
  { id: 'ex28', name: 'Collision Core Circuit', category: 'core_stability', description: 'Core work for contact situations', duration: 15, intensity: 'high', equipment: ['medicine ball', 'mat'], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8, 12, 13] },
  
  // Recovery
  { id: 'ex29', name: 'Pool Recovery', category: 'recovery', description: 'Low-impact water session', duration: 30, intensity: 'low', equipment: ['pool'], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  { id: 'ex30', name: 'Foam Rolling', category: 'recovery', description: 'Self-myofascial release', duration: 15, intensity: 'low', equipment: ['foam roller'], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  { id: 'ex31', name: 'Yoga Flow', category: 'recovery', description: 'Active recovery and breathing', duration: 45, intensity: 'low', equipment: ['mat'], positionBenefits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
];

// Preset S&C Sessions
export const PRESET_SC_SESSIONS: SCSession[] = [
  {
    id: 'sc1',
    name: 'Forward Power Session',
    focusAreas: ['strength', 'power', 'low_body'],
    exercises: [
      PRESET_EXERCISES.find(e => e.id === 'ex4')!, // Back Squats
      PRESET_EXERCISES.find(e => e.id === 'ex8')!, // Power Cleans
      PRESET_EXERCISES.find(e => e.id === 'ex22')!, // Scrummaging Machine
      PRESET_EXERCISES.find(e => e.id === 'ex21')!, // Ruck Entry
    ],
    totalDuration: 75,
    intensity: 85,
    targetGroup: 'forwards',
    notes: 'Focus on explosive power and low body positioning'
  },
  {
    id: 'sc2',
    name: 'Back Speed & Agility',
    focusAreas: ['speed', 'agility', 'power'],
    exercises: [
      PRESET_EXERCISES.find(e => e.id === 'ex1')!, // 40m Sprints
      PRESET_EXERCISES.find(e => e.id === 'ex14')!, // Cone Agility
      PRESET_EXERCISES.find(e => e.id === 'ex9')!, // Box Jumps
      PRESET_EXERCISES.find(e => e.id === 'ex16')!, // Ladder Footwork
    ],
    totalDuration: 60,
    intensity: 80,
    targetGroup: 'backs',
    notes: 'High tempo, focus on acceleration and change of direction'
  },
  {
    id: 'sc3',
    name: 'Full Squad Conditioning',
    focusAreas: ['endurance', 'agility'],
    exercises: [
      PRESET_EXERCISES.find(e => e.id === 'ex13')!, // Bronco Test
      PRESET_EXERCISES.find(e => e.id === 'ex12')!, // Repeated High Intensity
      PRESET_EXERCISES.find(e => e.id === 'ex15')!, // Reactive Agility
    ],
    totalDuration: 50,
    intensity: 90,
    targetGroup: 'squad',
    notes: 'Game simulation fitness demands'
  },
  {
    id: 'sc4',
    name: 'Lineout Power',
    focusAreas: ['jumping', 'power', 'core_stability'],
    exercises: [
      PRESET_EXERCISES.find(e => e.id === 'ex19')!, // Lineout Simulation
      PRESET_EXERCISES.find(e => e.id === 'ex17')!, // Depth Jumps
      PRESET_EXERCISES.find(e => e.id === 'ex26')!, // Anti-Rotation
      PRESET_EXERCISES.find(e => e.id === 'ex9')!, // Box Jumps
    ],
    totalDuration: 55,
    intensity: 75,
    targetGroup: 'second_row',
    notes: 'Vertical leap and timing focus'
  },
  {
    id: 'sc5',
    name: 'Recovery Session',
    focusAreas: ['recovery', 'flexibility'],
    exercises: [
      PRESET_EXERCISES.find(e => e.id === 'ex29')!, // Pool Recovery
      PRESET_EXERCISES.find(e => e.id === 'ex30')!, // Foam Rolling
      PRESET_EXERCISES.find(e => e.id === 'ex23')!, // Dynamic Warm-up
    ],
    totalDuration: 60,
    intensity: 30,
    targetGroup: 'squad',
    notes: 'Active recovery day'
  },
  {
    id: 'sc6',
    name: 'Front Row Strength',
    focusAreas: ['strength', 'low_body', 'core_stability'],
    exercises: [
      PRESET_EXERCISES.find(e => e.id === 'ex22')!, // Scrummaging Machine
      PRESET_EXERCISES.find(e => e.id === 'ex4')!, // Back Squats
      PRESET_EXERCISES.find(e => e.id === 'ex6')!, // Deadlifts
      PRESET_EXERCISES.find(e => e.id === 'ex28')!, // Collision Core
    ],
    totalDuration: 80,
    intensity: 85,
    targetGroup: 'front_row',
    notes: 'Heavy strength focus for scrum dominance'
  },
  {
    id: 'sc7',
    name: 'Halfback Agility',
    focusAreas: ['agility', 'speed', 'core_stability'],
    exercises: [
      PRESET_EXERCISES.find(e => e.id === 'ex15')!, // Reactive Agility
      PRESET_EXERCISES.find(e => e.id === 'ex2')!, // Acceleration Ladders
      PRESET_EXERCISES.find(e => e.id === 'ex27')!, // Pallof Press
      PRESET_EXERCISES.find(e => e.id === 'ex10')!, // Medicine Ball Throws
    ],
    totalDuration: 50,
    intensity: 75,
    targetGroup: 'halfbacks',
    notes: 'Quick feet and decision-making under fatigue'
  },
];

// Preset Training Drills
export const PRESET_DRILLS: TrainingDrill[] = [
  { id: 'd1', name: 'Passing Gates', duration: 10, description: 'Accuracy passing through targets', focusAttributes: ['passing', 'handling'] },
  { id: 'd2', name: 'Contact Shields', duration: 15, description: 'Ball carry through contact', focusAttributes: ['ballCarrying', 'strength'] },
  { id: 'd3', name: 'Tackle Technique', duration: 15, description: 'One-on-one tackle practice', focusAttributes: ['tackling'] },
  { id: 'd4', name: 'Lineout Throws', duration: 12, description: 'Hooker throwing accuracy', focusAttributes: ['throwing'] },
  { id: 'd5', name: 'Box Kick Pressure', duration: 10, description: 'Scrum-half box kicks under pressure', focusAttributes: ['boxKicking', 'kicking'] },
  { id: 'd6', name: 'Strike Play Walkthroughs', duration: 20, description: 'Tactical patterns at walking pace', focusAttributes: ['decisionMaking', 'gameManagement'] },
  { id: 'd7', name: 'Scrum Live', duration: 20, description: 'Full scrum with opposition', focusAttributes: ['scrummaging', 'strength'] },
  { id: 'd8', name: 'Breakdown Contest', duration: 15, description: 'Ruck competition drills', focusAttributes: ['breakdown', 'workRate'] },
  { id: 'd9', name: 'Kick Chase', duration: 12, description: 'Chasing and contesting kicks', focusAttributes: ['aerialAbility', 'speed'] },
  { id: 'd10', name: 'Defensive Alignment', duration: 15, description: 'Line speed and communication', focusAttributes: ['defensiveReading', 'tackling'] },
  { id: 'd11', name: '2v1 Attack', duration: 12, description: 'Creating and exploiting overlaps', focusAttributes: ['passing', 'running', 'decisionMaking'] },
  { id: 'd12', name: 'High Ball Catching', duration: 10, description: 'Aerial contest and catching', focusAttributes: ['catching', 'aerialAbility'] },
];

// Preset S&C Programs
export const PRESET_SC_PROGRAMS: SCProgram[] = [
  {
    id: 'prog1',
    name: 'Pre-Season Foundation',
    description: 'Build base strength and aerobic capacity. Heavy loading with longer recovery.',
    phase: 'pre_season_foundation',
    weeklySchedule: {
      monday: PRESET_SC_SESSIONS[0], // Forward Power
      tuesday: PRESET_SC_SESSIONS[1], // Back Speed
      wednesday: PRESET_SC_SESSIONS[4], // Recovery
      thursday: PRESET_SC_SESSIONS[2], // Conditioning
      friday: PRESET_SC_SESSIONS[5], // Front Row Strength
      saturday: undefined,
      sunday: PRESET_SC_SESSIONS[4], // Recovery
    },
    duration: 4,
    isPreset: true,
    targetGroups: ['squad'],
  },
  {
    id: 'prog2',
    name: 'In-Season Maintenance',
    description: 'Maintain strength and power while managing match fatigue. Lower volume, higher intensity.',
    phase: 'mid_season',
    weeklySchedule: {
      monday: PRESET_SC_SESSIONS[4], // Recovery
      tuesday: PRESET_SC_SESSIONS[0], // Forward Power (reduced)
      wednesday: PRESET_SC_SESSIONS[1], // Back Speed
      thursday: undefined,
      friday: undefined,
      saturday: undefined, // Match day
      sunday: PRESET_SC_SESSIONS[4], // Recovery
    },
    duration: 8,
    isPreset: true,
    targetGroups: ['squad'],
  },
  {
    id: 'prog3',
    name: 'Forward Dominance',
    description: 'Maximize scrum and lineout power. Heavy emphasis on strength and low body work.',
    phase: 'pre_season_build',
    weeklySchedule: {
      monday: PRESET_SC_SESSIONS[5], // Front Row Strength
      tuesday: PRESET_SC_SESSIONS[3], // Lineout Power
      wednesday: PRESET_SC_SESSIONS[4], // Recovery
      thursday: PRESET_SC_SESSIONS[0], // Forward Power
      friday: PRESET_SC_SESSIONS[2], // Conditioning
      saturday: undefined,
      sunday: PRESET_SC_SESSIONS[4], // Recovery
    },
    duration: 3,
    isPreset: true,
    targetGroups: ['forwards'],
  },
  {
    id: 'prog4',
    name: 'Back Line Speed',
    description: 'Maximize acceleration and agility for the backs. Speed-focused with power support.',
    phase: 'pre_season_build',
    weeklySchedule: {
      monday: PRESET_SC_SESSIONS[1], // Back Speed
      tuesday: PRESET_SC_SESSIONS[6], // Halfback Agility
      wednesday: PRESET_SC_SESSIONS[4], // Recovery
      thursday: PRESET_SC_SESSIONS[1], // Back Speed
      friday: PRESET_SC_SESSIONS[2], // Conditioning
      saturday: undefined,
      sunday: PRESET_SC_SESSIONS[4], // Recovery
    },
    duration: 3,
    isPreset: true,
    targetGroups: ['backs'],
  },
  {
    id: 'prog5',
    name: 'Playoff Peak',
    description: 'Taper volume, maintain intensity. Fresh legs for knockout rugby.',
    phase: 'playoffs',
    weeklySchedule: {
      monday: PRESET_SC_SESSIONS[4], // Recovery
      tuesday: PRESET_SC_SESSIONS[6], // Light Agility
      wednesday: undefined,
      thursday: undefined,
      friday: undefined,
      saturday: undefined, // Match day
      sunday: PRESET_SC_SESSIONS[4], // Recovery
    },
    duration: 4,
    isPreset: true,
    targetGroups: ['squad'],
  },
];

// Preset Training Sessions
export const PRESET_TRAINING_SESSIONS: TrainingSession[] = [
  {
    id: 'ts1',
    name: 'Set Piece Focus',
    type: 'set_piece',
    duration: 90,
    intensity: 75,
    description: 'Scrum and lineout work with live opposition',
    drills: [
      PRESET_DRILLS[6], // Scrum Live
      PRESET_DRILLS[3], // Lineout Throws
    ],
    targetGroup: 'forwards',
  },
  {
    id: 'ts2',
    name: 'Attack Patterns',
    type: 'tactical',
    duration: 75,
    intensity: 65,
    description: 'Strike play installation and rehearsal',
    drills: [
      PRESET_DRILLS[5], // Strike Play Walkthroughs
      PRESET_DRILLS[10], // 2v1 Attack
    ],
    targetGroup: 'squad',
  },
  {
    id: 'ts3',
    name: 'Contact Session',
    type: 'contact',
    duration: 60,
    intensity: 85,
    description: 'Full contact tackle and ruck work',
    drills: [
      PRESET_DRILLS[2], // Tackle Technique
      PRESET_DRILLS[7], // Breakdown Contest
      PRESET_DRILLS[1], // Contact Shields
    ],
    targetGroup: 'squad',
  },
  {
    id: 'ts4',
    name: 'Skills Circuit',
    type: 'skills',
    duration: 60,
    intensity: 60,
    description: 'Technical skills development',
    drills: [
      PRESET_DRILLS[0], // Passing Gates
      PRESET_DRILLS[11], // High Ball Catching
      PRESET_DRILLS[4], // Box Kick Pressure
    ],
    targetGroup: 'backs',
  },
  {
    id: 'ts5',
    name: 'Defense Day',
    type: 'tactical',
    duration: 75,
    intensity: 80,
    description: 'Defensive systems and communication',
    drills: [
      PRESET_DRILLS[9], // Defensive Alignment
      PRESET_DRILLS[2], // Tackle Technique
      PRESET_DRILLS[8], // Kick Chase
    ],
    targetGroup: 'squad',
  },
  {
    id: 'ts6',
    name: 'Match Prep - Captains Run',
    type: 'match_prep',
    duration: 45,
    intensity: 50,
    description: 'Light run-through before match day',
    drills: [
      PRESET_DRILLS[5], // Strike Play Walkthroughs
    ],
    targetGroup: 'squad',
  },
];

// Helper function to get exercises by focus area
export function getExercisesByFocus(focus: SCFocusArea): Exercise[] {
  return PRESET_EXERCISES.filter(ex => ex.category === focus);
}

// Helper function to get exercises by position
export function getExercisesForPosition(positionNumber: number): Exercise[] {
  return PRESET_EXERCISES.filter(ex => ex.positionBenefits.includes(positionNumber));
}

// Helper function to create a custom S&C session
export function createCustomSCSession(
  name: string,
  focusAreas: SCFocusArea[],
  exerciseIds: string[],
  targetGroup: string
): SCSession {
  const exercises = exerciseIds
    .map(id => PRESET_EXERCISES.find(ex => ex.id === id))
    .filter((ex): ex is Exercise => ex !== undefined);
  
  const totalDuration = exercises.reduce((sum, ex) => sum + ex.duration, 0);
  const avgIntensity = exercises.reduce((sum, ex) => {
    const intensityMap = { low: 25, medium: 50, high: 75, max: 100 };
    return sum + intensityMap[ex.intensity];
  }, 0) / exercises.length;

  return {
    id: `custom_${Date.now()}`,
    name,
    focusAreas,
    exercises,
    totalDuration,
    intensity: Math.round(avgIntensity),
    targetGroup: targetGroup as any,
    notes: '',
  };
}
