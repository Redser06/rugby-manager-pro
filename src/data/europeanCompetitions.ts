import { LEAGUES, getAllTeams } from './leagues';
import {
  EuropeanCompetition,
  EuroPool,
  EuroPoolTeam,
  EuroPoolMatch,
  EuroKnockoutBracket,
  EuroKnockoutMatch,
  CHAMPIONS_CUP_CONFIG,
  CHALLENGE_CUP_CONFIG,
  LEAGUE_QUALIFICATIONS,
  EuropeanCompetitionType,
} from '@/types/europeanCompetition';
import { Team, LeagueStanding } from '@/types/game';

// Get qualifying teams based on league standings
export function getQualifyingTeams(
  standings: Map<string, LeagueStanding[]>,
  competition: 'champions_cup' | 'challenge_cup'
): Team[] {
  const qualifyingTeams: Team[] = [];
  const allTeams = getAllTeams();

  for (const qual of LEAGUE_QUALIFICATIONS) {
    const leagueStandings = standings.get(qual.leagueId);
    if (!leagueStandings) continue;

    const spots = competition === 'champions_cup' 
      ? qual.championsCupSpots 
      : qual.challengeCupSpots;

    // For Challenge Cup, skip the top teams (they're in Champions Cup)
    const startIndex = competition === 'challenge_cup' ? qual.championsCupSpots : 0;
    const endIndex = competition === 'challenge_cup' 
      ? qual.championsCupSpots + qual.challengeCupSpots 
      : spots;

    const qualifiedIds = leagueStandings
      .slice(startIndex, endIndex)
      .map(s => s.teamId);

    const teams = qualifiedIds
      .map(id => allTeams.find(t => t.id === id))
      .filter((t): t is Team => t !== undefined);

    qualifyingTeams.push(...teams);
  }

  return qualifyingTeams;
}

// For demo/initial state, select top teams by reputation
export function getInitialQualifyingTeams(
  competition: 'champions_cup' | 'challenge_cup'
): Team[] {
  const qualifyingTeams: Team[] = [];

  for (const qual of LEAGUE_QUALIFICATIONS) {
    const league = LEAGUES.find(l => l.id === qual.leagueId);
    if (!league) continue;

    const sortedTeams = [...league.teams].sort((a, b) => b.reputation - a.reputation);
    
    const spots = competition === 'champions_cup' 
      ? qual.championsCupSpots 
      : qual.challengeCupSpots;

    const startIndex = competition === 'challenge_cup' ? qual.championsCupSpots : 0;
    const endIndex = competition === 'challenge_cup' 
      ? Math.min(startIndex + qual.challengeCupSpots, sortedTeams.length)
      : Math.min(spots, sortedTeams.length);

    qualifyingTeams.push(...sortedTeams.slice(startIndex, endIndex));
  }

  return qualifyingTeams;
}

// Shuffle array using Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Group teams by league
function groupTeamsByLeague(teams: Team[]): Map<string, Team[]> {
  const grouped = new Map<string, Team[]>();
  for (const team of teams) {
    const leagueTeams = grouped.get(team.league) || [];
    leagueTeams.push(team);
    grouped.set(team.league, leagueTeams);
  }
  return grouped;
}

// Draw pools ensuring cross-league distribution
export function drawPools(
  teams: Team[],
  poolCount: number,
  teamsPerPool: number
): EuroPool[] {
  const pools: EuroPool[] = [];
  const poolNames = ['A', 'B', 'C', 'D'];
  
  // Initialize empty pools
  for (let i = 0; i < poolCount; i++) {
    pools.push({
      id: `pool-${poolNames[i].toLowerCase()}`,
      name: `Pool ${poolNames[i]}`,
      teams: [],
      matches: []
    });
  }

  // Group by league and shuffle within each group
  const teamsByLeague = groupTeamsByLeague(teams);
  const shuffledByLeague = new Map<string, Team[]>();
  
  for (const [league, leagueTeams] of teamsByLeague) {
    shuffledByLeague.set(league, shuffleArray(leagueTeams));
  }

  // Distribute teams to pools using snake draft to ensure balance
  const allShuffled = shuffleArray(teams);
  
  for (const team of allShuffled) {
    // Find pool with fewest teams from this team's league
    let bestPool = pools[0];
    let minFromLeague = Infinity;
    let minTotal = Infinity;

    for (const pool of pools) {
      if (pool.teams.length >= teamsPerPool) continue;
      
      const fromSameLeague = pool.teams.filter(t => t.league === team.league).length;
      const totalInPool = pool.teams.length;
      
      if (fromSameLeague < minFromLeague || 
          (fromSameLeague === minFromLeague && totalInPool < minTotal)) {
        minFromLeague = fromSameLeague;
        minTotal = totalInPool;
        bestPool = pool;
      }
    }

    if (bestPool.teams.length < teamsPerPool) {
      bestPool.teams.push(createPoolTeam(team));
    }
  }

  // Generate pool matches (4 matches per team, cross-league only)
  for (const pool of pools) {
    pool.matches = generatePoolMatches(pool);
  }

  return pools;
}

