import { Player, PositionNumber } from './game';

// ========================
// MATCH STATS
// ========================

export interface MatchStats {
  possession: number; // 0-100 percentage
  territory: number; // 0-100 percentage
  tackles: { made: number; missed: number; percentage: number };
  carries: number;
  metresGained: number;
  passes: number;
  offloads: number;
  linebreaks: number;
  defendersBeaten: number;
  turnoversWon: number;
  turnoversConceded: number;
  penalties: { conceded: number; won: number };
  scrums: { won: number; lost: number; penaltiesWon: number };
  lineouts: { won: number; lost: number; stolen: number };
  mauls: { formed: number; tries: number; penaltiesWon: number };
  rucks: { won: number; lost: number; averageSpeed: number }; // speed in seconds
  kicks: { fromHand: number; contestable: number; successful5022: number; inGoal: number };
  yellowCards: number;
  redCards: number;
  phaseCount: number; // total phases in attack
  averagePhaseLength: number;
}

export function createEmptyStats(): MatchStats {
  return {
    possession: 50,
    territory: 50,
    tackles: { made: 0, missed: 0, percentage: 100 },
    carries: 0,
    metresGained: 0,
    passes: 0,
    offloads: 0,
    linebreaks: 0,
    defendersBeaten: 0,
    turnoversWon: 0,
    turnoversConceded: 0,
    penalties: { conceded: 0, won: 0 },
    scrums: { won: 0, lost: 0, penaltiesWon: 0 },
    lineouts: { won: 0, lost: 0, stolen: 0 },
    mauls: { formed: 0, tries: 0, penaltiesWon: 0 },
    rucks: { won: 0, lost: 0, averageSpeed: 2.5 },
    kicks: { fromHand: 0, contestable: 0, successful5022: 0, inGoal: 0 },
    yellowCards: 0,
    redCards: 0,
    phaseCount: 0,
    averagePhaseLength: 0,
  };
}

// ========================
// PLAYER MATCH STATE
// ========================

export interface PlayerMatchState {
  playerId: string;
  positionNumber: PositionNumber;
  fatigue: number; // 0-100, 100 = exhausted
  fatigueRate: number; // how fast they tire (position-specific)
  confidence: number; // 0-100
  onField: boolean;
  minuteEntered: number;
  minuteExited?: number;
  isYellowCarded: boolean;
  yellowCardMinute?: number;
  isRedCarded: boolean;
  isSinBinned: boolean;
  sinBinReturnMinute?: number;
  
  // Match performance
  tackles: number;
  missedTackles: number;
  carries: number;
  metresGained: number;
  offloads: number;
  turnoversWon: number;
  penaltiesConceded: number;
  triesScored: number;
  conversions: number;
  penaltyGoals: number;
  rating: number; // 1-10 match rating
}

// ========================
// REFEREE SYSTEM
// ========================

export interface Referee {
  id: string;
  name: string;
  nationality: string;
  strictness: number; // 1-10, 10 = very strict
  
  // Tendencies
  scrumBias: 'loosehead' | 'tighthead' | 'neutral';
  breakdownTolerance: number; // 1-10, low = quick to penalise
  advantageDuration: 'short' | 'medium' | 'long';
  cardThreshold: number; // 1-10, low = card-happy
  tmoUsage: 'frequent' | 'moderate' | 'rare';
  offsideTolerance: number; // 1-10
}

export const REFEREE_POOL: Referee[] = [
  {
    id: 'ref_1', name: 'Wayne Barnes', nationality: 'English',
    strictness: 7, scrumBias: 'neutral', breakdownTolerance: 5,
    advantageDuration: 'medium', cardThreshold: 6, tmoUsage: 'moderate', offsideTolerance: 5
  },
  {
    id: 'ref_2', name: 'Jaco Peyper', nationality: 'South African',
    strictness: 8, scrumBias: 'tighthead', breakdownTolerance: 4,
    advantageDuration: 'short', cardThreshold: 5, tmoUsage: 'frequent', offsideTolerance: 4
  },
  {
    id: 'ref_3', name: 'Nic Berry', nationality: 'Australian',
    strictness: 6, scrumBias: 'neutral', breakdownTolerance: 6,
    advantageDuration: 'medium', cardThreshold: 7, tmoUsage: 'moderate', offsideTolerance: 6
  },
  {
    id: 'ref_4', name: 'Luke Pearce', nationality: 'English',
    strictness: 7, scrumBias: 'loosehead', breakdownTolerance: 5,
    advantageDuration: 'medium', cardThreshold: 6, tmoUsage: 'moderate', offsideTolerance: 5
  },
  {
    id: 'ref_5', name: 'Mathieu Raynal', nationality: 'French',
    strictness: 9, scrumBias: 'neutral', breakdownTolerance: 3,
    advantageDuration: 'short', cardThreshold: 4, tmoUsage: 'frequent', offsideTolerance: 3
  },
  {
    id: 'ref_6', name: 'Andrew Brace', nationality: 'Irish',
    strictness: 6, scrumBias: 'neutral', breakdownTolerance: 6,
    advantageDuration: 'long', cardThreshold: 7, tmoUsage: 'moderate', offsideTolerance: 6
  },
  {
    id: 'ref_7', name: 'Ben O\'Keeffe', nationality: 'New Zealander',
    strictness: 5, scrumBias: 'loosehead', breakdownTolerance: 7,
    advantageDuration: 'long', cardThreshold: 8, tmoUsage: 'rare', offsideTolerance: 7
  },
  {
    id: 'ref_8', name: 'Karl Dickson', nationality: 'English',
    strictness: 6, scrumBias: 'neutral', breakdownTolerance: 5,
    advantageDuration: 'medium', cardThreshold: 6, tmoUsage: 'moderate', offsideTolerance: 5
  },
];

