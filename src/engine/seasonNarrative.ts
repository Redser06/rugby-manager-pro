// Season Narrative & Dynamic Events Engine

import { Team, Player, GameState } from '@/types/game';

// ========================
// TYPES
// ========================

export type SeasonEventType =
  | 'media_pressure'
  | 'board_expectation'
  | 'injury_crisis'
  | 'fan_atmosphere'
  | 'winning_streak'
  | 'losing_streak'
  | 'player_milestone'
  | 'rivalry_buildup'
  | 'transfer_rumour'
  | 'weather_disruption'
  | 'international_window'
  | 'derby_week'
  | 'emergency_loan';

export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SeasonEvent {
  id: string;
  type: SeasonEventType;
  severity: EventSeverity;
  week: number;
  headline: string;
  description: string;
  source: string; // "Media", "Board", "Fans", "Medical", "Agent"
  effects: EventEffect[];
  expiresWeek?: number; // when the event stops having effect
  resolved: boolean;
  choices?: EventChoice[];
  chosenOption?: string;
}

export interface EventEffect {
  target: 'morale' | 'atmosphere' | 'board_confidence' | 'fan_support' | 'transfer_budget' | 'player_form';
  modifier: number; // +/- percentage
  duration: number; // weeks
  description: string;
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effects: EventEffect[];
}

// ========================
// BOARD EXPECTATIONS
// ========================

export type BoardExpectation = 'survival' | 'mid_table' | 'top_half' | 'top_4' | 'title_challenge' | 'title_winners';

export interface BoardState {
  currentExpectation: BoardExpectation;
  confidence: number; // 0-100
  patience: number; // 0-100, how long before they get restless
  preSeasonTarget: BoardExpectation;
  recentResults: ('W' | 'D' | 'L')[];
  consecutiveWins: number;
  consecutiveLosses: number;
  homeRecord: { wins: number; losses: number; draws: number };
  awayRecord: { wins: number; losses: number; draws: number };
  emergencyLoanAvailable: boolean;
  emergencyLoanUsed: boolean;
}

export function initBoardState(team: Team, leagueSize: number): BoardState {
  // Board expectation based on reputation
  let expectation: BoardExpectation = 'mid_table';
  if (team.reputation >= 85) expectation = 'title_challenge';
  else if (team.reputation >= 75) expectation = 'top_4';
  else if (team.reputation >= 60) expectation = 'top_half';
  else if (team.reputation >= 40) expectation = 'mid_table';
  else expectation = 'survival';

  return {
    currentExpectation: expectation,
    confidence: 60,
    patience: team.reputation >= 70 ? 40 : 60, // bigger clubs less patient
    preSeasonTarget: expectation,
    recentResults: [],
    consecutiveWins: 0,
    consecutiveLosses: 0,
    homeRecord: { wins: 0, losses: 0, draws: 0 },
    awayRecord: { wins: 0, losses: 0, draws: 0 },
    emergencyLoanAvailable: false,
    emergencyLoanUsed: false,
  };
}

