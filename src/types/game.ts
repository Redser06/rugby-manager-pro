// Position types for rugby union
export type Position = 
  | 'Loosehead Prop' | 'Hooker' | 'Tighthead Prop'
  | 'Lock' | 'Blindside Flanker' | 'Openside Flanker' | 'Number 8'
  | 'Scrum-half' | 'Fly-half' | 'Inside Centre' | 'Outside Centre'
  | 'Left Wing' | 'Right Wing' | 'Fullback';

export type PositionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export const POSITION_MAP: Record<PositionNumber, Position> = {
  1: 'Loosehead Prop',
  2: 'Hooker',
  3: 'Tighthead Prop',
  4: 'Lock',
  5: 'Lock',
  6: 'Blindside Flanker',
  7: 'Openside Flanker',
  8: 'Number 8',
  9: 'Scrum-half',
  10: 'Fly-half',
  11: 'Left Wing',
  12: 'Inside Centre',
  13: 'Outside Centre',
  14: 'Right Wing',
  15: 'Fullback'
};

// Position-specific attributes
export interface PropAttributes {
  scrummaging: number;
  strength: number;
  endurance: number;
  lineoutLifting: number;
  ballCarrying: number;
  tackling: number;
}

export interface HookerAttributes {
  throwing: number;
  scrummaging: number;
  strength: number;
  workRate: number;
  tackling: number;
  ballCarrying: number;
}

export interface LockAttributes {
  lineout: number;
  strength: number;
  workRate: number;
  tackling: number;
  ballCarrying: number;
  aerialAbility: number;
}

export interface FlankerAttributes {
  tackling: number;
  workRate: number;
  ballCarrying: number;
  breakdown: number;
  speed: number;
  handling: number;
}

export interface Number8Attributes {
  ballCarrying: number;
  strength: number;
  tackling: number;
  breakdown: number;
  handling: number;
  vision: number;
}

export interface ScrumHalfAttributes {
  passing: number;
  kicking: number;
  speed: number;
  decisionMaking: number;
  boxKicking: number;
  sniping: number;
}

export interface FlyHalfAttributes {
  kicking: number;
  passing: number;
  decisionMaking: number;
  gameManagement: number;
  tackling: number;
  running: number;
}

export interface CentreAttributes {
  speed: number;
  strength: number;
  tackling: number;
  passing: number;
  handling: number;
  defensiveReading: number;
}

export interface WingAttributes {
  speed: number;
  finishing: number;
  aerialAbility: number;
  stepping: number;
  tackling: number;
  workRate: number;
}

export interface FullbackAttributes {
  kicking: number;
  catching: number;
  speed: number;
  positioning: number;
  counterAttacking: number;
  tackling: number;
}

export type PositionAttributes = 
  | PropAttributes 
  | HookerAttributes 
  | LockAttributes 
  | FlankerAttributes 
  | Number8Attributes 
  | ScrumHalfAttributes 
  | FlyHalfAttributes 
  | CentreAttributes 
  | WingAttributes 
  | FullbackAttributes;

// Player interface
export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  position: Position;
  positionNumber: PositionNumber;
  attributes: PositionAttributes;
  overall: number;
  form: number; // 1-10
  fitness: number; // 0-100
  injured: boolean;
  injuryWeeks: number;
}

// Team interface
export interface Team {
  id: string;
  name: string;
  shortName: string;
  country: string;
  league: string;
  players: Player[];
  tactics: TeamTactics;
  homeGround: string;
  reputation: number; // 1-100
}

// Tactics and game plan
export interface TeamTactics {
  attackStyle: 'expansive' | 'structured' | 'direct' | 'kicking';
  defenseStyle: 'rush' | 'drift' | 'blitz' | 'umbrella';
  scrumFocus: 'power' | 'speed' | 'balanced';
  lineoutPrimary: 'front' | 'middle' | 'back';
  tempo: 'fast' | 'controlled' | 'slow';
  riskLevel: 'high' | 'medium' | 'low';
}

export interface SetPiece {
  id: string;
  name: string;
  type: 'scrum' | 'lineout' | 'restart' | 'penalty';
  description: string;
  successRate: number;
}

export interface StrikePlay {
  id: string;
  name: string;
  trigger: 'scrum' | 'lineout' | 'kickoff' | 'dropout' | 'penalty' | 'free_kick';
  targetArea: 'blindside' | 'midfield' | 'openside' | 'short' | 'crossfield';
  attackPattern: AttackPattern;
  playerPositions: PlayerPosition[];
  runningLines: RunningLine[];
  phases: PlayPhase[];
  description: string;
}

export interface PlayerPosition {
  playerId: string;
  positionNumber: PositionNumber;
  x: number; // 0-100 percentage across pitch
  y: number; // 0-100 percentage down pitch
}

export interface RunningLine {
  id: string;
  playerId: string;
  phase: number;
  points: { x: number; y: number }[];
  lineType: 'run' | 'pass' | 'kick';
}

export interface PlayPhase {
  number: number;
  description: string;
  attackStyle: 'wide' | 'narrow' | 'tip_on' | 'wrap' | 'switch' | 'crash_ball';
}

export interface AttackPattern {
  wideChannels: boolean;
  narrowPods: boolean;
  tipOnPasses: boolean;
  crashBalls: boolean;
  kickingOptions: KickingOption[];
}

export interface KickingOption {
  type: 'crossfield' | 'grubber' | 'box_kick' | 'chip' | 'up_and_under';
  targetZone: 'left_corner' | 'right_corner' | 'behind_defence' | 'contestable';
}

export interface SetPieceFormation {
  id: string;
  name: string;
  type: 'scrum' | 'lineout' | 'kickoff_receive' | 'kickoff_chase' | 'dropout';
  playerPositions: PlayerPosition[];
  defaultPlay?: string; // Links to a StrikePlay id
}

export interface MatchPlan {
  setPieces: SetPiece[];
  strikePlays: StrikePlay[];
  keyMoments: {
    firstTen: 'aggressive' | 'conservative' | 'feel_out';
    closingTen: 'protect_lead' | 'push_for_score' | 'manage_clock';
    behindByTen: 'high_risk' | 'chip_away' | 'target_weaknesses';
  };
  substitutionStrategy: 'early_impact' | 'save_bench' | 'rotation';
}

// League and competition
export interface League {
  id: string;
  name: string;
  country: string;
  teams: Team[];
  standings: LeagueStanding[];
}

export interface LeagueStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  bonusPoints: number;
  totalPoints: number;
}

// Match
export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  homeTries: number;
  awayTries: number;
  played: boolean;
  events: MatchEvent[];
}

export interface MatchEvent {
  minute: number;
  type: 'try' | 'conversion' | 'penalty' | 'drop_goal' | 'yellow_card' | 'red_card' | 'substitution' | 'injury';
  team: 'home' | 'away';
  player?: Player;
  description: string;
}

// Game state
export interface GameState {
  currentWeek: number;
  currentSeason: number;
  selectedTeam: Team | null;
  leagues: League[];
  upcomingMatches: Match[];
}
