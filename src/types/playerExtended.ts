// ========================
// EXTENDED PLAYER ATTRIBUTES
// ========================

// Player archetypes by position
export type PropArchetype = 'scrummager' | 'ball_carrier' | 'mobile';
export type HookerArchetype = 'set_piece' | 'link_player' | 'ball_carrier';
export type LockArchetype = 'lineout_specialist' | 'enforcer' | 'ball_player';
export type FlankerArchetype = 'jackal' | 'carrier' | 'link';
export type Number8Archetype = 'power' | 'ball_player' | 'defensive';
export type ScrumHalfArchetype = 'sniper' | 'controller' | 'box_kicker';
export type FlyHalfArchetype = 'playmaker' | 'runner' | 'dual_threat';
export type CentreArchetype = 'crash_ball' | 'distributor' | 'outside_break';
export type WingArchetype = 'finisher' | 'counter_attacker' | 'aerial_wing';
export type FullbackArchetype = 'playmaker_15' | 'counter_attacker_15' | 'safety_first';

export type PlayerArchetype =
  | PropArchetype | HookerArchetype | LockArchetype | FlankerArchetype
  | Number8Archetype | ScrumHalfArchetype | FlyHalfArchetype | CentreArchetype
  | WingArchetype | FullbackArchetype;

export const ARCHETYPE_NAMES: Record<string, string> = {
  // Props
  scrummager: 'Scrummager',
  ball_carrier: 'Ball Carrier',
  mobile: 'Mobile Prop',
  // Hooker
  set_piece: 'Set-Piece Specialist',
  link_player: 'Link Player',
  // Locks
  lineout_specialist: 'Lineout Specialist',
  enforcer: 'Enforcer',
  ball_player: 'Ball-Playing Lock',
  // Flankers
  jackal: 'Jackal Specialist',
  carrier: 'Carrying Flanker',
  link: 'Linking Flanker',
  // 8
  power: 'Power 8',
  defensive: 'Defensive 8',
  // 9
  sniper: 'Sniping 9',
  controller: 'Controlling 9',
  box_kicker: 'Box-Kicking 9',
  // 10
  playmaker: 'Playmaker',
  runner: 'Running 10',
  dual_threat: 'Dual-Threat 10',
  // Centres
  crash_ball: 'Crash-Ball Centre',
  distributor: 'Distributing Centre',
  outside_break: 'Outside-Break Centre',
  // Wings
  finisher: 'Finisher',
  counter_attacker: 'Counter-Attacker',
  aerial_wing: 'Aerial Wing',
  // Fullback
  playmaker_15: 'Playmaking Fullback',
  counter_attacker_15: 'Counter-Attacking Fullback',
  safety_first: 'Safety-First Fullback',
};

// Extended player properties (layered on top of existing Player)
export interface PlayerExtended {
  // Psychology
  confidence: number; // 0-100
  ego: number; // 0-100, high ego = more demanding
  discipline: number; // 0-100, low = more penalties/cards
  composure: number; // 0-100, performance under pressure
  leadership: number; // 0-100
  bigGamePlayer: boolean; // performs better in high-stakes matches
  
  // Archetype
  archetype: PlayerArchetype;
  
  // Development
  potential: number; // hidden ceiling 0-100
  potentialRevealed: boolean;
  developmentRate: number; // 0.5-2.0 multiplier
  mentorId?: string; // paired with a veteran
  
  // Career
  caps: number; // total appearances for club
  internationalCaps: number;
  totalTries: number;
  seasonTries: number;
  milestones: PlayerMilestone[];
  
  // Physical
  chronicInjuries: ChronicInjury[];
  injuryProneness: number; // 0-100
  
  // Form
  formHistory: number[]; // last 5 match ratings
  rollingForm: number; // average of last 5
  momentum: 'hot' | 'warm' | 'neutral' | 'cold' | 'freezing';
  
  // Contract negotiation
  happiness: number; // 0-100
  wantsNewContract: boolean;
  agentDifficulty: number; // 0-100
  frenchLeverage: boolean; // Irish players specifically
  
  // Integration (new signings)
  isNewSigning: boolean;
  integrationWeeks: number; // weeks until fully integrated (0 = done)
  culturalFit: number; // 0-100
  
  // Impact sub rating
  impactSubRating: number; // 0-100, some players are better finishers than starters
  
  // Fatigue & rest management
  weeklyFatigue: number; // 0-100
  needsRest: boolean;
  restWeeksRequired: number;
  matchesSinceRest: number;

  // Aging & decline
  declineOnsetAge: number; // randomly assigned per player, position-influenced (e.g. 31-37)
  peakAge: number; // when the player hits their ceiling
}

export interface PlayerMilestone {
  type: '50_caps' | '100_caps' | '150_caps' | 'try_record' | 'debut' | 'international_debut' | 'testimonial';
  achievedAt: { season: number; week: number };
  description: string;
}

export interface ChronicInjury {
  type: 'knee' | 'shoulder' | 'back' | 'ankle' | 'hamstring' | 'concussion_history';
  severity: 'mild' | 'moderate' | 'severe';
  reinjuryRisk: number; // 0-100 chance of flare-up each match
  managementStrategy: 'rest_every_3rd' | 'reduced_training' | 'managed_minutes' | 'none';
}

// Injury rehabilitation options
export interface InjuryRehab {
  playerId: string;
  injuryType: string;
  originalWeeks: number;
  
  // Choice
  strategy: 'conservative' | 'normal' | 'rush_back';
  actualWeeks: number; // modified by strategy
  reinjuryRiskModifier: number; // rush_back doubles risk for 4 weeks after return
  