function createPoolTeam(team: Team): EuroPoolTeam {
  return {
    teamId: team.id,
    teamName: team.name,
    league: team.league,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    bonusPoints: 0,
    totalPoints: 0
  };
}

// Generate pool stage matches - each team plays 4 cross-league matches
function generatePoolMatches(pool: EuroPool): EuroPoolMatch[] {
  const matches: EuroPoolMatch[] = [];
  const teams = pool.teams;
  
  // Group teams by league within the pool
  const teamsByLeague = new Map<string, EuroPoolTeam[]>();
  for (const team of teams) {
    const leagueTeams = teamsByLeague.get(team.league) || [];
    leagueTeams.push(team);
    teamsByLeague.set(team.league, leagueTeams);
  }

  // Each team plays 4 matches against teams from other leagues
  // 2 home, 2 away
  const matchPairs: { home: EuroPoolTeam; away: EuroPoolTeam }[] = [];
  
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      // Only create match if teams are from different leagues
      if (teams[i].league !== teams[j].league) {
        matchPairs.push({ home: teams[i], away: teams[j] });
      }
    }
  }

  // Shuffle and assign to rounds
  const shuffledPairs = shuffleArray(matchPairs);
  let round = 1;
  let matchesThisRound = 0;
  const matchesPerRound = Math.ceil(shuffledPairs.length / 4);

  for (const pair of shuffledPairs) {
    // Alternate home/away for fairness
    const isHomeFirst = Math.random() > 0.5;
    
    matches.push({
      id: `${pool.id}-match-${matches.length + 1}`,
      round: round as 1 | 2 | 3 | 4,
      homeTeamId: isHomeFirst ? pair.home.teamId : pair.away.teamId,
      awayTeamId: isHomeFirst ? pair.away.teamId : pair.home.teamId,
      played: false,
      venue: isHomeFirst ? pair.home.teamName : pair.away.teamName
    });

    matchesThisRound++;
    if (matchesThisRound >= matchesPerRound && round < 4) {
      round++;
      matchesThisRound = 0;
    }
  }

  return matches;
}

function createEmptyKnockoutBracket(): EuroKnockoutBracket {
  return {
    roundOf16: [],
    quarterFinals: [],
    semiFinals: [],
    final: null
  };
}

// Generate knockout bracket from pool results
export function generateKnockoutBracket(pools: EuroPool[]): EuroKnockoutBracket {
  const bracket: EuroKnockoutBracket = createEmptyKnockoutBracket();
  
  // Get qualified teams (top 4 from each pool)
  const qualifiedByPool: { team: EuroPoolTeam; poolRank: number; poolName: string }[] = [];
  
  for (const pool of pools) {
    const sorted = [...pool.teams].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      const pdA = a.pointsFor - a.pointsAgainst;
      const pdB = b.pointsFor - b.pointsAgainst;
      return pdB - pdA;
    });
    
    sorted.slice(0, 4).forEach((team, idx) => {
      qualifiedByPool.push({
        team,
        poolRank: idx + 1,
        poolName: pool.name
      });
    });
  }

  // Round of 16 matchups
  // 1st place teams host, play against 4th from other pools
  // 2nd place teams host, play against 3rd from other pools
  const firstPlace = qualifiedByPool.filter(t => t.poolRank === 1);
  const secondPlace = qualifiedByPool.filter(t => t.poolRank === 2);
  const thirdPlace = qualifiedByPool.filter(t => t.poolRank === 3);
  const fourthPlace = qualifiedByPool.filter(t => t.poolRank === 4);

  // Create R16 matches
  for (let i = 0; i < firstPlace.length; i++) {
    bracket.roundOf16.push({
      id: `r16-${i * 2 + 1}`,
      round: 'round_of_16',
      homeTeamId: firstPlace[i].team.teamId,
      awayTeamId: fourthPlace[(i + 1) % fourthPlace.length]?.team.teamId || null,
      played: false,
      homeHasAdvantage: true
    });

    bracket.roundOf16.push({
      id: `r16-${i * 2 + 2}`,
      round: 'round_of_16',
      homeTeamId: secondPlace[i].team.teamId,
      awayTeamId: thirdPlace[(i + 1) % thirdPlace.length]?.team.teamId || null,
      played: false,
      homeHasAdvantage: true
    });
  }

  // Create empty QF, SF, Final slots
  for (let i = 0; i < 4; i++) {
    bracket.quarterFinals.push({
      id: `qf-${i + 1}`,
      round: 'quarter_final',
      homeTeamId: null,
      awayTeamId: null,
      played: false,
      homeHasAdvantage: false
    });
  }

  for (let i = 0; i < 2; i++) {
    bracket.semiFinals.push({
      id: `sf-${i + 1}`,
      round: 'semi_final',
      homeTeamId: null,
      awayTeamId: null,
      played: false,
      homeHasAdvantage: false
    });
  }

  bracket.final = {
    id: 'final',
    round: 'final',
    homeTeamId: null,
    awayTeamId: null,
    played: false,
    homeHasAdvantage: false,
    venue: 'TBD'
  };

  return bracket;
}

