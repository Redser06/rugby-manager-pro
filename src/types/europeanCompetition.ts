// European Competition Types

export type EuropeanCompetitionType = 'champions_cup' | 'challenge_cup';

export type EuroPoolPosition = 1 | 2 | 3 | 4 | 5 | 6;

export type KnockoutRound = 'round_of_16' | 'quarter_final' | 'semi_final' | 'final';

export interface EuroPoolMatch {
  id: string;
  round: 1 | 2 | 3 | 4;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
  venue: string;
}

export interface EuroPool {
  id: string;
  name: string; // Pool A, B, C, D
  teams: EuroPoolTeam[];
  matches: EuroPoolMatch[];
}

export interface EuroPoolTeam {
  teamId: string;
  teamName: string;
  league: string; // Which domestic league they're from
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  bonusPoints: number;
  totalPoints: number;
}

export interface EuroKnockoutMatch {
  id: string;
  round: KnockoutRound;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
  venue?: string;
  winner?: string;
  homeHasAdvantage: boolean; // Determined by pool stage ranking
}

export interface EuroKnockoutBracket {
  roundOf16: EuroKnockoutMatch[];
  quarterFinals: EuroKnockoutMatch[];
  semiFinals: EuroKnockoutMatch[];
  final: EuroKnockoutMatch | null;
}

export interface EuropeanCompetition {
  id: EuropeanCompetitionType;
  name: string;
  shortName: string;
  season: number;
  stage: 'pool' | 'knockout' | 'complete';
  currentRound: number; // Pool round 1-4 or knockout round
  pools: EuroPool[];
  knockout: EuroKnockoutBracket;
  qualifiedTeams: string[]; // Team IDs that qualified for knockouts
  droppedToChallengeTeams: string[]; // 5th place teams from Champions Cup
}

export interface EuropeanCompetitionState {
  championsCup: EuropeanCompetition | null;
  challengeCup: EuropeanCompetition | null;
  currentSeason: number;
  initialized: boolean;
}

// Qualification rules per league
export interface LeagueQualification {
  leagueId: string;
  leagueName: string;
  championsCupSpots: number;
  challengeCupSpots: number;
}

export const LEAGUE_QUALIFICATIONS: LeagueQualification[] = [
  { leagueId: 'prem', leagueName: 'Gallagher Premiership', championsCupSpots: 8, challengeCupSpots: 4 },
  { leagueId: 'top14', leagueName: 'Top 14', championsCupSpots: 8, challengeCupSpots: 4 },
  { leagueId: 'urc', leagueName: 'United Rugby Championship', championsCupSpots: 8, challengeCupSpots: 6 },
  // Super Rugby teams don't participate in European competitions
];

// Pool draw constraints - teams from same league cannot be in same pool
export interface PoolDrawConstraints {
  maxTeamsPerLeaguePerPool: number;
  pools: number;
  teamsPerPool: number;
}

export const CHAMPIONS_CUP_CONFIG: PoolDrawConstraints = {
  maxTeamsPerLeaguePerPool: 2, // Max 2 teams from same league per pool
  pools: 4,
  teamsPerPool: 6
};

export const CHALLENGE_CUP_CONFIG: PoolDrawConstraints = {
  maxTeamsPerLeaguePerPool: 2,
  pools: 3,
  teamsPerPool: 6
};