export function updateBoardAfterResult(
  board: BoardState,
  result: 'W' | 'D' | 'L',
  isHome: boolean,
  leaguePosition: number,
  leagueSize: number
): { board: BoardState; events: SeasonEvent[]; } {
  const newBoard = { ...board };
  const events: SeasonEvent[] = [];
  
  newBoard.recentResults = [...board.recentResults.slice(-9), result];
  
  if (result === 'W') {
    newBoard.consecutiveWins = board.consecutiveWins + 1;
    newBoard.consecutiveLosses = 0;
    newBoard.confidence = Math.min(100, board.confidence + 5);
    if (isHome) newBoard.homeRecord.wins++;
    else newBoard.awayRecord.wins++;
  } else if (result === 'L') {
    newBoard.consecutiveWins = 0;
    newBoard.consecutiveLosses = board.consecutiveLosses + 1;
    newBoard.confidence = Math.max(0, board.confidence - 8);
    if (isHome) newBoard.homeRecord.losses++;
    else newBoard.awayRecord.losses++;
  } else {
    newBoard.consecutiveWins = 0;
    newBoard.consecutiveLosses = 0;
    newBoard.confidence = Math.max(0, board.confidence - 2);
    if (isHome) newBoard.homeRecord.draws++;
    else newBoard.awayRecord.draws++;
  }

  // Board raises expectations after winning streak
  if (newBoard.consecutiveWins >= 3) {
    const expectationLadder: BoardExpectation[] = ['survival', 'mid_table', 'top_half', 'top_4', 'title_challenge', 'title_winners'];
    const currentIdx = expectationLadder.indexOf(newBoard.currentExpectation);
    if (currentIdx < expectationLadder.length - 1) {
      newBoard.currentExpectation = expectationLadder[currentIdx + 1];
      events.push({
        id: generateEventId(),
        type: 'board_expectation',
        severity: 'medium',
        week: 0, // will be set by caller
        headline: `Board raises expectations to "${formatExpectation(newBoard.currentExpectation)}"`,
        description: `After ${newBoard.consecutiveWins} consecutive wins, the board now expects a ${formatExpectation(newBoard.currentExpectation)} finish. The pressure is on to maintain this form.`,
        source: 'Board',
        effects: [{
          target: 'board_confidence',
          modifier: 10,
          duration: 4,
          description: 'Board confidence boosted by winning run'
        }],
        resolved: false,
      });
    }
  }

  // Board concern after losing streak
  if (newBoard.consecutiveLosses >= 3) {
    events.push({
      id: generateEventId(),
      type: 'board_expectation',
      severity: 'high',
      week: 0,
      headline: `Board concerned after ${newBoard.consecutiveLosses} straight losses`,
      description: 'The board have requested a meeting. Results must improve quickly or changes may be considered.',
      source: 'Board',
      effects: [{
        target: 'board_confidence',
        modifier: -15,
        duration: 3,
        description: 'Board confidence plummeting'
      }],
      resolved: false,
      choices: [
        {
          id: 'promise_improvement',
          label: 'Promise improvement',
          description: 'Assure the board results will turn around. Buys time but raises the stakes.',
          effects: [{ target: 'board_confidence', modifier: 5, duration: 3, description: 'Temporary reprieve' }]
        },
        {
          id: 'blame_injuries',
          label: 'Cite injuries & fixture congestion',
          description: 'Deflect pressure by highlighting the squad situation.',
          effects: [{ target: 'board_confidence', modifier: 3, duration: 2, description: 'Board partially appeased' }]
        },
        {
          id: 'request_funds',
          label: 'Request emergency transfer funds',
          description: 'Ask for budget to strengthen weak areas. High risk if results don\'t follow.',
          effects: [{ target: 'transfer_budget', modifier: 15, duration: 4, description: 'Emergency funds released' }]
        }
      ]
    });
  }

  return { board: newBoard, events };
}

// ========================
// FAN ATMOSPHERE
// ========================

export interface FanAtmosphere {
  homeSupport: number; // 0-100
  awaySupportTravel: number; // 0-100 — how many fans travel
  atmosphereRating: number; // 0-100 — affects home advantage
  recentHomeResults: ('W' | 'D' | 'L')[];
  crowdMood: 'electric' | 'positive' | 'neutral' | 'restless' | 'hostile';
}

export function initFanAtmosphere(team: Team): FanAtmosphere {
  return {
    homeSupport: Math.min(100, 40 + team.reputation * 0.6),
    awaySupportTravel: Math.min(100, 20 + team.reputation * 0.4),
    atmosphereRating: Math.min(100, 50 + team.reputation * 0.5),
    recentHomeResults: [],
    crowdMood: 'positive',
  };
}

