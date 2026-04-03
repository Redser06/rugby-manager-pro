import { League, Team, TeamTactics, LeagueStanding, TeamKit, TeamFacilities, FacilityRating } from '@/types/game';
import { generateSquad } from './playerGenerator';
import { generateStaffForTeam, getDefaultPhilosophy } from './staffGenerator';

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
  pattern: 'solid',
  patternSize: 'medium',
  patternCount: 4,
  collarTrim: '#d4af37',
  cuffTrim: '#d4af37',
  shortsColor: '#1e3a5f',
  shortsTrim: '#ffffff',
  sockPrimary: '#1e3a5f',
  sockSecondary: '#ffffff',
  sockPattern: 'solid',
  sockHoopCount: 2
};

// Stadium data with realistic capacities based on actual venues
interface StadiumData {
  name: string;
  capacity: number;
  seatedCapacity: number;
  corporateBoxes: number;
  facilityRating: FacilityRating;
  pitchQuality: FacilityRating;
}

const STADIUM_DATA: Record<string, StadiumData> = {
  // URC - Ireland
  'Aviva Stadium': { name: 'Aviva Stadium', capacity: 51700, seatedCapacity: 51700, corporateBoxes: 48, facilityRating: 5, pitchQuality: 5 },
  'Thomond Park': { name: 'Thomond Park', capacity: 25600, seatedCapacity: 25600, corporateBoxes: 24, facilityRating: 4, pitchQuality: 4 },
  'Kingspan Stadium': { name: 'Kingspan Stadium', capacity: 18000, seatedCapacity: 18000, corporateBoxes: 18, facilityRating: 4, pitchQuality: 4 },
  'The Sportsground': { name: 'The Sportsground', capacity: 8100, seatedCapacity: 5100, corporateBoxes: 6, facilityRating: 3, pitchQuality: 3 },
  // URC - Wales
  'Parc y Scarlets': { name: 'Parc y Scarlets', capacity: 14870, seatedCapacity: 14870, corporateBoxes: 12, facilityRating: 4, pitchQuality: 4 },
  'Swansea.com Stadium': { name: 'Swansea.com Stadium', capacity: 21088, seatedCapacity: 21088, corporateBoxes: 20, facilityRating: 4, pitchQuality: 4 },
  'Cardiff Arms Park': { name: 'Cardiff Arms Park', capacity: 12500, seatedCapacity: 10000, corporateBoxes: 10, facilityRating: 3, pitchQuality: 3 },
  'Rodney Parade': { name: 'Rodney Parade', capacity: 8500, seatedCapacity: 6500, corporateBoxes: 8, facilityRating: 2, pitchQuality: 3 },
  // URC - Scotland
  'Scottish Gas Murrayfield': { name: 'Scottish Gas Murrayfield', capacity: 67144, seatedCapacity: 67144, corporateBoxes: 60, facilityRating: 5, pitchQuality: 5 },
  'Scotstoun Stadium': { name: 'Scotstoun Stadium', capacity: 10000, seatedCapacity: 7500, corporateBoxes: 8, facilityRating: 3, pitchQuality: 4 },
  'Pittodrie Stadium': { name: 'Pittodrie Stadium', capacity: 20866, seatedCapacity: 20866, corporateBoxes: 15, facilityRating: 3, pitchQuality: 3 },
  'Greenyards': { name: 'Greenyards', capacity: 6000, seatedCapacity: 3000, corporateBoxes: 4, facilityRating: 2, pitchQuality: 2 },
  // URC - Italy
  'Stadio Monigo': { name: 'Stadio Monigo', capacity: 8000, seatedCapacity: 6000, corporateBoxes: 6, facilityRating: 3, pitchQuality: 3 },
  'Stadio Sergio Lanfranchi': { name: 'Stadio Sergio Lanfranchi', capacity: 7000, seatedCapacity: 5000, corporateBoxes: 4, facilityRating: 2, pitchQuality: 3 },
  'Stadio Flaminio': { name: 'Stadio Flaminio', capacity: 32000, seatedCapacity: 25000, corporateBoxes: 20, facilityRating: 2, pitchQuality: 2 },
  'Arena Civica': { name: 'Arena Civica', capacity: 10000, seatedCapacity: 8000, corporateBoxes: 6, facilityRating: 2, pitchQuality: 2 },
  // Premiership
  'StoneX Stadium': { name: 'StoneX Stadium', capacity: 10000, seatedCapacity: 10000, corporateBoxes: 16, facilityRating: 4, pitchQuality: 5 },
  'Welford Road': { name: 'Welford Road', capacity: 25849, seatedCapacity: 21500, corporateBoxes: 22, facilityRating: 4, pitchQuality: 4 },
  'AJ Bell Stadium': { name: 'AJ Bell Stadium', capacity: 12000, seatedCapacity: 12000, corporateBoxes: 14, facilityRating: 4, pitchQuality: 4 },
  "Franklin's Gardens": { name: "Franklin's Gardens", capacity: 15000, seatedCapacity: 13500, corporateBoxes: 16, facilityRating: 4, pitchQuality: 4 },
  'The Rec': { name: 'The Rec', capacity: 14509, seatedCapacity: 11000, corporateBoxes: 12, facilityRating: 3, pitchQuality: 4 },
  'Twickenham Stoop': { name: 'Twickenham Stoop', capacity: 14800, seatedCapacity: 12500, corporateBoxes: 14, facilityRating: 4, pitchQuality: 4 },
  'Ashton Gate': { name: 'Ashton Gate', capacity: 27000, seatedCapacity: 27000, corporateBoxes: 28, facilityRating: 5, pitchQuality: 5 },
  'Sandy Park': { name: 'Sandy Park', capacity: 13500, seatedCapacity: 12000, corporateBoxes: 12, facilityRating: 4, pitchQuality: 5 },
  'Kingsholm Stadium': { name: 'Kingsholm Stadium', capacity: 16500, seatedCapacity: 12000, corporateBoxes: 14, facilityRating: 3, pitchQuality: 4 },
  'Gtech Community Stadium': { name: 'Gtech Community Stadium', capacity: 17250, seatedCapacity: 17250, corporateBoxes: 20, facilityRating: 5, pitchQuality: 5 },
  'Kingston Park': { name: 'Kingston Park', capacity: 10200, seatedCapacity: 8000, corporateBoxes: 10, facilityRating: 3, pitchQuality: 3 },
  'Sixways Stadium': { name: 'Sixways Stadium', capacity: 12024, seatedCapacity: 11000, corporateBoxes: 12, facilityRating: 3, pitchQuality: 3 },
  'Coventry Building Society Arena': { name: 'Coventry Building Society Arena', capacity: 32609, seatedCapacity: 32609, corporateBoxes: 40, facilityRating: 4, pitchQuality: 4 },
  'Athletic Ground': { name: 'Athletic Ground', capacity: 5500, seatedCapacity: 3000, corporateBoxes: 4, facilityRating: 2, pitchQuality: 2 },
  'Butts Park Arena': { name: 'Butts Park Arena', capacity: 5500, seatedCapacity: 5000, corporateBoxes: 6, facilityRating: 2, pitchQuality: 3 },
  'Trailfinders Sports Ground': { name: 'Trailfinders Sports Ground', capacity: 5000, seatedCapacity: 3000, corporateBoxes: 4, facilityRating: 3, pitchQuality: 3 },
  // Top 14
  'Stade Ernest-Wallon': { name: 'Stade Ernest-Wallon', capacity: 19500, seatedCapacity: 19000, corporateBoxes: 24, facilityRating: 5, pitchQuality: 5 },
  'Stade Marcel-Deflandre': { name: 'Stade Marcel-Deflandre', capacity: 16000, seatedCapacity: 14000, corporateBoxes: 18, facilityRating: 4, pitchQuality: 5 },
  'Paris La Défense Arena': { name: 'Paris La Défense Arena', capacity: 40000, seatedCapacity: 40000, corporateBoxes: 80, facilityRating: 5, pitchQuality: 5 },
  'Stade Jean-Bouin': { name: 'Stade Jean-Bouin', capacity: 20000, seatedCapacity: 20000, corporateBoxes: 30, facilityRating: 4, pitchQuality: 4 },
  'Stade Mayol': { name: 'Stade Mayol', capacity: 15000, seatedCapacity: 13000, corporateBoxes: 16, facilityRating: 4, pitchQuality: 4 },
  'Stade Marcel-Michelin': { name: 'Stade Marcel-Michelin', capacity: 18000, seatedCapacity: 16000, corporateBoxes: 20, facilityRating: 4, pitchQuality: 4 },
  'GGL Stadium': { name: 'GGL Stadium', capacity: 15000, seatedCapacity: 14000, corporateBoxes: 16, facilityRating: 4, pitchQuality: 4 },
  'Matmut Stadium': { name: 'Matmut Stadium', capacity: 35000, seatedCapacity: 35000, corporateBoxes: 40, facilityRating: 5, pitchQuality: 5 },
  'Stade Pierre-Fabre': { name: 'Stade Pierre-Fabre', capacity: 12500, seatedCapacity: 10000, corporateBoxes: 12, facilityRating: 3, pitchQuality: 4 },
  'Stade Chaban-Delmas': { name: 'Stade Chaban-Delmas', capacity: 34462, seatedCapacity: 34462, corporateBoxes: 36, facilityRating: 4, pitchQuality: 4 },
  'Stade Marcellin-Champagnat': { name: 'Stade Marcellin-Champagnat', capacity: 8000, seatedCapacity: 6000, corporateBoxes: 6, facilityRating: 3, pitchQuality: 3 },
  'Stade du Hameau': { name: 'Stade du Hameau', capacity: 14500, seatedCapacity: 13000, corporateBoxes: 12, facilityRating: 3, pitchQuality: 3 },
  'Stade Aimé-Giral': { name: 'Stade Aimé-Giral', capacity: 15000, seatedCapacity: 12000, corporateBoxes: 12, facilityRating: 3, pitchQuality: 3 },
  'Stade Jean-Dauger': { name: 'Stade Jean-Dauger', capacity: 18000, seatedCapacity: 15000, corporateBoxes: 14, facilityRating: 3, pitchQuality: 3 },
  'Stade Amédée-Domenech': { name: 'Stade Amédée-Domenech', capacity: 15000, seatedCapacity: 12000, corporateBoxes: 10, facilityRating: 3, pitchQuality: 3 },
  'Stade Charles-Mathon': { name: 'Stade Charles-Mathon', capacity: 12000, seatedCapacity: 10000, corporateBoxes: 8, facilityRating: 2, pitchQuality: 3 },
  // Super Rugby
  'Orangetheory Stadium': { name: 'Orangetheory Stadium', capacity: 18400, seatedCapacity: 18400, corporateBoxes: 22, facilityRating: 4, pitchQuality: 5 },
  'Eden Park': { name: 'Eden Park', capacity: 50000, seatedCapacity: 50000, corporateBoxes: 60, facilityRating: 5, pitchQuality: 5 },
  'DHL Stadium': { name: 'DHL Stadium', capacity: 55000, seatedCapacity: 55000, corporateBoxes: 48, facilityRating: 5, pitchQuality: 5 },
  'Loftus Versfeld': { name: 'Loftus Versfeld', capacity: 51762, seatedCapacity: 51762, corporateBoxes: 44, facilityRating: 5, pitchQuality: 4 },
  'Suncorp Stadium': { name: 'Suncorp Stadium', capacity: 52500, seatedCapacity: 52500, corporateBoxes: 56, facilityRating: 5, pitchQuality: 5 },
  'Sydney Football Stadium': { name: 'Sydney Football Stadium', capacity: 45000, seatedCapacity: 45000, corporateBoxes: 50, facilityRating: 5, pitchQuality: 5 }
};

