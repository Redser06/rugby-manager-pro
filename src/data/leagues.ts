import { League, Team, TeamTactics, LeagueStanding, TeamKit } from '@/types/game';
import { generateSquad } from './playerGenerator';

const DEFAULT_TACTICS: TeamTactics = {
  attackStyle: 'structured',
  defenseStyle: 'drift',
  scrumFocus: 'balanced',
  lineoutPrimary: 'middle',
  tempo: 'controlled',
  riskLevel: 'medium'
};

const DEFAULT_KIT: TeamKit = {
  primary: '#1e3a5f',
  secondary: '#ffffff',
  accent: '#d4af37',
  pattern: 'solid'
};

function createTeam(
  name: string, 
  shortName: string, 
  country: string, 
  league: string, 
  homeGround: string, 
  reputation: number
): Team {
  return {
    id: `${shortName.toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    shortName,
    country,
    league,
    players: generateSquad(country, reputation),
    tactics: { ...DEFAULT_TACTICS },
    kit: { ...DEFAULT_KIT },
    homeGround,
    reputation
  };
}

function createStanding(teamId: string): LeagueStanding {
  return {
    teamId,
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

// United Rugby Championship (Celtic + Italian teams)
const urcTeams: Team[] = [
  // Ireland
  createTeam('Leinster Rugby', 'LEI', 'Ireland', 'URC', 'Aviva Stadium', 90),
  createTeam('Munster Rugby', 'MUN', 'Ireland', 'URC', 'Thomond Park', 85),
  createTeam('Ulster Rugby', 'ULS', 'Ireland', 'URC', 'Kingspan Stadium', 78),
  createTeam('Connacht Rugby', 'CON', 'Ireland', 'URC', 'The Sportsground', 72),
  // Wales
  createTeam('Scarlets', 'SCA', 'Wales', 'URC', 'Parc y Scarlets', 75),
  createTeam('Ospreys', 'OSP', 'Wales', 'URC', 'Swansea.com Stadium', 73),
  createTeam('Cardiff Rugby', 'CAR', 'Wales', 'URC', 'Cardiff Arms Park', 70),
  createTeam('Dragons RFC', 'DRA', 'Wales', 'URC', 'Rodney Parade', 65),
  // Scotland
  createTeam('Edinburgh Rugby', 'EDI', 'Scotland', 'URC', 'Scottish Gas Murrayfield', 74),
  createTeam('Glasgow Warriors', 'GLA', 'Scotland', 'URC', 'Scotstoun Stadium', 76),
  createTeam('Caledonia Reds', 'CAL', 'Scotland', 'URC', 'Pittodrie Stadium', 60),
  createTeam('Border Reivers', 'BOR', 'Scotland', 'URC', 'Greenyards', 58),
  // Italy
  createTeam('Benetton Rugby', 'BEN', 'Italy', 'URC', 'Stadio Monigo', 68),
  createTeam('Zebre Parma', 'ZEB', 'Italy', 'URC', 'Stadio Sergio Lanfranchi', 62),
  createTeam('Roma Leoni', 'ROM', 'Italy', 'URC', 'Stadio Flaminio', 55),
  createTeam('Milano Rugby', 'MIL', 'Italy', 'URC', 'Arena Civica', 52)
];

// English Premiership
const premTeams: Team[] = [
  createTeam('Saracens', 'SAR', 'England', 'Premiership', 'StoneX Stadium', 88),
  createTeam('Leicester Tigers', 'LEI', 'England', 'Premiership', 'Welford Road', 85),
  createTeam('Sale Sharks', 'SAL', 'England', 'Premiership', 'AJ Bell Stadium', 82),
  createTeam('Northampton Saints', 'NOR', 'England', 'Premiership', "Franklin's Gardens", 80),
  createTeam('Bath Rugby', 'BAT', 'England', 'Premiership', 'The Rec', 79),
  createTeam('Harlequins', 'HAR', 'England', 'Premiership', 'Twickenham Stoop', 81),
  createTeam('Bristol Bears', 'BRI', 'England', 'Premiership', 'Ashton Gate', 78),
  createTeam('Exeter Chiefs', 'EXE', 'England', 'Premiership', 'Sandy Park', 77),
  createTeam('Gloucester Rugby', 'GLO', 'England', 'Premiership', 'Kingsholm Stadium', 74),
  createTeam('London Irish', 'LON', 'England', 'Premiership', 'Gtech Community Stadium', 70),
  createTeam('Newcastle Falcons', 'NEW', 'England', 'Premiership', 'Kingston Park', 68),
  createTeam('Worcester Warriors', 'WOR', 'England', 'Premiership', 'Sixways Stadium', 65),
  createTeam('Wasps', 'WAS', 'England', 'Premiership', 'Coventry Building Society Arena', 72),
  createTeam('Richmond FC', 'RIC', 'England', 'Premiership', 'Athletic Ground', 55),
  createTeam('Coventry Rugby', 'COV', 'England', 'Premiership', 'Butts Park Arena', 58),
  createTeam('Ealing Trailfinders', 'EAL', 'England', 'Premiership', 'Trailfinders Sports Ground', 60)
];

// French Top 14
const top14Teams: Team[] = [
  createTeam('Toulouse', 'TOU', 'France', 'Top 14', 'Stade Ernest-Wallon', 92),
  createTeam('La Rochelle', 'LRO', 'France', 'Top 14', 'Stade Marcel-Deflandre', 88),
  createTeam('Racing 92', 'RAC', 'France', 'Top 14', 'Paris La Défense Arena', 85),
  createTeam('Stade Français Paris', 'SFP', 'France', 'Top 14', 'Stade Jean-Bouin', 78),
  createTeam('RC Toulon', 'RCT', 'France', 'Top 14', 'Stade Mayol', 82),
  createTeam('ASM Clermont', 'CLE', 'France', 'Top 14', 'Stade Marcel-Michelin', 80),
  createTeam('Montpellier', 'MON', 'France', 'Top 14', 'GGL Stadium', 79),
  createTeam('Lyon OU', 'LOU', 'France', 'Top 14', 'Matmut Stadium', 76),
  createTeam('Castres Olympique', 'CAS', 'France', 'Top 14', 'Stade Pierre-Fabre', 74),
  createTeam('Bordeaux-Bègles', 'UBB', 'France', 'Top 14', 'Stade Chaban-Delmas', 81),
  createTeam('Stade Rochelais', 'SRO', 'France', 'Top 14', 'Stade Marcellin-Champagnat', 72),
  createTeam('Section Paloise', 'PAU', 'France', 'Top 14', 'Stade du Hameau', 68),
  createTeam('USA Perpignan', 'PER', 'France', 'Top 14', 'Stade Aimé-Giral', 65),
  createTeam('Aviron Bayonnais', 'BAY', 'France', 'Top 14', 'Stade Jean-Dauger', 67),
  createTeam('Brive', 'BRI', 'France', 'Top 14', 'Stade Amédée-Domenech', 63),
  createTeam('Oyonnax Rugby', 'OYO', 'France', 'Top 14', 'Stade Charles-Mathon', 60)
];

// Super Rugby Pacific (Southern Hemisphere)
const superRugbyTeams: Team[] = [
  // New Zealand
  createTeam('Crusaders', 'CRU', 'New Zealand', 'Super Rugby', 'Orangetheory Stadium', 93),
  createTeam('Blues', 'BLU', 'New Zealand', 'Super Rugby', 'Eden Park', 90),
  // South Africa
  createTeam('Stormers', 'STO', 'South Africa', 'Super Rugby', 'DHL Stadium', 86),
  createTeam('Bulls', 'BUL', 'South Africa', 'Super Rugby', 'Loftus Versfeld', 84),
  // Australia
  createTeam('Queensland Reds', 'RED', 'Australia', 'Super Rugby', 'Suncorp Stadium', 75),
  createTeam('NSW Waratahs', 'WAR', 'Australia', 'Super Rugby', 'Sydney Football Stadium', 72)
];

export const LEAGUES: League[] = [
  {
    id: 'urc',
    name: 'United Rugby Championship',
    country: 'Multi',
    teams: urcTeams,
    standings: urcTeams.map(t => createStanding(t.id))
  },
  {
    id: 'prem',
    name: 'Gallagher Premiership',
    country: 'England',
    teams: premTeams,
    standings: premTeams.map(t => createStanding(t.id))
  },
  {
    id: 'top14',
    name: 'Top 14',
    country: 'France',
    teams: top14Teams,
    standings: top14Teams.map(t => createStanding(t.id))
  },
  {
    id: 'super',
    name: 'Super Rugby Pacific',
    country: 'Multi',
    teams: superRugbyTeams,
    standings: superRugbyTeams.map(t => createStanding(t.id))
  }
];

export function getAllTeams(): Team[] {
  return LEAGUES.flatMap(league => league.teams);
}

export function getTeamById(teamId: string): Team | undefined {
  return getAllTeams().find(t => t.id === teamId);
}

export function getLeagueByTeamId(teamId: string): League | undefined {
  return LEAGUES.find(league => league.teams.some(t => t.id === teamId));
}