export function updateAtmosphereAfterHomeResult(
  atmo: FanAtmosphere,
  result: 'W' | 'D' | 'L'
): { atmosphere: FanAtmosphere; events: SeasonEvent[] } {
  const events: SeasonEvent[] = [];
  const newAtmo = { ...atmo };
  newAtmo.recentHomeResults = [...atmo.recentHomeResults.slice(-5), result];

  const recentHomeLosses = newAtmo.recentHomeResults.filter(r => r === 'L').length;
  const recentHomeWins = newAtmo.recentHomeResults.filter(r => r === 'W').length;

  if (recentHomeLosses >= 3) {
    newAtmo.atmosphereRating = Math.max(10, atmo.atmosphereRating - 15);
    newAtmo.crowdMood = 'hostile';
    events.push({
      id: generateEventId(),
      type: 'fan_atmosphere',
      severity: 'high',
      week: 0,
      headline: 'Fans turning on the team at home',
      description: `With ${recentHomeLosses} home defeats in the last ${newAtmo.recentHomeResults.length} matches, the crowd is becoming hostile. Visiting teams will find it easier to play here. The fortress has fallen.`,
      source: 'Fans',
      effects: [{
        target: 'atmosphere',
        modifier: -15,
        duration: 3,
        description: 'Home advantage significantly reduced'
      }],
      resolved: false,
    });
  } else if (recentHomeWins >= 4) {
    newAtmo.atmosphereRating = Math.min(100, atmo.atmosphereRating + 10);
    newAtmo.crowdMood = 'electric';
    events.push({
      id: generateEventId(),
      type: 'fan_atmosphere',
      severity: 'low',
      week: 0,
      headline: 'Fortress mentality building',
      description: 'The home crowd is behind you. The ground has become a fortress and visiting teams are dreading the trip.',
      source: 'Fans',
      effects: [{
        target: 'atmosphere',
        modifier: 10,
        duration: 4,
        description: 'Home advantage boosted'
      }],
      resolved: false,
    });
  } else if (recentHomeLosses >= 2) {
    newAtmo.crowdMood = 'restless';
    newAtmo.atmosphereRating = Math.max(20, atmo.atmosphereRating - 5);
  } else if (recentHomeWins >= 2) {
    newAtmo.crowdMood = 'positive';
  } else {
    newAtmo.crowdMood = 'neutral';
  }

  return { atmosphere: newAtmo, events };
}

// ========================
// MEDIA & PUNDITRY
// ========================

const MEDIA_TEMPLATES: { condition: (ctx: MediaContext) => boolean; headline: string; description: string; severity: EventSeverity; type: SeasonEventType }[] = [
  {
    condition: (ctx) => ctx.awayLosses >= 3 && ctx.awayWins <= 1,
    headline: '"Can\'t win on the road" — Pundits pile on',
    description: 'The media are questioning whether this team has the mental fortitude to perform away from home. Away results now carry extra weight for team morale.',
    severity: 'medium',
    type: 'media_pressure',
  },
  {
    condition: (ctx) => ctx.recentForm.filter(r => r === 'W').length >= 5,
    headline: '"Title contenders" — Media hype builds',
    description: 'After a brilliant run of form, the pundits are tipping you for the title. The pressure to keep winning intensifies.',
    severity: 'medium',
    type: 'media_pressure',
  },
  {
    condition: (ctx) => ctx.position === 1 && ctx.week >= 15,
    headline: 'Top of the table spotlight',
    description: 'As league leaders, every match is under the microscope. Expect opponents to raise their game against you.',
    severity: 'high',
    type: 'media_pressure',
  },
  {
    condition: (ctx) => ctx.injuredFirstChoice >= 4,
    headline: '"Injury crisis deepens" — Squad stretched thin',
    description: 'Multiple first-choice players are sidelined. The media are questioning squad depth. The board may offer emergency measures.',
    severity: 'high',
    type: 'injury_crisis',
  },
  {
    condition: (ctx) => ctx.position >= ctx.leagueSize - 2 && ctx.week >= 10,
    headline: 'Relegation fears growing',
    description: 'Sitting near the bottom of the table, the pressure is building from all sides. Every point matters now.',
    severity: 'critical',
    type: 'media_pressure',
  },
  {
    condition: (ctx) => ctx.youngStarBreakout,
    headline: '"The future is bright" — Academy graduate shines',
    description: 'A young academy product has caught the eye of the media with impressive recent performances. Expectations are rising for the youngster.',
    severity: 'low',
    type: 'player_milestone',
  },
];

