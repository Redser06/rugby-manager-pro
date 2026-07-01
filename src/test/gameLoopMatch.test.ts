import { describe, it, expect } from 'vitest';
import { simulateWeek } from '@/engine/gameLoop';
import { generateSeasonFixtures, getWeekFixtures } from '@/utils/fixtureGenerator';
import { LEAGUES } from '@/data/leagues';
import { League, Team } from '@/types/game';

// Use the real seeded squads (full 23-player rosters with positionNumbers 1-15
// plus bench) so simulateFullMatch has a valid starting XV + sub plan. Cloning
// keeps the module-level LEAGUES seed pristine across runs.
function freshPrem(): League {
  const prem = LEAGUES.find(l => l.id === 'prem')!;
  return JSON.parse(JSON.stringify(prem));
}

describe('gameLoop — player match rich output (P0.3)', () => {
  it('preserves the full EnhancedMatch on the player match result (events, ratings, MOTM, stats)', () => {
    const league = freshPrem();
    const selectedTeam: Team = league.teams[0];
    const schedule = generateSeasonFixtures(league, 1);

    // Find the first week where the selected team actually has a fixture.
    let week = 1;
    let fixture = getWeekFixtures(schedule, week)
      .find(f => f.homeTeamId === selectedTeam.id || f.awayTeamId === selectedTeam.id);
    while (!fixture && week <= schedule.totalWeeks) {
      week++;
      fixture = getWeekFixtures(schedule, week)
        .find(f => f.homeTeamId === selectedTeam.id || f.awayTeamId === selectedTeam.id);
    }
    expect(fixture).toBeDefined();

    const result = simulateWeek(week, schedule, [league], selectedTeam);

    // Thin fields still present (backward-compatible with existing Dashboard toast)
    expect(result.playerMatchResult).toBeDefined();
    const pmr = result.playerMatchResult!;
    expect(typeof pmr.homeScore).toBe('number');
    expect(typeof pmr.awayScore).toBe('number');
    expect(typeof pmr.opponent).toBe('string');
    expect(typeof pmr.isHome).toBe('boolean');
    expect(typeof pmr.won).toBe('boolean');

    // Rich output preserved (P0.3 core assertion)
    expect(pmr.enhancedMatch).toBeDefined();
    const em = pmr.enhancedMatch!;
    expect(em.events.length).toBeGreaterThan(0);
    expect(em.homePlayerRatings.length).toBeGreaterThan(0);
    expect(em.awayPlayerRatings.length).toBeGreaterThan(0);
    expect(em.motmName).toBeTruthy();
    expect(em.homeStats).toBeDefined();
    expect(em.awayStats).toBeDefined();
    expect(em.referee).toBeDefined();
    expect(em.weather).toBeDefined();
    // Scores agree between the thin summary and the rich match
    expect(em.homeScore).toBe(pmr.homeScore);
    expect(em.awayScore).toBe(pmr.awayScore);

    // Fixture written back as completed with the same score
    const playedFixture = result.updatedSchedule.fixtures.find(f => f.week === week && (
      f.homeTeamId === selectedTeam.id || f.awayTeamId === selectedTeam.id
    ));
    expect(playedFixture?.status).toBe('completed');
    expect(playedFixture?.homeScore).toBe(pmr.homeScore);
    expect(playedFixture?.awayScore).toBe(pmr.awayScore);
  });

  it('leaves enhancedMatch undefined on a bye week (no player fixture)', () => {
    const league = freshPrem();
    const selectedTeam: Team = league.teams[0];
    const schedule = generateSeasonFixtures(league, 1);

    // Find a week with NO fixture for the selected team.
    let byeWeek = 1;
    while (byeWeek <= schedule.totalWeeks) {
      const hasFixture = getWeekFixtures(schedule, byeWeek)
        .some(f => f.homeTeamId === selectedTeam.id || f.awayTeamId === selectedTeam.id);
      if (!hasFixture) break;
      byeWeek++;
    }
    // A bye week isn't guaranteed by the generator; skip if none exists.
    const hasFixtureEveryWeek = getWeekFixtures(schedule, byeWeek)
      .some(f => f.homeTeamId === selectedTeam.id || f.awayTeamId === selectedTeam.id);
    if (hasFixtureEveryWeek) return; // no bye week available — nothing to assert

    const result = simulateWeek(byeWeek, schedule, [league], selectedTeam);
    expect(result.playerMatchResult).toBeUndefined();
  });
});