// ========================
// WEATHER
// ========================

export interface MatchWeather {
  condition: 'clear' | 'overcast' | 'light_rain' | 'heavy_rain' | 'wind' | 'storm';
  windSpeed: number; // km/h
  windDirection: 'north' | 'south' | 'east' | 'west'; // relative to pitch
  temperature: number; // celsius
  pitchCondition: 'firm' | 'soft' | 'heavy' | 'waterlogged';
}

export function getWeatherEffects(weather: MatchWeather) {
  const wet = ['light_rain', 'heavy_rain', 'storm'].includes(weather.condition);
  const windy = weather.windSpeed > 20;
  const heavyPitch = ['heavy', 'waterlogged'].includes(weather.pitchCondition);

  return {
    handlingModifier: wet ? (weather.condition === 'heavy_rain' ? -15 : -8) : 0,
    kickingDistanceModifier: windy ? -(weather.windSpeed - 15) * 0.5 : 0,
    kickingAccuracyModifier: windy ? -10 : 0,
    scrumModifier: heavyPitch ? 5 : 0, // heavier players benefit on soft ground
    fatigueModifier: heavyPitch ? 1.2 : (weather.temperature > 28 ? 1.3 : 1.0),
    skipPassRisk: wet ? 0.15 : 0.03, // chance of knock-on on skip pass
  };
}

// ========================
// SUBSTITUTION PLAN
// ========================

export type BenchSplit = '6-2' | '5-3';

export interface SubstitutionRule {
  id: string;
  playerOffId: string;
  playerOnId: string;
  triggerMinute: number;
  condition?: 'unless_winning_by_20' | 'unless_losing' | 'if_trailing' | 'always';
  priority: number;
  executed: boolean;
}

export interface SubstitutionPlan {
  benchSplit: BenchSplit;
  startingXV: string[]; // player IDs in position order 1-15
  bench: string[]; // player IDs, 8 players
  rules: SubstitutionRule[];
  impactSubRatings: Record<string, number>; // playerId -> impact rating 1-100
}

// ========================
// TMO SYSTEM
// ========================

export type TMODecision = 'try_awarded' | 'try_disallowed' | 'penalty_only' | 'card_upgraded' | 'no_action';

export interface TMOReview {
  minute: number;
  reason: 'try_check' | 'foul_play' | 'offside' | 'knock_on';
  originalDecision: string;
  finalDecision: TMODecision;
  description: string;
}

// ========================
// TEAM WARNING SYSTEM (per World Rugby)
// ========================

export interface TeamDiscipline {
  penaltyCount: number;
  hasTeamWarning: boolean;
  warningMinute?: number;
  infringementAreas: string[]; // track where team is infringing
}

// ========================
// ENHANCED MATCH EVENT
// ========================

export type EnhancedEventType =
  | 'try' | 'conversion' | 'penalty_goal' | 'drop_goal' | 'penalty_miss' | 'conversion_miss'
  | 'yellow_card' | 'red_card' | 'sin_bin_return'
  | 'substitution' | 'injury' | 'injury_sub'
  | 'scrum_won' | 'scrum_lost' | 'scrum_penalty'
  | 'lineout_won' | 'lineout_lost' | 'lineout_stolen'
  | 'maul_try' | 'maul_penalty' | 'maul_held'
  | 'turnover' | 'jackal' | 'knock_on' | 'handling_error'
  | 'penalty_conceded' | 'penalty_to_corner' | 'penalty_kick_at_goal'
  | 'box_kick' | 'territorial_kick' | 'fifty_22' | 'contestable_kick'
  | 'line_break' | 'offload' | 'big_tackle'
  | 'tmo_review' | 'team_warning'
  | 'phase_play' | 'half_time' | 'full_time'
  | 'kickoff' | 'dropout'
  | 'captain_referee' | 'sideline_instruction';

