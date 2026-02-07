import {
  SixNationsFixture,
  SixNationsStanding,
  SixNationsNation,
  NationalTeam,
  SixNationsCallUp,
  SIX_NATIONS_LIST,
  NATIONAL_VENUES,
  NATIONAL_REPUTATIONS,
  NATIONAL_COACHES,
  NATION_TO_NATIONALITY,
  NATIONALITY_TO_NATION,
  SixNationsMatchEvent,
} from '@/types/sixNations';
import { Player, Team, TeamTactics } from '@/types/game';
import { League } from '@/types/game';

const DEFAULT_NATIONAL_TACTICS: TeamTactics = {
  attackStyle: 'structured',
  defenseStyle: 'drift',
  scrumFocus: 'balanced',
  lineoutPrimary: 'middle',
  tempo: 'controlled',
  riskLevel: 'medium',
};

// Standard Six Nations fixture schedule (5 rounds)
// This rotates slightly each year but we use a standard template
const FIXTURE_TEMPLATE: Array<{ home: SixNationsNation; away: SixNationsNation }[]> = [
  // Round 1
  [
    { home: 'Ireland', away: 'England' },
    { home: 'Scotland', away: 'Italy' },
    { home: 'Wales', away: 'France' },
  ],
  // Round 2
  [
    { home: 'England', away: 'Wales' },
    { home: 'France', away: 'Scotland' },
    { home: 'Italy', away: 'Ireland' },
  ],
  // Round 3
  [
    { home: 'Scotland', away: 'England' },
    { home: 'Ireland', away: 'Wales' },
    { home: 'France', away: 'Italy' },
  ],
  // Round 4
  [
    { home: 'Wales', away: 'Scotland' },
    { home: 'England', away: 'Italy' },
    { home: 'France', away: 'Ireland' },
  ],
  // Round 5
  [
    { home: 'Italy', away: 'Wales' },
    { home: 'Ireland', away: 'Scotland' },
    { home: 'England', away: 'France' },
  ],
];

/**
 * Generate the full fixture list for a Six Nations tournament
 */
export function generateSixNationsFixtures(startWeek: number): SixNationsFixture[] {
  const fixtures: SixNationsFixture[] = [];

  FIXTURE_TEMPLATE.forEach((round, roundIndex) => {
    round.forEach((match, matchIndex) => {
      fixtures.push({
        id: `6n-r${roundIndex + 1}-m${matchIndex}`,
        round: roundIndex + 1,
        homeNation: match.home,
        awayNation: match.away,
        venue: NATIONAL_VENUES[match.home],
        played: false,
      });
    });
  });

  return fixtures;
}

/**
 * Create initial standings for all nations
 */
export function createInitialStandings(): SixNationsStanding[] {
  return SIX_NATIONS_LIST.map(nation => ({
    nation,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    triesFor: 0,
    triesAgainst: 0,
    bonusPoints: 0,
    totalPoints: 0,
    pointsDiff: 0,
  }));
}

/**
 * Find all eligible players across all leagues for a given nation
 */
export function getEligiblePlayers(
  nation: SixNationsNation,
  leagues: League[]
): Array<Player & { clubTeamId: string; clubTeamName: string }> {
  const nationality = NATION_TO_NATIONALITY[nation];
  const eligible: Array<Player & { clubTeamId: string; clubTeamName: string }> = [];

  for (const league of leagues) {
    for (const team of league.teams) {
      for (const player of team.players) {
        if (player.nationality === nationality && !player.injured) {
          eligible.push({
            ...player,
            clubTeamId: team.id,
            clubTeamName: team.name,
          });
        }
      }
    }
  }

  // Sort by overall rating descending
  eligible.sort((a, b) => b.overall - a.overall);
  return eligible;
}

/**
 * Selection policy: Ireland & England strongly prefer domestic league players.
 * Other nations select the best available regardless of club league.
 */
const DOMESTIC_LEAGUE_POLICY: Partial<Record<SixNationsNation, { leagueId: string; domestic: boolean }>> = {
  'Ireland': { leagueId: 'urc', domestic: true },   // IRFU policy: must play in Ireland (URC Irish provinces)
  'England': { leagueId: 'prem', domestic: true },   // RFU policy: must play in Premiership
};

// Irish provinces in the URC
const IRISH_CLUB_COUNTRIES = ['Ireland'];
// English clubs in the Premiership — all have country 'England'
const ENGLISH_CLUB_COUNTRIES = ['England'];

/**
 * Auto-select a national squad (top players by position)
 * Ireland & England only pick from their domestic leagues (with rare exceptions for top talent)
 */