interface MediaContext {
  awayLosses: number;
  awayWins: number;
  recentForm: ('W' | 'D' | 'L')[];
  position: number;
  leagueSize: number;
  week: number;
  injuredFirstChoice: number;
  youngStarBreakout: boolean;
}

export function generateMediaEvents(
  team: Team,
  board: BoardState,
  position: number,
  leagueSize: number,
  week: number
): SeasonEvent[] {
  const events: SeasonEvent[] = [];
  const injuredFirstChoice = team.players.slice(0, 15).filter(p => p.injured).length;
  const youngStar = team.players.some(p => p.age <= 22 && p.overall >= 75 && p.form >= 8);

  const ctx: MediaContext = {
    awayLosses: board.awayRecord.losses,
    awayWins: board.awayRecord.wins,
    recentForm: board.recentResults,
    position,
    leagueSize,
    week,
    injuredFirstChoice,
    youngStarBreakout: youngStar,
  };

  for (const template of MEDIA_TEMPLATES) {
    if (template.condition(ctx)) {
      events.push({
        id: generateEventId(),
        type: template.type,
        severity: template.severity,
        week,
        headline: template.headline,
        description: template.description,
        source: 'Media',
        effects: [{
          target: 'morale',
          modifier: template.severity === 'critical' ? -10 : template.severity === 'high' ? -5 : template.type === 'player_milestone' ? 5 : -3,
          duration: 2,
          description: 'Media narrative affecting squad mentality'
        }],
        resolved: false,
      });
      break; // Only one media event per week
    }
  }

  // Injury crisis — board offers emergency loan
  if (injuredFirstChoice >= 3 && !board.emergencyLoanUsed) {
    events.push({
      id: generateEventId(),
      type: 'emergency_loan',
      severity: 'high',
      week,
      headline: 'Board opens emergency loan market',
      description: `With ${injuredFirstChoice} first-choice players injured, the board has authorised access to the emergency loan market. You can bring in a short-term replacement.`,
      source: 'Board',
      effects: [{
        target: 'transfer_budget',
        modifier: 10,
        duration: 6,
        description: 'Emergency loan market access granted'
      }],
      resolved: false,
      choices: [
        {
          id: 'accept_loan',
          label: 'Accept — sign a loanee',
          description: 'Bring in a temporary signing to cover the crisis.',
          effects: [{ target: 'morale', modifier: 5, duration: 3, description: 'Squad relieved by reinforcement' }]
        },
        {
          id: 'promote_youth',
          label: 'Decline — promote from academy',
          description: 'Show faith in the academy. Risky but builds long-term culture.',
          effects: [{ target: 'board_confidence', modifier: -5, duration: 2, description: 'Board concerned but respects vision' }]
        }
      ]
    });
  }

  return events;
}

// ========================
// REFEREE ASSIGNMENT
// ========================

export interface MatchReferee {
  id: string;
  name: string;
  nationality: string;
  experience: number; // years
  reputation: number; // 1-100
  tendencies: RefereeTendencies;
  recentMatches: number; // matches reffed this season
}

export interface RefereeTendencies {
  breakdownStrictness: number; // 1-10, 10 = very strict
  offsideStrictness: number; // 1-10
  scrumManagement: 'strict' | 'lenient' | 'balanced';
  cardThreshold: 'low' | 'medium' | 'high'; // low = cards easily
  advantageDuration: 'short' | 'medium' | 'long';
  tmoUsage: 'frequent' | 'moderate' | 'rare';
  homeBias: number; // 0-5, subtle
  penaltyCountAverage: number; // typical per match
}

