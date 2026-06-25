import { describe, it, expect } from 'vitest';
import { rollOverSeason, isSeasonComplete, SeasonResult } from '@/engine/seasonRollover';
import { generateSeasonFixtures } from '@/utils/fixtureGenerator';
import { GameState, League, Team, Player, LeagueStanding, Position, PositionNumber, PositionAttributes } from '@/types/game';

function makePlayer(id: string, age: number, position: Position, overall: number): Player {
  // Minimal attributes — shape only matters for typing, not for rollover logic
  const attributes = { scrummaging: 70, strength: 70, endurance: 70, lineoutLifting: 60, ballCarrying: 60, tackling: 70 } as unknown as PositionAttributes;
  return {
    id,
    firstName: 'Test',
    lastName: `Player-${id}`,
    age,
    nationality: 'Ireland',
    position,
    positionNumber: 1 as PositionNumber,
    attributes,
    overall,
    form: 7,
    fitness: 90,
    injured: false,
    injuryWeeks: 0,
  };
}

function makeTeam(id: string, name: string): Team {
  return {
    id,
    name,
    shortName: name.slice(0, 3).toUpperCase(),
    country: 'England',
    league: 'Gallagher Premiership',
    players: [makePlayer(`${id}-p1`, 25, 'Loosehead Prop', 75), makePlayer(`${id}-p2`, 33, 'Fly-half', 82)],
    tactics: { attackStyle: 'structured', defenseStyle: 'rush', scrumFocus: 'balanced', lineoutPrimary: 'middle', tempo: 'controlled', riskLevel: 'medium' },
    kit: { primary: '#000', secondary: '#fff', accent: '#fff', pattern: 'solid', patternSize: 'medium', patternCount: 2, collarTrim: '#fff', cuffTrim: '#fff', shortsColor: '#000', shortsTrim: '#fff', sockPrimary: '#000', sockSecondary: '#fff', sockPattern: 'solid', sockHoopCount: 1 },
    homeGround: 'Test Ground',
    reputation: 80,
    facilities: {
      stadium: { name: 'Ground', capacity: 10000, seatedCapacity: 8000, corporateBoxes: 10, facilityRating: 3, pitchQuality: 3 },
      training: { mainFacilityRating: 3, gymRating: 3, recoveryRating: 3, analysisRating: 3, trainingPitches: 3, indoorFacility: false },
      academy: { overallRating: 3, scoutingNetwork: 3, coachingQuality: 3, youthFacilities: 3, pathwayToFirstTeam: 3, reputation: 70 },
      upgradeRequests: [],
    },
  };
}

function makeStanding(teamId: string, totalPoints: number): LeagueStanding {
  return { teamId, played: 10, won: 0, drawn: 0, lost: 0, pointsFor: 200, pointsAgainst: 100, bonusPoints: 0, totalPoints };
}

function buildLeague(): League {
  const teams = [makeTeam('A', 'Alpha'), makeTeam('B', 'Bravo'), makeTeam('C', 'Charlie'), makeTeam('D', 'Delta')];
  // Standings ordered by totalPoints desc — Alpha is champion
  const standings = [
    makeStanding('A', 40),
    makeStanding('B', 30),
    makeStanding('C', 20),
    makeStanding('D', 10),
  ];
  return { id: 'prem', name: 'Gallagher Premiership', country: 'England', teams, standings };
}

describe('seasonRollover', () => {
  it('isSeasonComplete is true only once currentWeek passes totalWeeks', () => {
    const league = buildLeague();
    const schedule = generateSeasonFixtures(league, 1);
    expect(isSeasonComplete(schedule.totalWeeks, schedule)).toBe(false);
    expect(isSeasonComplete(schedule.totalWeeks + 1, schedule)).toBe(true);
    expect(isSeasonComplete(1, null)).toBe(false);
  });

  it('rolls the season: increments season, resets week + standings, ages players, regenerates fixtures', () => {
    const league = buildLeague();
    const schedule = generateSeasonFixtures(league, 1);
    const selectedTeam = league.teams[0];
    const prevAge = selectedTeam.players[0].age;

    const prevGameState: GameState = {
      currentWeek: schedule.totalWeeks + 5, // well past the end
      currentSeason: 1,
      selectedTeam,
      leagues: [league],
      upcomingMatches: [],
    };

    const rollover = rollOverSeason(prevGameState, schedule);

    // Season + week
    expect(rollover.newGameState.currentSeason).toBe(2);
    expect(rollover.newGameState.currentWeek).toBe(1);

    // Standings zeroed
    const resetLeague = rollover.newGameState.leagues[0];
    expect(resetLeague.standings.every(s => s.played === 0 && s.totalPoints === 0)).toBe(true);

    // Players aged +1
    const agedTeam = rollover.newGameState.leagues[0].teams.find(t => t.id === 'A')!;
    expect(agedTeam.players[0].age).toBe(prevAge + 1);
    // selectedTeam kept in sync with aged copy
    expect(rollover.newGameState.selectedTeam?.players[0].age).toBe(prevAge + 1);

    // New schedule for season 2 — fresh (none completed; some may be
    // 'postponed' due to weather, which is expected from generateSeasonFixtures)
    expect(rollover.newSchedule).not.toBeNull();
    expect(rollover.newSchedule!.seasonNumber).toBe(2);
    expect(rollover.newSchedule!.fixtures.every(f => f.status !== 'completed')).toBe(true);
    expect(rollover.newSchedule!.fixtures.length).toBeGreaterThan(0);
  });

  it('builds a correct season-end summary (champion, European qualification, next-season preview)', () => {
    const league = buildLeague();
    const schedule = generateSeasonFixtures(league, 1);
    const selectedTeam = league.teams[0]; // Alpha = 1st place

    const prevGameState: GameState = {
      currentWeek: schedule.totalWeeks + 5,
      currentSeason: 1,
      selectedTeam,
      leagues: [league],
      upcomingMatches: [],
    };

    const { seasonResult }: { seasonResult: SeasonResult } = rollOverSeason(prevGameState, schedule);

    expect(seasonResult.season).toBe(1);
    expect(seasonResult.team?.id).toBe('A');
    expect(seasonResult.leagueFinalPosition).toBe(1);
    expect(seasonResult.trophy).toBeDefined();
    expect(seasonResult.trophy?.competition).toBe('Gallagher Premiership');
    // prem: championsCupSpots = 8 → 1st place qualifies for Champions Cup
    expect(seasonResult.europeanQualified).toBe('Heineken Champions Cup');
    expect(seasonResult.nextSeasonPreview.competitions).toContain('Gallagher Premiership');
    expect(seasonResult.nextSeasonPreview.competitions).toContain('Heineken Champions Cup');
    expect(seasonResult.nextSeasonPreview.keyFixtures.length).toBeGreaterThan(0);
  });

  it('assigns European qualification correctly for mid-table positions', () => {
    const league = buildLeague();
    const schedule = generateSeasonFixtures(league, 1);
    // Bravo = 2nd → still Champions Cup (within 8 spots)
    const selectedTeam = league.teams[1];

    const prevGameState: GameState = {
      currentWeek: schedule.totalWeeks + 5,
      currentSeason: 1,
      selectedTeam,
      leagues: [league],
      upcomingMatches: [],
    };

    const { seasonResult } = rollOverSeason(prevGameState, schedule);
    expect(seasonResult.leagueFinalPosition).toBe(2);
    expect(seasonResult.europeanQualified).toBe('Heineken Champions Cup');
    expect(seasonResult.trophy).toBeUndefined(); // not champions
  });
});