export function autoSelectNationalSquad(
  nation: SixNationsNation,
  leagues: League[]
): Array<Player & { clubTeamId: string; clubTeamName: string }> {
  const allEligible = getEligiblePlayers(nation, leagues);
  const selected: Array<Player & { clubTeamId: string; clubTeamName: string }> = [];

  const policy = DOMESTIC_LEAGUE_POLICY[nation];

  // Split into domestic and overseas pools
  let domesticPool = allEligible;
  let overseasPool: typeof allEligible = [];

  if (policy?.domestic) {
    if (nation === 'Ireland') {
      // Irish provinces are URC teams with country 'Ireland'
      domesticPool = allEligible.filter(p => {
        const team = findTeamForPlayer(p.clubTeamId, leagues);
        return team?.country === 'Ireland' && team?.league === 'URC';
      });
      overseasPool = allEligible.filter(p => !domesticPool.some(d => d.id === p.id));
    } else if (nation === 'England') {
      // English players must play in the Premiership
      domesticPool = allEligible.filter(p => {
        const team = findTeamForPlayer(p.clubTeamId, leagues);
        return team?.league === 'Premiership';
      });
      overseasPool = allEligible.filter(p => !domesticPool.some(d => d.id === p.id));
    }
  }

  // Target squad: 33 players
  const positionTargets: Record<number, number> = {
    1: 3, 2: 3, 3: 3, // Front row
    4: 2, 5: 2,        // Locks
    6: 2, 7: 2, 8: 2,  // Back row
    9: 2, 10: 2,        // Half backs
    11: 2, 12: 2, 13: 2, 14: 2, 15: 2, // Backs
  };

  // First pass: fill from domestic pool
  for (const [posNum, count] of Object.entries(positionTargets)) {
    const positionPlayers = domesticPool.filter(
      p => p.positionNumber === parseInt(posNum) && !selected.some(s => s.id === p.id)
    );
    selected.push(...positionPlayers.slice(0, count));
  }

  // Second pass: if domestic pool couldn't fill all positions, use overseas as fallback
  // (Only relevant for Ireland/England — represents "exceptional circumstances" picks)
  if (policy?.domestic) {
    for (const [posNum, count] of Object.entries(positionTargets)) {
      const currentCount = selected.filter(p => p.positionNumber === parseInt(posNum)).length;
      if (currentCount < count) {
        const remaining = count - currentCount;
        const positionPlayers = overseasPool.filter(
          p => p.positionNumber === parseInt(posNum) && !selected.some(s => s.id === p.id)
        );
        selected.push(...positionPlayers.slice(0, remaining));
      }
    }
  }

  return selected;
}

/** Helper to find a team by ID across all leagues */
function findTeamForPlayer(teamId: string, leagues: League[]): { country: string; league: string } | null {
  for (const league of leagues) {
    for (const team of league.teams) {
      if (team.id === teamId) {
        return { country: team.country, league: team.league };
      }
    }
  }
  return null;
}

/**
 * Create national team objects for all 6 nations
 */
export function createNationalTeams(leagues: League[]): NationalTeam[] {
  return SIX_NATIONS_LIST.map(nation => {
    const autoSquad = autoSelectNationalSquad(nation, leagues);
    return {
      nation,
      shortName: nation.substring(0, 3).toUpperCase(),
      homeVenue: NATIONAL_VENUES[nation],
      reputation: NATIONAL_REPUTATIONS[nation],
      squad: autoSquad.map(({ clubTeamId, clubTeamName, ...player }) => player),
      tactics: { ...DEFAULT_NATIONAL_TACTICS },
      coachName: NATIONAL_COACHES[nation],
    };
  });
}

/**
 * Generate call-up records from national squads
 */
export function generateCallUps(
  nationalTeams: NationalTeam[],
  leagues: League[]
): SixNationsCallUp[] {
  const callUps: SixNationsCallUp[] = [];

  for (const nt of nationalTeams) {
    for (const player of nt.squad) {
      // Find which club this player belongs to
      let clubTeamId = '';
      let clubTeamName = '';
      for (const league of leagues) {
        for (const team of league.teams) {
          if (team.players.some(p => p.id === player.id)) {
            clubTeamId = team.id;
            clubTeamName = team.name;
            break;
          }
        }
        if (clubTeamId) break;
      }

      callUps.push({
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        nation: nt.nation,
        clubTeamId,
        clubTeamName,
        position: player.position,
        overall: player.overall,
        injured: false,
        injuryWeeks: 0,
        suspended: false,
        suspensionWeeks: 0,
      });
    }
  }

  return callUps;
}

/**
 * Simulate a Six Nations match
 */
