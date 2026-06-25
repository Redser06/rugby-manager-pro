/**
 * Season Rollover Orchestrator (P0.1)
 *
 * Runs at the end of a completed season: produces a season-end summary
 * (SeasonResult — the data contract the SeasonSummary UI renders), then
 * advances the game into the next season:
 *   - currentSeason + 1, currentWeek reset to 1
 *   - all league standings reset to zero
 *   - a fresh fixture schedule generated for the player's league
 *   - every player aged +1 year, with position-aware decline applied past peak
 *   - lastMatchResult cleared
 *
 * Scope note: This orchestrator owns the GameState-level rollover only.
 * The following are deliberately handled by their own workstreams and are
 * left as no-ops here (their data lives outside GameState):
 *   - European cups reset/re-seed ............ P1.6 (state in EuropeanCups.tsx)
 *   - Academy annual intake / regen .......... P1.9 (state in Academy.tsx)
 *   - Contract-year decrement ............... P1.4 (state in TransferContext)
 *   - Rich PlayerExtended aging/retirement ... P1.7 (PlayerExtended not in GameState)
 *   - Promotion/relegation .................. P2.3
 * Each can hook into SeasonResult / rollOverSeason when its state is wired in.
 */

import { GameState, League, Team, Player, LeagueStanding } from '@/types/game';
import { SeasonSchedule } from '@/types/fixture';
import { generateSeasonFixtures } from '@/utils/fixtureGenerator';
import { LEAGUE_QUALIFICATIONS } from '@/types/europeanCompetition';
// Canonical contract type — shared with src/pages/SeasonSummary.tsx (Lovable).
// Re-exported below so existing imports from '@/engine/seasonRollover' keep working.
import { SeasonResult } from '@/types/seasonResult';
export type { SeasonResult } from '@/types/seasonResult';

export interface RolloverResult {
  newGameState: GameState;
  newSchedule: SeasonSchedule | null;
  seasonResult: SeasonResult;
}

// ---------------------------------------------------------------------------
// Completion detection
// ---------------------------------------------------------------------------
export function isSeasonComplete(
  currentWeek: number,
  schedule: SeasonSchedule | null,
): boolean {
  if (!schedule) return false;
  // currentWeek is incremented past the season after the final week simulates.
  // totalWeeks includes a +2 buffer, so a clean trigger is currentWeek > totalWeeks.
  return currentWeek > schedule.totalWeeks;
}

// ---------------------------------------------------------------------------
// Position-aware decline (self-contained, deterministic per position).
// Mirrors the peak/decline windows in engine/retirement.ts without depending
// on PlayerExtended (which is not in GameState). P1.7 will replace this with
// the full applyAgingDecline once PlayerExtended is wired into the weekly loop.
// ---------------------------------------------------------------------------
function declineOnsetAge(position: string): number {
  const p = position.toLowerCase();
  if (p.includes('prop') || p.includes('hooker')) return 34;
  if (p.includes('lock')) return 34;
  if (p.includes('flanker') || p.includes('number 8')) return 33;
  if (p.includes('scrum')) return 33;
  if (p.includes('fly')) return 33;
  if (p.includes('centre')) return 31;
  if (p.includes('wing') || p.includes('fullback')) return 30;
  return 32;
}

function applyAnnualAging(player: Player): Player {
  const newAge = player.age + 1;
  const onset = declineOnsetAge(player.position);

  if (newAge <= onset) {
    // Pre-decline: small chance of a mental/experience bump for older players
    if (newAge >= 24 && Math.random() < 0.3) {
      const overall = Math.min(99, player.overall + 1);
      return { ...player, age: newAge, overall };
    }
    return { ...player, age: newAge };
  }

  // Post-decline: lose ~1 overall per year past onset, accelerating slightly
  const yearsPast = newAge - onset;
  const drop = Math.min(8, yearsPast + (Math.random() < 0.3 ? 1 : 0));
  const overall = Math.max(40, player.overall - drop);
  return { ...player, age: newAge, overall };
}

// ---------------------------------------------------------------------------
// Standings reset
// ---------------------------------------------------------------------------
function emptyStandings(league: League): LeagueStanding[] {
  return league.teams.map(team => ({
    teamId: team.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    bonusPoints: 0,
    totalPoints: 0,
  }));
}