  // Surgery option
  surgerRequired: boolean;
  surgeryWeeks?: number; // longer but permanent fix
  restWeeks?: number; // shorter but recurring
}

// Chat / interaction
export type PlayerChatTopic =
  | 'playing_time' | 'contract' | 'training_intensity' | 'role_change'
  | 'retirement' | 'unhappy' | 'praise' | 'mentoring' | 'personal';

export interface PlayerChat {
  id: string;
  playerId: string;
  topic: PlayerChatTopic;
  message: string;
  responses: PlayerChatResponse[];
  resolvedAt?: Date;
  outcome?: string;
}

export interface PlayerChatResponse {
  id: string;
  text: string;
  tone: 'supportive' | 'firm' | 'neutral' | 'motivational';
  effect: {
    happiness?: number;
    confidence?: number;
    ego?: number;
    loyalty?: number;
  };
}

// Position-to-archetype mapping
const POSITION_ARCHETYPES: Record<string, PlayerArchetype[]> = {
  'Loosehead Prop': ['scrummager', 'ball_carrier', 'mobile'],
  'Hooker': ['set_piece', 'link_player', 'ball_carrier'],
  'Tighthead Prop': ['scrummager', 'ball_carrier', 'mobile'],
  'Lock': ['lineout_specialist', 'enforcer', 'ball_player'],
  'Blindside Flanker': ['jackal', 'carrier', 'link'],
  'Openside Flanker': ['jackal', 'carrier', 'link'],
  'Number 8': ['power', 'ball_player', 'defensive'],
  'Scrum Half': ['sniper', 'controller', 'box_kicker'],
  'Fly Half': ['playmaker', 'runner', 'dual_threat'],
  'Inside Centre': ['crash_ball', 'distributor', 'outside_break'],
  'Outside Centre': ['crash_ball', 'distributor', 'outside_break'],
  'Left Wing': ['finisher', 'counter_attacker', 'aerial_wing'],
  'Right Wing': ['finisher', 'counter_attacker', 'aerial_wing'],
  'Fullback': ['playmaker_15', 'counter_attacker_15', 'safety_first'],
};

export function assignArchetype(position: string): PlayerArchetype {
  const archetypes = POSITION_ARCHETYPES[position];
  if (!archetypes) {
    // Fallback: try matching partial position names
    for (const [key, vals] of Object.entries(POSITION_ARCHETYPES)) {
      if (position.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
        return vals[Math.floor(Math.random() * vals.length)];
      }
    }
    return 'ball_carrier';
  }
  return archetypes[Math.floor(Math.random() * archetypes.length)];
}

// Default extended values for generating new players
export function generatePlayerExtended(age: number, overall: number, nationality: string, position?: string): Partial<PlayerExtended> {
  const isYoung = age < 24;
  const isVeteran = age > 31;
  
  return {
    confidence: 40 + Math.floor(Math.random() * 40),
    ego: isVeteran ? 50 + Math.floor(Math.random() * 40) : 20 + Math.floor(Math.random() * 40),
    discipline: 40 + Math.floor(Math.random() * 50),
    composure: isVeteran ? 60 + Math.floor(Math.random() * 30) : 30 + Math.floor(Math.random() * 40),
    leadership: isVeteran ? 50 + Math.floor(Math.random() * 40) : 10 + Math.floor(Math.random() * 30),
    bigGamePlayer: Math.random() < 0.15,
    
    archetype: position ? assignArchetype(position) : 'ball_carrier',
    
    potential: isYoung ? overall + Math.floor(Math.random() * 25) : overall + Math.floor(Math.random() * 5),
    potentialRevealed: false,
    developmentRate: isYoung ? 0.8 + Math.random() * 1.2 : 0.3 + Math.random() * 0.5,
    
    caps: isVeteran ? 100 + Math.floor(Math.random() * 100) : Math.floor(Math.random() * 60),
    internationalCaps: Math.floor(Math.random() * (isVeteran ? 80 : 20)),
    totalTries: Math.floor(Math.random() * 30),
    seasonTries: 0,
    milestones: [],
    
    chronicInjuries: isVeteran && Math.random() < 0.4 ? [generateChronicInjury(age)] : [],
    injuryProneness: 10 + Math.floor(Math.random() * 40) + (isVeteran ? 20 : 0),
    
    formHistory: [],
    rollingForm: 6,
    momentum: 'neutral' as const,
    
    happiness: 60 + Math.floor(Math.random() * 30),
    wantsNewContract: false,
    agentDifficulty: 20 + Math.floor(Math.random() * 60),
    frenchLeverage: nationality === 'Irish',
    
    isNewSigning: false,
    integrationWeeks: 0,
    culturalFit: 70 + Math.floor(Math.random() * 30),
    
    impactSubRating: 30 + Math.floor(Math.random() * 50),
    
    weeklyFatigue: 0,
    needsRest: false,
    restWeeksRequired: 0,
    matchesSinceRest: 0,
  };
}

function generateChronicInjury(age: number): ChronicInjury {
  const types: ChronicInjury['type'][] = ['knee', 'shoulder', 'back', 'ankle', 'hamstring', 'concussion_history'];
  const type = types[Math.floor(Math.random() * types.length)];
  const severities: ChronicInjury['severity'][] = age > 34 ? ['moderate', 'severe'] : ['mild', 'moderate'];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  return {
    type,
    severity,
    reinjuryRisk: severity === 'severe' ? 30 + Math.floor(Math.random() * 30) : severity === 'moderate' ? 15 + Math.floor(Math.random() * 20) : 5 + Math.floor(Math.random() * 15),
    managementStrategy: 'none',
  };
}