export function simulateSixNationsMatch(
  homeTeam: NationalTeam,
  awayTeam: NationalTeam
): { homeScore: number; awayScore: number; homeTries: number; awayTries: number; events: SixNationsMatchEvent[] } {
  const events: SixNationsMatchEvent[] = [];
  let homeScore = 0;
  let awayScore = 0;
  let homeTries = 0;
  let awayTries = 0;

  const homeStrength = homeTeam.reputation + 5 + Math.random() * 20; // Home advantage
  const awayStrength = awayTeam.reputation + Math.random() * 20;

  for (let minute = 1; minute <= 80; minute++) {
    const eventChance = Math.random();

    if (eventChance < 0.055) {
      // Try
      const isHome = Math.random() < homeStrength / (homeStrength + awayStrength);
      const team = isHome ? homeTeam : awayTeam;
      const backs = team.squad.filter(p => p.positionNumber >= 9);
      const scorer = backs.length > 0
        ? backs[Math.floor(Math.random() * backs.length)]
        : team.squad[Math.floor(Math.random() * team.squad.length)];

      if (isHome) { homeScore += 5; homeTries++; }
      else { awayScore += 5; awayTries++; }

      events.push({
        minute,
        type: 'try',
        team: isHome ? 'home' : 'away',
        playerName: scorer ? `${scorer.firstName} ${scorer.lastName}` : 'Unknown',
        description: `TRY! ${scorer?.firstName} ${scorer?.lastName} scores for ${team.nation}!`,
      });

      // Conversion
      if (Math.random() < 0.75) {
        if (isHome) homeScore += 2; else awayScore += 2;
        events.push({
          minute,
          type: 'conversion',
          team: isHome ? 'home' : 'away',
          description: 'Conversion successful!',
        });
      }
    } else if (eventChance < 0.11) {
      // Penalty
      const isHome = Math.random() < 0.5;
      if (isHome) homeScore += 3; else awayScore += 3;
      events.push({
        minute,
        type: 'penalty',
        team: isHome ? 'home' : 'away',
        description: 'Penalty kick successful!',
      });
    } else if (eventChance < 0.12) {
      // Yellow card
      const isHome = Math.random() < 0.5;
      const team = isHome ? homeTeam : awayTeam;
      const player = team.squad[Math.floor(Math.random() * team.squad.length)];
      events.push({
        minute,
        type: 'yellow_card',
        team: isHome ? 'home' : 'away',
        playerName: player ? `${player.firstName} ${player.lastName}` : 'Unknown',
        description: `Yellow card for ${player?.firstName} ${player?.lastName}`,
      });
    }
  }

  return {
    homeScore,
    awayScore,
    homeTries,
    awayTries,
    events: events.sort((a, b) => a.minute - b.minute),
  };
}

/**
 * Generate injury/suspension outcomes for called-up players (~25% risk)
 */
export function generatePostTournamentOutcomes(callUps: SixNationsCallUp[]): SixNationsCallUp[] {
  return callUps.map(callUp => {
    const roll = Math.random();

    if (roll < 0.15) {
      // Injured (15%)
      const injuryWeeks = Math.floor(Math.random() * 6) + 1; // 1-6 weeks
      return { ...callUp, injured: true, injuryWeeks };
    } else if (roll < 0.25) {
      // Suspended (10%)
      const suspensionWeeks = Math.floor(Math.random() * 3) + 1; // 1-3 weeks
      return { ...callUp, suspended: true, suspensionWeeks };
    }

    return callUp;
  });
}

/**
 * Update standings after a match result
 */
export function updateStandings(
  standings: SixNationsStanding[],
  fixture: SixNationsFixture
): SixNationsStanding[] {
  if (!fixture.played || fixture.homeScore === undefined || fixture.awayScore === undefined) {
    return standings;
  }

  return standings.map(s => {
    if (s.nation !== fixture.homeNation && s.nation !== fixture.awayNation) return s;

    const isHome = s.nation === fixture.homeNation;
    const pf = isHome ? fixture.homeScore! : fixture.awayScore!;
    const pa = isHome ? fixture.awayScore! : fixture.homeScore!;
    const tf = isHome ? (fixture.homeTries || 0) : (fixture.awayTries || 0);
    const ta = isHome ? (fixture.awayTries || 0) : (fixture.homeTries || 0);

    const won = pf > pa;
    const drawn = pf === pa;
    const lost = pf < pa;

    // Bonus points: 4+ tries = 1bp, losing by 7 or less = 1bp
    let bp = 0;
    if (tf >= 4) bp += 1;
    if (lost && pa - pf <= 7) bp += 1;

    // Match points: W=4, D=2, L=0
    const matchPoints = won ? 4 : drawn ? 2 : 0;

    return {
      ...s,
      played: s.played + 1,
      won: s.won + (won ? 1 : 0),
      drawn: s.drawn + (drawn ? 1 : 0),
      lost: s.lost + (lost ? 1 : 0),
      pointsFor: s.pointsFor + pf,
      pointsAgainst: s.pointsAgainst + pa,
      triesFor: s.triesFor + tf,
      triesAgainst: s.triesAgainst + ta,
      bonusPoints: s.bonusPoints + bp,
      totalPoints: s.totalPoints + matchPoints + bp,
      pointsDiff: (s.pointsFor + pf) - (s.pointsAgainst + pa),
    };
  });
}