// Training facility ratings based on club reputation and resources
function generateTrainingFacilities(reputation: number): TeamFacilities['training'] {
  const baseRating = Math.min(5, Math.max(1, Math.round(reputation / 20))) as FacilityRating;
  const variation = () => Math.min(5, Math.max(1, baseRating + Math.floor(Math.random() * 2) - 1)) as FacilityRating;
  
  return {
    mainFacilityRating: baseRating,
    gymRating: variation(),
    recoveryRating: variation(),
    analysisRating: variation(),
    trainingPitches: Math.max(2, Math.round(reputation / 25)),
    indoorFacility: reputation >= 70
  };
}

// Youth academy ratings - Leinster is the gold standard
function generateYouthAcademy(reputation: number, teamName: string): TeamFacilities['academy'] {
  // Leinster has the best academy in the world
  if (teamName === 'Leinster Rugby') {
    return {
      overallRating: 5,
      scoutingNetwork: 5,
      coachingQuality: 5,
      youthFacilities: 5,
      pathwayToFirstTeam: 5,
      reputation: 98
    };
  }
  
  // Other strong academies
  const strongAcademies = ['Toulouse', 'Saracens', 'Leicester Tigers', 'Crusaders', 'Munster Rugby'];
  const isStrongAcademy = strongAcademies.includes(teamName);
  
  const baseRating = isStrongAcademy 
    ? Math.min(5, Math.round(reputation / 18)) as FacilityRating
    : Math.min(5, Math.max(1, Math.round(reputation / 22))) as FacilityRating;
  
  const variation = () => Math.min(5, Math.max(1, baseRating + Math.floor(Math.random() * 2) - 1)) as FacilityRating;
  
  return {
    overallRating: baseRating,
    scoutingNetwork: variation(),
    coachingQuality: variation(),
    youthFacilities: variation(),
    pathwayToFirstTeam: variation(),
    reputation: isStrongAcademy ? Math.min(95, reputation + 10) : Math.max(30, reputation - 10)
  };
}

function generateFacilities(homeGround: string, reputation: number, teamName: string): TeamFacilities {
  const stadiumData = STADIUM_DATA[homeGround] || {
    name: homeGround,
    capacity: 10000,
    seatedCapacity: 8000,
    corporateBoxes: 8,
    facilityRating: 3 as FacilityRating,
    pitchQuality: 3 as FacilityRating
  };
  
  return {
    stadium: stadiumData,
    training: generateTrainingFacilities(reputation),
    academy: generateYouthAcademy(reputation, teamName),
    upgradeRequests: []
  };
}

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
    reputation,
    facilities: generateFacilities(homeGround, reputation, name)
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