// ---------------------------------------------------------------------------
// Season-end summary (computed from the JUST-FINISHED season's standings)
// ---------------------------------------------------------------------------
function buildSeasonResult(
  prevGameState: GameState,
  prevSchedule: SeasonSchedule | null,
): SeasonResult {
  const team = prevGameState.selectedTeam;
  // IMPORTANT: read the league + its standings from prevGameState.leagues
  // (the just-simulated, final standings), NOT the static LEAGUES import,
  // which holds zeroed/initial standings.
  const league = team
    ? prevGameState.leagues.find(l => l.teams.some(t => t.id === team.id)) ?? null
    : null;
  const season = prevGameState.currentSeason;

  let leagueFinalPosition: number | null = null;
  let trophy: SeasonResult['trophy'];
  let europeanQualified: string | undefined;

  if (team && league) {
    const standings = league.standings ?? [];
    const idx = standings.findIndex(s => s.teamId === team.id);
    leagueFinalPosition = idx >= 0 ? idx + 1 : null;

    if (leagueFinalPosition === 1) {
      trophy = { competition: league.name, name: `${league.name} Champions` };
    }

    // European qualification by final league position
    const qual = LEAGUE_QUALIFICATIONS.find(q => q.leagueId === league.id);
    if (qual && leagueFinalPosition) {
      if (leagueFinalPosition <= qual.championsCupSpots) {
        europeanQualified = 'Heineken Champions Cup';
      } else if (leagueFinalPosition <= qual.championsCupSpots + qual.challengeCupSpots) {
        europeanQualified = 'EPCR Challenge Cup';
      }
    }
  }

  // Next-season preview — competitions the team will enter
  const competitions: string[] = league ? [league.name] : [];
  if (europeanQualified) competitions.push(europeanQualified);

  return {
    season,
    // Rollover only runs when a schedule exists, which requires a selected
    // team, so selectedTeam is non-null here in practice. Coerce to satisfy the
    // canonical contract (SeasonResult.team: Team). SeasonSummary guards on
    // its own `team` (getMyTeam) before rendering, so a null would not crash UI.
    team: team as Team,
    leagueFinalPosition: leagueFinalPosition ?? 0,
    trophy,
    europeanQualified,
    topPerformers: [], // P0.3 — per-match ratings/tries not yet preserved
    academyGraduates: [], // P1.9
    retirements: [], // P1.7
    contractExpiries: [], // P1.4
    financials: { revenue: 0, wages: 0, profit: 0 }, // financials model TBD
    nextSeasonPreview: {
      competitions,
      keyFixtures: [], // filled below after the new schedule is generated
    },
  };
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------
export function rollOverSeason(
  prevGameState: GameState,
  prevSchedule: SeasonSchedule | null,
): RolloverResult {
  const newSeason = prevGameState.currentSeason + 1;

  // 1. Age every player across all leagues (position-aware decline past peak)
  const newLeagues: League[] = prevGameState.leagues.map(league => ({
    ...league,
    teams: league.teams.map(team => ({
      ...team,
      players: team.players.map(applyAnnualAging),
    })),
    // 2. Reset standings
    standings: emptyStandings(league),
  }));

  // Keep selectedTeam reference in sync with the aged/reset league copy.
  // Read from the live newLeagues (the source of truth), NOT the static LEAGUES
  // seed — the team may have been renamed/edited by the user (P1.10 roster editor)
  // or be a custom roster, in which case the static lookup would miss it.
  const findLiveLeague = (teamId: string) =>
    newLeagues.find(l => l.teams.some(t => t.id === teamId)) ?? null;

  let newSelectedTeam: Team | null = prevGameState.selectedTeam;
  if (newSelectedTeam) {
    const league = findLiveLeague(newSelectedTeam.id);
    const refreshed = league?.teams.find(t => t.id === newSelectedTeam!.id) ?? null;
    newSelectedTeam = refreshed ? { ...refreshed } : newSelectedTeam;
  }

  // 3. Generate a fresh schedule for the player's league for the new season
  let newSchedule: SeasonSchedule | null = null;
  if (newSelectedTeam) {
    const league = findLiveLeague(newSelectedTeam.id);
    if (league) {
      newSchedule = generateSeasonFixtures(league, newSeason);
    }
  }

  // 4. Build the season-end summary (reflects the season just finished)
  const seasonResult = buildSeasonResult(prevGameState, prevSchedule);

  // 5. Annotate next-season preview with the first few of the team's fixtures
  if (newSchedule && newSelectedTeam) {
    const upcoming = newSchedule.fixtures
      .filter(f => f.homeTeamId === newSelectedTeam!.id || f.awayTeamId === newSelectedTeam!.id)
      .slice(0, 3)
      .map(f => `${f.homeTeamName} vs ${f.awayTeamName} (Week ${f.week})`);
    seasonResult.nextSeasonPreview.keyFixtures = upcoming;
  }

  const newGameState: GameState = {
    ...prevGameState,
    currentSeason: newSeason,
    currentWeek: 1,
    leagues: newLeagues,
    selectedTeam: newSelectedTeam,
    upcomingMatches: [],
  };

  return { newGameState, newSchedule, seasonResult };
}