export interface EnhancedMatchEvent {
  id: string;
  minute: number;
  second: number;
  type: EnhancedEventType;
  team: 'home' | 'away';
  player?: { id: string; name: string; number: PositionNumber };
  player2?: { id: string; name: string; number: PositionNumber }; // e.g. sub replacement
  description: string;
  commentary: string; // rich commentary text
  fieldPosition: number; // 0-100, 0 = own try line, 100 = opposition try line
  scoreDelta?: number; // points scored in this event
  isKeyMoment: boolean;
  tmoReview?: TMOReview;
}

// ========================
// PLAYER RATING CALC
// ========================

export interface PlayerMatchRating {
  playerId: string;
  playerName: string;
  positionNumber: PositionNumber;
  minutesPlayed: number;
  rating: number; // 1-10
  tackles: number;
  missedTackles: number;
  carries: number;
  metresGained: number;
  offloads: number;
  turnoversWon: number;
  penaltiesConceded: number;
  triesScored: number;
  isMotm: boolean;
}

// ========================
// ENHANCED MATCH RESULT
// ========================

export interface EnhancedMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTries: number;
  awayTries: number;
  homeBonus: { tryBonus: boolean; losingBonus: boolean };
  awayBonus: { tryBonus: boolean; losingBonus: boolean };
  
  events: EnhancedMatchEvent[];
  homeStats: MatchStats;
  awayStats: MatchStats;
  
  homePlayerRatings: PlayerMatchRating[];
  awayPlayerRatings: PlayerMatchRating[];
  
  referee: Referee;
  weather: MatchWeather;
  
  homeSubstitutions: { minute: number; playerOffId: string; playerOnId: string }[];
  awaySubstitutions: { minute: number; playerOffId: string; playerOnId: string }[];
  
  motmId: string;
  motmName: string;
  
  homeDiscipline: TeamDiscipline;
  awayDiscipline: TeamDiscipline;
  
  // Captain & coaching
  captainInteractions: CaptainInteraction[];
  sidelineInstructions: SidelineInstruction[];
}

// ========================
// CAPTAIN-REFEREE INTERACTION
// ========================

export type CaptainApproach = 'respectful' | 'questioning' | 'assertive' | 'frustrated';

export interface CaptainInteraction {
  minute: number;
  team: 'home' | 'away';
  approach: CaptainApproach;
  topic: 'breakdown_calls' | 'offside_line' | 'scrum_penalties' | 'foul_play' | 'advantage_length' | 'general_clarification';
  outcome: 'positive' | 'neutral' | 'negative' | 'warning';
  description: string;
  effect: {
    penaltyLeniency: number; // -5 to +5, positive = fewer pens against you
    cardProtection: number; // 0-3, delays next card
    refFrustration: number; // 0-100, too much chat annoys the ref
  };
}

// ========================
// SIDELINE COACHING INSTRUCTIONS
// ========================

export type SidelineInstructionType =
  | 'slow_tempo' | 'increase_tempo' | 'target_player' | 'defensive_shift'
  | 'kicking_game' | 'keep_ball_in_hand' | 'ref_awareness' | 'manage_clock'
  | 'go_for_try' | 'take_the_points' | 'protect_lead' | 'bomb_squad_early';

export interface SidelineInstruction {
  id: string;
  minute: number;
  type: SidelineInstructionType;
  description: string;
  deliveredByCaptain: boolean; // captain relays to players
  captainEffectiveness: number; // 0-100, based on captain's captaincy stat
  effects: {
    attackModifier?: number;
    defenseModifier?: number;
    kickingModifier?: number;
    disciplineModifier?: number;
    tempoModifier?: number;
    moraleModifier?: number;
  };
  expiresMinute: number;
  acknowledged: boolean;
}

export const SIDELINE_INSTRUCTIONS: Record<SidelineInstructionType, { label: string; description: string }> = {
  slow_tempo: { label: 'Slow It Down', description: 'Reduce tempo, keep possession, manage the clock.' },
  increase_tempo: { label: 'Up The Tempo', description: 'Play faster, quick rucks, stretch the defence.' },
  target_player: { label: 'Target Weakness', description: 'Focus attacks on a specific defensive weakness.' },
  defensive_shift: { label: 'Tighten Defence', description: 'Shore up the defensive line, reduce line speed risk.' },
  kicking_game: { label: 'Kicking Game', description: 'Switch to territorial kicking, contest aerially.' },
  keep_ball_in_hand: { label: 'Keep Ball In Hand', description: 'Play through hands, avoid kicking, build phases.' },
  ref_awareness: { label: 'Talk To The Ref', description: 'Captain to speak with referee about specific issues.' },
  manage_clock: { label: 'Manage The Clock', description: 'Wind down time, slow set pieces, use subs strategically.' },
  go_for_try: { label: 'Go For The Try', description: 'All-out attack, take risks, width and offloads.' },
  take_the_points: { label: 'Take The Points', description: 'Kick penalties at goal rather than going to the corner.' },
  protect_lead: { label: 'Protect The Lead', description: 'Conservative approach, keep possession, avoid turnovers.' },
  bomb_squad_early: { label: 'Bomb Squad Early', description: 'Bring impact subs on earlier than planned for fresh legs.' },
};