const REFEREE_NAMES: { name: string; nationality: string; tendencies: Partial<RefereeTendencies> }[] = [
  {
    name: 'Wayne Barnes',
    nationality: 'England',
    tendencies: { breakdownStrictness: 8, offsideStrictness: 7, cardThreshold: 'medium', tmoUsage: 'frequent', penaltyCountAverage: 18 }
  },
  {
    name: 'Jaco Peyper',
    nationality: 'South Africa',
    tendencies: { breakdownStrictness: 7, offsideStrictness: 8, cardThreshold: 'low', tmoUsage: 'moderate', penaltyCountAverage: 20 }
  },
  {
    name: 'Nika Amashukeli',
    nationality: 'Georgia',
    tendencies: { breakdownStrictness: 6, offsideStrictness: 7, cardThreshold: 'medium', tmoUsage: 'moderate', penaltyCountAverage: 16 }
  },
  {
    name: 'Luke Pearce',
    nationality: 'England',
    tendencies: { breakdownStrictness: 7, offsideStrictness: 6, cardThreshold: 'high', tmoUsage: 'moderate', penaltyCountAverage: 15 }
  },
  {
    name: 'Andrew Brace',
    nationality: 'Ireland',
    tendencies: { breakdownStrictness: 8, offsideStrictness: 8, cardThreshold: 'medium', tmoUsage: 'frequent', penaltyCountAverage: 19 }
  },
  {
    name: 'Mathieu Raynal',
    nationality: 'France',
    tendencies: { breakdownStrictness: 9, offsideStrictness: 7, cardThreshold: 'low', tmoUsage: 'moderate', penaltyCountAverage: 22 }
  },
  {
    name: 'Ben O\'Keeffe',
    nationality: 'New Zealand',
    tendencies: { breakdownStrictness: 6, offsideStrictness: 6, cardThreshold: 'high', tmoUsage: 'rare', penaltyCountAverage: 14 }
  },
  {
    name: 'Karl Dickson',
    nationality: 'England',
    tendencies: { breakdownStrictness: 7, offsideStrictness: 7, cardThreshold: 'medium', tmoUsage: 'moderate', penaltyCountAverage: 17 }
  },
  {
    name: 'Chris Busby',
    nationality: 'Ireland',
    tendencies: { breakdownStrictness: 6, offsideStrictness: 8, cardThreshold: 'medium', tmoUsage: 'frequent', penaltyCountAverage: 16 }
  },
  {
    name: 'Gianluca Gnecchi',
    nationality: 'Italy',
    tendencies: { breakdownStrictness: 7, offsideStrictness: 6, cardThreshold: 'medium', tmoUsage: 'moderate', penaltyCountAverage: 18 }
  },
  {
    name: 'Pierre Brousset',
    nationality: 'France',
    tendencies: { breakdownStrictness: 8, offsideStrictness: 9, cardThreshold: 'low', tmoUsage: 'frequent', penaltyCountAverage: 21 }
  },
  {
    name: 'AJ Jacobs',
    nationality: 'South Africa',
    tendencies: { breakdownStrictness: 7, offsideStrictness: 7, cardThreshold: 'medium', tmoUsage: 'moderate', penaltyCountAverage: 17 }
  },
];

export function generateRefereePool(): MatchReferee[] {
  return REFEREE_NAMES.map((ref, i) => ({
    id: `ref-${i}`,
    name: ref.name,
    nationality: ref.nationality,
    experience: 5 + Math.floor(Math.random() * 15),
    reputation: 60 + Math.floor(Math.random() * 35),
    tendencies: {
      breakdownStrictness: ref.tendencies.breakdownStrictness || 6,
      offsideStrictness: ref.tendencies.offsideStrictness || 6,
      scrumManagement: ['strict', 'lenient', 'balanced'][Math.floor(Math.random() * 3)] as any,
      cardThreshold: ref.tendencies.cardThreshold || 'medium',
      advantageDuration: ['short', 'medium', 'long'][Math.floor(Math.random() * 3)] as any,
      tmoUsage: ref.tendencies.tmoUsage || 'moderate',
      homeBias: Math.random() * 2,
      penaltyCountAverage: ref.tendencies.penaltyCountAverage || 17,
    },
    recentMatches: Math.floor(Math.random() * 10),
  }));
}

