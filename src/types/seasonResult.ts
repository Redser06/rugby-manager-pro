import { Player, Team } from './game';

/**
 * Contract produced by src/engine/seasonRollover.ts (owned by Claude Code).
 * UI in src/pages/SeasonSummary.tsx renders this shape.
 *
 * Until the engine ships, src/pages/SeasonSummary.tsx renders a stub built
 * from current GameContext state when no real SeasonResult is available.
 */
export interface SeasonResultTopPerformer {
  player: Player;
  rating: number;
  tries: number;
}

export interface SeasonResultFinancials {
  revenue: number;
  wages: number;
  profit: number;
}

export interface SeasonResultNextPreview {
  competitions: string[];
  keyFixtures: string[];
}

export interface SeasonResult {
  season: number;
  team: Team;
  leagueFinalPosition: number;
  trophy?: { competition: string; name: string };
  relegated?: boolean;
  promoted?: boolean;
  europeanQualified?: string;
  topPerformers: SeasonResultTopPerformer[];
  academyGraduates: Player[];
  retirements: Player[];
  contractExpiries: Player[];
  financials: SeasonResultFinancials;
  nextSeasonPreview: SeasonResultNextPreview;
}