// Initialize European competitions for a season
export function initializeEuropeanCompetitions(season: number): {
  championsCup: EuropeanCompetition;
  challengeCup: EuropeanCompetition;
} {
  // Get qualifying teams
  const championsTeams = getInitialQualifyingTeams('champions_cup');
  const challengeTeams = getInitialQualifyingTeams('challenge_cup');

  // Draw pools
  const championsPools = drawPools(championsTeams, CHAMPIONS_CUP_CONFIG.pools, CHAMPIONS_CUP_CONFIG.teamsPerPool);
  const challengePools = drawPools(challengeTeams, CHALLENGE_CUP_CONFIG.pools, CHALLENGE_CUP_CONFIG.teamsPerPool);

  return {
    championsCup: {
      id: 'champions_cup',
      name: 'Heineken Champions Cup',
      shortName: 'Champions Cup',
      season,
      stage: 'pool',
      currentRound: 1,
      pools: championsPools,
      knockout: createEmptyKnockoutBracket(),
      qualifiedTeams: [],
      droppedToChallengeTeams: []
    },
    challengeCup: {
      id: 'challenge_cup',
      name: 'EPCR Challenge Cup',
      shortName: 'Challenge Cup',
      season,
      stage: 'pool',
      currentRound: 1,
      pools: challengePools,
      knockout: createEmptyKnockoutBracket(),
      qualifiedTeams: [],
      droppedToChallengeTeams: []
    }
  };
}

// Get team by ID helper
export function getTeamFromCompetition(
  competition: EuropeanCompetition,
  teamId: string
): EuroPoolTeam | undefined {
  for (const pool of competition.pools) {
    const team = pool.teams.find(t => t.teamId === teamId);
    if (team) return team;
  }
  return undefined;
}

// Get pool by team ID
export function getPoolByTeamId(
  competition: EuropeanCompetition,
  teamId: string
): EuroPool | undefined {
  return competition.pools.find(pool => 
    pool.teams.some(t => t.teamId === teamId)
  );
}

// Simulate a pool match result
export function simulatePoolMatch(
  match: EuroPoolMatch,
  pool: EuroPool
): EuroPoolMatch {
  if (match.played) return match;

  const homeTeam = pool.teams.find(t => t.teamId === match.homeTeamId);
  const awayTeam = pool.teams.find(t => t.teamId === match.awayTeamId);
  
  if (!homeTeam || !awayTeam) return match;

  // Simple simulation - random scores
  const homeScore = Math.floor(Math.random() * 35) + 10;
  const awayScore = Math.floor(Math.random() * 35) + 10;
  const homeBonus = homeScore >= awayScore + 7 ? 1 : 0;
  const awayBonus = awayScore >= homeScore + 7 ? 1 : 0;
  const losingBonus = Math.abs(homeScore - awayScore) <= 7 ? 1 : 0;

  // Update team stats
  homeTeam.played++;
  awayTeam.played++;
  homeTeam.pointsFor += homeScore;
  homeTeam.pointsAgainst += awayScore;
  awayTeam.pointsFor += awayScore;
  awayTeam.pointsAgainst += homeScore;

  if (homeScore > awayScore) {
    homeTeam.won++;
    homeTeam.totalPoints += 4;
    homeTeam.bonusPoints += homeBonus;
    homeTeam.totalPoints += homeBonus;
    awayTeam.lost++;
    awayTeam.bonusPoints += losingBonus;
    awayTeam.totalPoints += losingBonus;
  } else if (awayScore > homeScore) {
    awayTeam.won++;
    awayTeam.totalPoints += 4;
    awayTeam.bonusPoints += awayBonus;
    awayTeam.totalPoints += awayBonus;
    homeTeam.lost++;
    homeTeam.bonusPoints += losingBonus;
    homeTeam.totalPoints += losingBonus;
  } else {
    homeTeam.drawn++;
    awayTeam.drawn++;
    homeTeam.totalPoints += 2;
    awayTeam.totalPoints += 2;
  }

  return {
    ...match,
    homeScore,
    awayScore,
    played: true
  };
}