export function assignReferee(pool: MatchReferee[], homeTeamCountry: string): MatchReferee {
  // Prefer refs from different countries to the home team (neutrality)
  const neutralRefs = pool.filter(r => r.nationality !== homeTeamCountry);
  const candidates = neutralRefs.length >= 3 ? neutralRefs : pool;
  
  // Weight by lowest recent matches (spread assignments)
  const sorted = [...candidates].sort((a, b) => a.recentMatches - b.recentMatches);
  const topCandidates = sorted.slice(0, 4);
  const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];
  chosen.recentMatches++;
  return chosen;
}

export function getRefereeTacticalAdvice(ref: MatchReferee): string[] {
  const advice: string[] = [];
  
  if (ref.tendencies.breakdownStrictness >= 8) {
    advice.push('This referee is very strict at the breakdown. Avoid marginal jackals — focus on fast ruck speed instead.');
  } else if (ref.tendencies.breakdownStrictness <= 4) {
    advice.push('Lenient at the breakdown — your jackals and turnovers will be rewarded. Target the ball aggressively.');
  }
  
  if (ref.tendencies.offsideStrictness >= 8) {
    advice.push('Tight on offsides — keep your defensive line honest. Rush defence may draw penalties.');
  }
  
  if (ref.tendencies.cardThreshold === 'low') {
    advice.push('Card-happy referee. Discipline is critical — repeated infringements will lead to yellow cards quickly.');
  } else if (ref.tendencies.cardThreshold === 'high') {
    advice.push('Reluctant to reach for the card. You can push the boundaries more, but don\'t take it too far.');
  }
  
  if (ref.tendencies.tmoUsage === 'frequent') {
    advice.push('Frequently uses the TMO — expect reviews on marginal tries and foul play. Stay disciplined off the ball.');
  }
  
  if (ref.tendencies.scrumManagement === 'strict') {
    advice.push('Strict scrum management — early engagement or angle changes will be penalised.');
  }
  
  if (ref.tendencies.advantageDuration === 'short') {
    advice.push('Plays short advantage — take your chances quickly after a penalty advantage.');
  } else if (ref.tendencies.advantageDuration === 'long') {
    advice.push('Plays long advantage — you\'ll have more time to create from penalty advantages.');
  }
  
  if (ref.tendencies.penaltyCountAverage >= 20) {
    advice.push(`High penalty count referee (avg ${ref.tendencies.penaltyCountAverage}/match). Expect a stop-start game.`);
  }
  
  return advice;
}

// ========================
// DERBY & RIVALRY
// ========================

const RIVALRY_PAIRS: [string, string][] = [
  // Irish derbies
  ['leinster', 'munster'],
  ['leinster', 'connacht'],
  ['munster', 'ulster'],
  ['ulster', 'connacht'],
  // French derbies
  ['toulouse', 'racing92'],
  ['stade-francais', 'racing92'],
  // UK derbies
  ['bath', 'bristol'],
  ['exeter', 'bath'],
  ['saracens', 'harlequins'],
  ['northampton', 'leicester'],
  // SA derbies
  ['stormers', 'sharks'],
  ['bulls', 'lions'],
  ['stormers', 'bulls'],
];

export function isDerby(teamId1: string, teamId2: string): boolean {
  return RIVALRY_PAIRS.some(([a, b]) =>
    (teamId1.includes(a) && teamId2.includes(b)) ||
    (teamId1.includes(b) && teamId2.includes(a))
  );
}

