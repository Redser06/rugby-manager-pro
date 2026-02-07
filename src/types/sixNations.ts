import { Player, Team, TeamTactics } from './game';

// The six participating nations
export type SixNationsNation = 'Ireland' | 'England' | 'Scotland' | 'Wales' | 'Italy' | 'France';

export const SIX_NATIONS_LIST: SixNationsNation[] = ['Ireland', 'England', 'Scotland', 'Wales', 'Italy', 'France'];

// Map nationality strings used in player data to Six Nations teams
export const NATIONALITY_TO_NATION: Record<string, SixNationsNation> = {
  'Irish': 'Ireland',
  'English': 'England',
  'Scottish': 'Scotland',
  'Welsh': 'Wales',
  'Italian': 'Italy',
  'French': 'France',
};

export const NATION_TO_NATIONALITY: Record<SixNationsNation, string> = {
  'Ireland': 'Irish',
  'England': 'English',
  'Scotland': 'Scottish',
  'Wales': 'Welsh',
  'Italy': 'Italian',
  'France': 'French',
};

// National team data
export interface NationalTeam {
  nation: SixNationsNation;
  shortName: string;
  homeVenue: string;
  reputation: number;
  squad: Player[]; // Selected players from club squads
  tactics: TeamTactics;
  coachName: string;
}

// A call-up linking a player to national duty
export interface SixNationsCallUp {
  playerId: string;
  playerName: string;
  nation: SixNationsNation;
  clubTeamId: string;
  clubTeamName: string;
  position: string;
  overall: number;
  // Post-tournament outcome
  injured: boolean;
  injuryWeeks: number;
  suspended: boolean;
  suspensionWeeks: number;
}

// Tournament fixture
export interface SixNationsFixture {
  id: string;
  round: number;
  homeNation: SixNationsNation;
  awayNation: SixNationsNation;
  venue: string;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  homeTries?: number;
  awayTries?: number;
  events?: SixNationsMatchEvent[];
}

export interface SixNationsMatchEvent {
  minute: number;
  type: 'try' | 'conversion' | 'penalty' | 'drop_goal' | 'yellow_card' | 'red_card' | 'injury';
  team: 'home' | 'away';
  playerName?: string;
  description: string;
}

// Championship standings
export interface SixNationsStanding {
  nation: SixNationsNation;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  triesFor: number;
  triesAgainst: number;
  bonusPoints: number;
  totalPoints: number;
  pointsDiff: number;
}

// Overall tournament state
export interface SixNationsState {
  active: boolean;
  currentRound: number; // 1-5
  startWeek: number; // The game week the tournament starts
  endWeek: number;
  nationalTeams: NationalTeam[];
  fixtures: SixNationsFixture[];
  standings: SixNationsStanding[];
  callUps: SixNationsCallUp[];
  completed: boolean;
  // Is the user managing a national team?
  userNation: SixNationsNation | null;
}

// The Six Nations window config
export const SIX_NATIONS_START_WEEK = 19;
export const SIX_NATIONS_END_WEEK = 23;
export const SIX_NATIONS_ROUNDS = 5;

// National team venues
export const NATIONAL_VENUES: Record<SixNationsNation, string> = {
  'Ireland': 'Aviva Stadium',
  'England': 'Twickenham',
  'Scotland': 'Murrayfield',
  'Wales': 'Principality Stadium',
  'Italy': 'Stadio Olimpico',
  'France': 'Stade de France',
};

// National team reputations
export const NATIONAL_REPUTATIONS: Record<SixNationsNation, number> = {
  'Ireland': 95,
  'France': 93,
  'England': 90,
  'Scotland': 82,
  'Wales': 80,
  'Italy': 65,
};

// AI coach names for nations user doesn't manage
export const NATIONAL_COACHES: Record<SixNationsNation, string> = {
  'Ireland': 'Andy Farrell',
  'England': 'Steve Borthwick',
  'Scotland': 'Gregor Townsend',
  'Wales': 'Warren Gatland',
  'Italy': 'Gonzalo Quesada',
  'France': 'Fabien Galthié',
};