// ========================
// COMMENTARY TEMPLATES
// ========================

export const COMMENTARY = {
  try: [
    "{player} crosses the whitewash! Brilliant finish!",
    "TRY! {player} touches down after a flowing move!",
    "{player} goes over! The crowd erupts!",
    "Outstanding work from {player} to score in the corner!",
    "{player} dives over from close range! Unstoppable!",
  ],
  conversion: [
    "{player} slots the conversion. Right between the posts.",
    "Conversion good! {player} makes it look easy.",
    "{player} adds the extras from out wide. Magnificent strike.",
  ],
  conversionMiss: [
    "{player} pushes the conversion wide. Difficult angle.",
    "The conversion drifts wide. {player} will be disappointed.",
  ],
  penaltyGoal: [
    "{player} kicks the penalty. Three more points on the board.",
    "Penalty good! {player} extends the lead.",
    "{player} nails it from distance. Excellent kick.",
  ],
  penaltyMiss: [
    "{player} misses the penalty. It drifts left of the posts.",
    "No good! {player} can't find the target from there.",
  ],
  yellowCard: [
    "Yellow card! {player} is sent to the sin bin for {reason}.",
    "The referee has had enough. Yellow card for {player}. {reason}.",
    "{player} sees yellow. That's 10 minutes off the pitch. {reason}.",
  ],
  redCard: [
    "RED CARD! {player} is sent off for {reason}. Huge moment!",
    "That's a red card for {player}. {reason}. Down to 14 men.",
  ],
  tmoReview: [
    "TMO is checking this... can we have a look at the last play?",
    "Hold on, the TMO wants to have a look at something.",
    "We're going upstairs. The TMO is reviewing for possible {reason}.",
  ],
  scrumPenalty: [
    "Penalty at the scrum! {team} are dominant in the front row.",
    "The scrum collapses and {team} win the penalty. The ref saw enough.",
  ],
  turnover: [
    "{player} wins a brilliant turnover at the breakdown!",
    "Jackal! {player} gets over the ball and wins the penalty!",
    "{player} is a menace at the breakdown. Turnover won!",
  ],
  bigTackle: [
    "What a hit from {player}! That will be felt in the morning!",
    "Huge tackle by {player}! The ball carrier is driven back!",
    "{player} puts in a thunderous tackle. Momentum stopped dead.",
  ],
  lineBreak: [
    "{player} breaks through the defensive line! Space ahead!",
    "Line break! {player} has beaten the first line of defence!",
    "{player} finds the gap and is away! Great footwork!",
  ],
  fifty22: [
    "50:22! {player} finds touch in the opposition 22! Lineout attacking platform!",
    "What a kick! {player} executes the 50:22 perfectly! Huge territorial gain!",
  ],
  teamWarning: [
    "The referee calls the captain over. Team warning issued. Next infringement will result in a yellow card.",
    "That's a team warning from the referee. {team} are living dangerously.",
  ],
  maul: [
    "The maul is set and it's moving forward! {team} with massive forward power!",
    "The driving maul is unstoppable! {team}'s pack is dominant!",
  ],
  substitution: [
    "{playerOff} makes way for {playerOn}. Fresh legs.",
    "Substitution: {playerOn} replaces {playerOff}.",
    "The bench is being used. {playerOn} comes on for {playerOff}.",
  ],
  halfTime: [
    "And that's half time. {homeTeam} {homeScore} - {awayTeam} {awayScore}.",
  ],
  fullTime: [
    "Full time! {homeTeam} {homeScore} - {awayTeam} {awayScore}.",
  ],
  captainReferee: [
    "The captain approaches the referee for a word about {topic}.",
    "Captain pulls the referee aside. A respectful conversation about {topic}.",
    "The skipper has a word with the ref — {topic} is the concern.",
    "Captain marches over to the referee, wanting clarity on {topic}.",
  ],
  sidelineInstruction: [
    "Message from the coaching box: {instruction}.",
    "The water carrier relays a message from the sideline: {instruction}.",
    "Tactical instruction from the coaching staff: {instruction}.",
  ],
} as const;