export function generateDerbyEvent(opponentName: string, week: number): SeasonEvent {
  return {
    id: generateEventId(),
    type: 'derby_week',
    severity: 'medium',
    week,
    headline: `Derby day: ${opponentName} this weekend`,
    description: `It\'s derby week. The fans expect a result and the players know what this means. Form goes out the window — it\'s about pride, passion, and bragging rights.`,
    source: 'Fans',
    effects: [
      { target: 'morale', modifier: 5, duration: 1, description: 'Derby adrenaline boost' },
      { target: 'atmosphere', modifier: 15, duration: 1, description: 'Electric derby atmosphere' }
    ],
    resolved: false,
  };
}

// ========================
// SEASON NARRATIVE PROCESSOR
// ========================

export interface SeasonNarrativeState {
  events: SeasonEvent[];
  board: BoardState;
  fanAtmosphere: FanAtmosphere;
  refereePool: MatchReferee[];
  activeEffects: EventEffect[];
  eventsTriggeredThisSeason: Set<string>; // track which templates fired
}

export function initSeasonNarrative(team: Team, leagueSize: number): SeasonNarrativeState {
  return {
    events: [],
    board: initBoardState(team, leagueSize),
    fanAtmosphere: initFanAtmosphere(team),
    refereePool: generateRefereePool(),
    activeEffects: [],
    eventsTriggeredThisSeason: new Set(),
  };
}

export function processWeeklyNarrative(
  state: SeasonNarrativeState,
  team: Team,
  week: number,
  leaguePosition: number,
  leagueSize: number,
  opponentId?: string,
  opponentName?: string
): SeasonNarrativeState {
  const newState = { ...state };
  const newEvents: SeasonEvent[] = [];

  // Remove expired effects
  newState.activeEffects = state.activeEffects.filter(e => e.duration > 0).map(e => ({ ...e, duration: e.duration - 1 }));

  // Generate media events every 3-4 weeks
  if (week % 3 === 0 || week % 4 === 0) {
    const mediaEvents = generateMediaEvents(team, state.board, leaguePosition, leagueSize, week);
    for (const ev of mediaEvents) {
      ev.week = week;
      // Don't repeat the same type too often
      if (!state.eventsTriggeredThisSeason.has(ev.type + '-' + Math.floor(week / 5))) {
        newEvents.push(ev);
        newState.eventsTriggeredThisSeason.add(ev.type + '-' + Math.floor(week / 5));
      }
    }
  }

  // Derby detection
  if (opponentId && opponentName && isDerby(team.id, opponentId)) {
    newEvents.push(generateDerbyEvent(opponentName, week));
  }

  // Add effects from new events
  for (const ev of newEvents) {
    newState.activeEffects.push(...ev.effects);
  }

  newState.events = [...state.events, ...newEvents];
  return newState;
}

// ========================
// HELPERS
// ========================

function generateEventId(): string {
  return 'evt-' + Math.random().toString(36).substring(2, 9);
}

export function formatExpectation(exp: BoardExpectation): string {
  const map: Record<BoardExpectation, string> = {
    survival: 'Avoid Relegation',
    mid_table: 'Mid-Table Finish',
    top_half: 'Top-Half Finish',
    top_4: 'Top 4',
    title_challenge: 'Title Challenge',
    title_winners: 'Win the League',
  };
  return map[exp];
}

export function getAtmosphereModifier(atmo: FanAtmosphere): number {
  if (atmo.crowdMood === 'electric') return 5;
  if (atmo.crowdMood === 'positive') return 2;
  if (atmo.crowdMood === 'neutral') return 0;
  if (atmo.crowdMood === 'restless') return -3;
  if (atmo.crowdMood === 'hostile') return -7;
  return 0;
}

export function getMoraleModifier(effects: EventEffect[]): number {
  return effects
    .filter(e => e.target === 'morale')
    .reduce((sum, e) => sum + e.modifier, 0);
}
