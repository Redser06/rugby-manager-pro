// ========================
// ACADEMY PIPELINE & TALENT DISCOVERY
// ========================

import { Player, Position, PositionNumber, YouthAcademy } from '@/types/game';
import { PlayerExtended, generatePlayerExtended, assignArchetype } from '@/types/playerExtended';

// ========================
// FEEDER SYSTEM
// ========================

export interface FeederClub {
  id: string;
  name: string;
  type: 'school' | 'club' | 'university' | 'regional';
  region: string;
  quality: number; // 1-100
  relationship: number; // 1-100, how strong the pipeline is
  speciality?: Position; // Some feeders produce certain position types
  youthPopulation: number; // regional demographic factor
  recentGraduates: string[]; // names of players who came through
}

export interface AcademyProspect {
  id: string;
  firstName: string;
  lastName: string;
  age: number; // 16-20
  position: Position;
  positionNumber: PositionNumber;
  currentAbility: number; // 30-65 typically
  potentialCeiling: number; // hidden until scouted
  potentialRevealed: boolean;
  developmentRate: number;
  starRating: number; // 1-5 stars (visible), rough guide
  feederSource: string; // which club/school they came from
  yearsInAcademy: number;
  readyForFirstTeam: boolean;
  isGenerationalTalent: boolean; // rare, ~2% weighted by academy
  
  // Coach interaction tracking
  coachAttention: number; // 0-100 — how much time coaches spend with this player
  lastCoachSession?: string; // description
  mentorAssigned?: string; // first-team player mentor
  
  // Physical development
  physicalMaturity: number; // 0-100
  injuryHistory: string[];
  
  // Mental
  attitude: 'excellent' | 'good' | 'average' | 'poor';
  coachability: number; // 0-100
  resilience: number; // 0-100
}

// Regional demographics — more players in an area = more prospects
export interface RegionalDemographics {
  region: string;
  country: string;
  rugbyPopulation: number; // relative 1-100
  competitionLevel: number; // 1-100, higher = better quality prospects
  description: string;
}

export const REGIONAL_DEMOGRAPHICS: RegionalDemographics[] = [
  // Ireland
  { region: 'Leinster', country: 'Ireland', rugbyPopulation: 95, competitionLevel: 90, description: 'Strongest schools rugby system in the world. Huge player pool from South Dublin schools.' },
  { region: 'Munster', country: 'Ireland', rugbyPopulation: 75, competitionLevel: 80, description: 'Strong club and schools tradition. Limerick and Cork produce tough forwards.' },
  { region: 'Ulster', country: 'Ireland', rugbyPopulation: 60, competitionLevel: 65, description: 'Solid schools system. Belfast grammar schools produce steady talent.' },
  { region: 'Connacht', country: 'Ireland', rugbyPopulation: 35, competitionLevel: 45, description: 'Smaller player pool but passionate. Galway and Sligo clubs feed the system.' },
  // Wales
  { region: 'South Wales', country: 'Wales', rugbyPopulation: 85, competitionLevel: 75, description: 'Valleys produce physical forwards. Cardiff and Swansea have strong academies.' },
  { region: 'West Wales', country: 'Wales', rugbyPopulation: 60, competitionLevel: 60, description: 'Scarlets heartland. Carmarthen and Llanelli clubs produce skilful backs.' },
  { region: 'North Wales', country: 'Wales', rugbyPopulation: 25, competitionLevel: 30, description: 'Football country. Fewer players but occasional gems.' },
  // England
  { region: 'West Country', country: 'England', rugbyPopulation: 80, competitionLevel: 80, description: 'Bath, Bristol, Exeter heartland. Strong school and club pipeline.' },
  { region: 'East Midlands', country: 'England', rugbyPopulation: 75, competitionLevel: 85, description: 'Leicester and Northampton territory. Deep tradition.' },
  { region: 'London & SE', country: 'England', rugbyPopulation: 90, competitionLevel: 85, description: 'Huge population. Saracens, Harlequins, and strong schools.' },
  { region: 'North England', country: 'England', rugbyPopulation: 50, competitionLevel: 55, description: 'Newcastle and Sale territory. Competes with football for talent.' },
  // France
  { region: 'South West France', country: 'France', rugbyPopulation: 95, competitionLevel: 90, description: 'Toulouse, Pau, Bayonne. Rugby is king here. Enormous talent pool.' },
  { region: 'Paris & North', country: 'France', rugbyPopulation: 50, competitionLevel: 70, description: 'Racing and Stade Français. Money attracts talent but less grassroots.' },
  { region: 'Languedoc', country: 'France', rugbyPopulation: 70, competitionLevel: 75, description: 'Montpellier and Castres. Strong local competition.' },
  // New Zealand
  { region: 'Canterbury', country: 'New Zealand', rugbyPopulation: 90, competitionLevel: 95, description: 'Crusaders territory. Best development system in world rugby.' },
  { region: 'Auckland', country: 'New Zealand', rugbyPopulation: 85, competitionLevel: 90, description: 'Blues region. Huge Polynesian population with explosive athletes.' },
  { region: 'Wellington', country: 'New Zealand', rugbyPopulation: 65, competitionLevel: 75, description: 'Hurricanes region. Produces creative backs.' },
  // South Africa
  { region: 'Western Cape', country: 'South Africa', rugbyPopulation: 80, competitionLevel: 85, description: 'Stormers region. Strong school system. Pace and power.' },
  { region: 'Gauteng', country: 'South Africa', rugbyPopulation: 85, competitionLevel: 90, description: 'Bulls and Lions territory. Afrikaans schools produce massive forwards.' },
  // Australia
  { region: 'Queensland', country: 'Australia', rugbyPopulation: 55, competitionLevel: 65, description: 'Reds heartland. Competes with rugby league for athletes.' },
  { region: 'New South Wales', country: 'Australia', rugbyPopulation: 60, competitionLevel: 70, description: 'Waratahs and GPS schools. NRL is the main competition for talent.' },
  // Scotland & Italy
  { region: 'Central Scotland', country: 'Scotland', rugbyPopulation: 45, competitionLevel: 50, description: 'Edinburgh schools and Borders clubs. Small but passionate.' },
  { region: 'Veneto', country: 'Italy', rugbyPopulation: 40, competitionLevel: 40, description: 'Treviso heartland. Italian rugby is growing but slowly.' },
];

// ========================
// PROSPECT NAME GENERATION
// ========================

const PROSPECT_FIRST_NAMES: Record<string, string[]> = {
  Ireland: ['Cormac', 'Oisín', 'Fionn', 'Cathal', 'Eoin', 'Dara', 'Rían', 'Séamus', 'Lorcan', 'Darragh', 'Jack', 'Conor', 'Luke', 'Jamie', 'Harry'],
  Wales: ['Rhys', 'Morgan', 'Ellis', 'Tomos', 'Jac', 'Dewi', 'Gethin', 'Ioan', 'Taine', 'Cameron'],
  England: ['Oliver', 'Harry', 'George', 'Freddie', 'Archie', 'Alfie', 'Theo', 'Max', 'Oscar', 'Leo'],
  France: ['Léo', 'Antoine', 'Louis', 'Jules', 'Nolann', 'Mathis', 'Raphaël', 'Enzo', 'Théo', 'Lucas'],
  'New Zealand': ['Caleb', 'Ethan', 'Liam', 'Te Ariki', 'Manasa', 'Sione', 'Tana', 'Tupou', 'Malakai', 'Akira'],
  'South Africa': ['Jaden', 'Ruan', 'Cobus', 'Canan', 'Evan', 'Edwill', 'Sacha', 'Ethan', 'Jordan', 'Salmaan'],
  Australia: ['Noah', 'Lachlan', 'Riley', 'Mason', 'Flynn', 'Kai', 'Zac', 'Taj', 'Isaac', 'Oscar'],
  Scotland: ['Callum', 'Ross', 'Finlay', 'Rory', 'Jamie', 'Blair', 'Hamish', 'Murray', 'Ollie', 'Ben'],
  Italy: ['Tommaso', 'Lorenzo', 'Ange', 'Simone', 'Mattia', 'Leonardo', 'Alessandro', 'Filippo', 'Diego', 'Edoardo'],
};

const PROSPECT_LAST_NAMES: Record<string, string[]> = {
  Ireland: ["O'Sullivan", "Fitzgerald", "McCarthy", "Moloney", "Crowley", "Casey", "Coombes", "Hodnett", "Prendergast", "Flannery", "Frawley", "Nash"],
  Wales: ['Williams', 'Jones', 'Thomas', 'Lloyd', 'Rees-Zammit', 'Tompkins', 'Carre', 'Sheridan', 'Mayberry', 'Sheridan'],
  England: ['Freeman', 'Sheringham', 'Mitchell', 'Mills', 'Sheridan', 'Sheringham', 'Sheringham', 'Sheringham', 'Clarke', 'Hill'],
  France: ['Ramos', 'Moefana', 'Carbonel', 'Boudehent', 'Thibaud', 'Lebel', 'Bielle-Biarrey', 'Attissogbe', 'Depoortère', 'Gailleton'],
  'New Zealand': ['Fainga\'a', 'Christie', 'Bell', 'Stevenson', 'Love', 'Ratima', 'Tele\'a', 'Laulala', 'Papalii', 'Tuipulotu'],
  'South Africa': ['Fassi', 'Moodie', 'Nortje', 'Roos', 'Smith', 'Hendrikse', 'Mngomezulu', 'Arendse', 'van Staden', 'Willemse'],
  Australia: ['Gordon', 'Nawaqanitawase', 'Ikitau', 'Lynagh', 'Lonergan', 'Gleeson', 'Frost', 'Ah Sue', 'Sua', 'Bell'],
  Scotland: ['Darge', 'Tuipulotu', 'van der Merwe', 'Kinghorn', 'Haining', 'Graham', 'Campbell', 'Bayliss', 'Crosbie', 'Skinner'],
  Italy: ['Capuozzo', 'Menoncello', 'Ioane', 'Lamaro', 'Fusco', 'Allan', 'Cannone', 'Vintcent', 'Zuliani', 'Brex'],
};

const POSITIONS_BY_NUMBER: Record<PositionNumber, Position> = {
  1: 'Loosehead Prop', 2: 'Hooker', 3: 'Tighthead Prop',
  4: 'Lock', 5: 'Lock', 6: 'Blindside Flanker', 7: 'Openside Flanker', 8: 'Number 8',
  9: 'Scrum-half', 10: 'Fly-half', 11: 'Left Wing', 12: 'Inside Centre',
  13: 'Outside Centre', 14: 'Right Wing', 15: 'Fullback',
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ========================
// FEEDER GENERATION
// ========================

const SCHOOL_NAMES: Record<string, string[]> = {
  Ireland: ['Blackrock College', "St Michael's College", 'Clongowes Wood', 'Gonzaga College', 'Belvedere College', 'St Munchin\'s College', 'PBC Cork', 'Newbridge College', "St Andrew's College", 'CBC Monkstown', 'Campbell College', 'RBAI', 'Terenure College', 'Cistercian College'],
  Wales: ['Ysgol Gyfun Gŵyr', 'Coleg Sir Gâr', 'Llandovery College', 'Christ College Brecon', 'Cardiff Met'],
  England: ['Sedbergh School', 'Wellington College', 'Millfield School', 'Harrow School', 'Whitgift School', 'RGS High Wycombe', 'Hartpury College'],
  France: ['Centre de Formation Toulouse', 'Pôle Espoirs Marcoussis', 'Centre de Formation La Rochelle', 'Racing Academy'],
  'New Zealand': ['Christchurch BHS', 'Auckland Grammar', 'Hamilton BHS', 'Hastings BHS', 'Kelston BHS'],
  'South Africa': ['Grey College', 'Paarl Gimnasium', 'Paul Roos Gymnasium', 'Affies', 'Selborne College'],
  Australia: ['Nudgee College', 'St Joseph\'s Gregory Terrace', 'The King\'s School', 'Scots College'],
  Scotland: ['Stewart\'s Melville College', 'George Watson\'s College', 'Dollar Academy', 'Merchiston Castle'],
  Italy: ['Accademia FIR', 'Petrarca Padova Youth', 'Viadana Rugby Youth'],
};

export function generateFeedersForTeam(country: string, academyRep: number): FeederClub[] {
  const feeders: FeederClub[] = [];
  const schoolNames = SCHOOL_NAMES[country] || SCHOOL_NAMES['England'];
  const demographics = REGIONAL_DEMOGRAPHICS.filter(d => d.country === country);
  
  // Number of feeders based on academy reputation
  const count = Math.max(2, Math.min(8, Math.floor(academyRep / 15)));
  
  const usedNames = new Set<string>();
  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = pick(schoolNames);
    } while (usedNames.has(name) && usedNames.size < schoolNames.length);
    usedNames.add(name);
    
    const region = demographics.length > 0 ? pick(demographics) : { region: country, rugbyPopulation: 50 };
    const type: FeederClub['type'] = Math.random() > 0.6 ? 'school' : Math.random() > 0.5 ? 'club' : 'regional';
    
    feeders.push({
      id: Math.random().toString(36).substring(2, 7),
      name,
      type,
      region: region.region,
      quality: Math.max(20, Math.min(95, academyRep + Math.floor(Math.random() * 20 - 10))),
      relationship: 30 + Math.floor(Math.random() * 60),
      youthPopulation: region.rugbyPopulation,
      recentGraduates: [],
    });
  }
  
  return feeders;
}

// ========================
// PROSPECT GENERATION
// ========================

export function generateAcademyProspect(
  country: string,
  academyQuality: number,
  feeders: FeederClub[],
  isAnnualIntake: boolean = false,
): AcademyProspect {
  const firstNames = PROSPECT_FIRST_NAMES[country] || PROSPECT_FIRST_NAMES['England'];
  const lastNames = PROSPECT_LAST_NAMES[country] || PROSPECT_LAST_NAMES['England'];
  
  // Pick a feeder weighted by relationship quality
  const feeder = feeders.length > 0 
    ? feeders.reduce((best, f) => {
        const score = f.quality * 0.4 + f.relationship * 0.3 + f.youthPopulation * 0.3 + Math.random() * 20;
        const bestScore = best.quality * 0.4 + best.relationship * 0.3 + best.youthPopulation * 0.3;
        return score > bestScore ? f : best;
      })
    : null;
  
  const posNum = (Math.floor(Math.random() * 15) + 1) as PositionNumber;
  const position = POSITIONS_BY_NUMBER[posNum];
  
  // Base ability influenced by academy quality and feeder quality
  const feederBonus = feeder ? Math.floor(feeder.quality * 0.1) : 0;
  const baseAbility = 30 + Math.floor(Math.random() * 20) + Math.floor(academyQuality * 0.15) + feederBonus;
  const currentAbility = Math.min(65, Math.max(30, baseAbility));
  
  // Potential ceiling — key hidden stat
  // Generational talent: ~2% chance, boosted by academy investment
  const generationalRoll = Math.random();
  const generationalThreshold = 0.98 - (academyQuality * 0.001); // better academy = slightly higher chance
  const isGenerationalTalent = generationalRoll > generationalThreshold;
  
  let potentialCeiling: number;
  if (isGenerationalTalent) {
    potentialCeiling = 85 + Math.floor(Math.random() * 15); // 85-99
  } else {
    // Normal distribution centered around academy quality
    potentialCeiling = currentAbility + 5 + Math.floor(Math.random() * 25);
    // Better academies produce higher ceilings on average
    potentialCeiling += Math.floor(academyQuality * 0.1);
    potentialCeiling = Math.min(92, potentialCeiling);
  }
  
  // Star rating (visible rough guide, not exact)
  const starRating = potentialCeiling > 85 ? 5 : potentialCeiling > 75 ? 4 : potentialCeiling > 65 ? 3 : potentialCeiling > 55 ? 2 : 1;
  
  const age = 16 + Math.floor(Math.random() * 4); // 16-19
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    firstName: pick(firstNames),
    lastName: pick(lastNames),
    age,
    position,
    positionNumber: posNum,
    currentAbility,
    potentialCeiling,
    potentialRevealed: false,
    developmentRate: 0.8 + Math.random() * 1.2,
    starRating,
    feederSource: feeder?.name || 'Local club',
    yearsInAcademy: age - 16,
    readyForFirstTeam: currentAbility > 55 && age >= 18,
    isGenerationalTalent,
    coachAttention: 30 + Math.floor(Math.random() * 40),
    physicalMaturity: Math.min(100, (age - 16) * 25 + Math.floor(Math.random() * 20)),
    injuryHistory: [],
    attitude: (['excellent', 'good', 'good', 'average', 'poor'] as const)[Math.floor(Math.random() * 5)],
    coachability: 40 + Math.floor(Math.random() * 50),
    resilience: 30 + Math.floor(Math.random() * 60),
  };
}

// Generate annual academy intake
export function generateAnnualIntake(
  country: string,
  academy: YouthAcademy,
  feeders: FeederClub[],
): AcademyProspect[] {
  // Number of prospects based on academy size and scouting network
  const count = 3 + academy.scoutingNetwork + Math.floor(academy.overallRating * 0.5);
  const prospects: AcademyProspect[] = [];
  
  for (let i = 0; i < count; i++) {
    prospects.push(generateAcademyProspect(country, academy.reputation, feeders, true));
  }
  
  // Sort by star rating
  return prospects.sort((a, b) => b.starRating - a.starRating);
}

// ========================
// POTENTIAL REVEAL
// ========================

export function shouldRevealPotential(
  capsPlayed: number,
  hasScout: boolean,
  scoutQuality: number,
): boolean {
  // Reveal after 15+ caps
  if (capsPlayed >= 15) return true;
  
  // Scout can reveal earlier based on quality
  if (hasScout) {
    const capsThreshold = Math.max(5, 15 - Math.floor(scoutQuality / 10));
    if (capsPlayed >= capsThreshold) return true;
  }
  
  return false;
}

// Determine if a signing is a bargain or a bust
export function evaluateSigningOutcome(
  overallAtSigning: number,
  potential: number,
): 'star' | 'solid' | 'average' | 'bust' {
  const gap = potential - overallAtSigning;
  if (gap > 20) return 'star'; // bargain find
  if (gap > 10) return 'solid';
  if (gap > 0) return 'average';
  return 'bust'; // expensive recruit who plateaued
}

// ========================
// COACH INTERACTION WITH ACADEMY
// ========================

export function applyCoachSession(
  prospect: AcademyProspect,
  sessionType: 'skills' | 'mentoring' | 'physical' | 'tactical' | 'psychology',
  coachQuality: number,
): AcademyProspect {
  const updated = { ...prospect };
  const boost = Math.floor(coachQuality * 0.05) + 1;
  
  updated.coachAttention = Math.min(100, updated.coachAttention + 10);
  
  switch (sessionType) {
    case 'skills':
      updated.currentAbility = Math.min(updated.potentialCeiling, updated.currentAbility + boost);
      updated.lastCoachSession = 'Skills session — worked on core techniques';
      break;
    case 'mentoring':
      updated.attitude = updated.attitude === 'poor' ? 'average' : updated.attitude === 'average' ? 'good' : 'excellent';
      updated.coachability = Math.min(100, updated.coachability + boost * 2);
      updated.lastCoachSession = 'Mentoring session — building character and resilience';
      break;
    case 'physical':
      updated.physicalMaturity = Math.min(100, updated.physicalMaturity + boost + 3);
      updated.lastCoachSession = 'Physical development — S&C programme';
      break;
    case 'tactical':
      updated.currentAbility = Math.min(updated.potentialCeiling, updated.currentAbility + Math.ceil(boost * 0.5));
      updated.lastCoachSession = 'Tactical session — game understanding and positioning';
      break;
    case 'psychology':
      updated.resilience = Math.min(100, updated.resilience + boost * 2);
      updated.lastCoachSession = 'Psychology session — mental toughness and confidence';
      break;
  }
  
  // High coach attention + good coachability = faster development
  if (updated.coachAttention > 70 && updated.coachability > 60) {
    updated.developmentRate = Math.min(2.0, updated.developmentRate + 0.05);
  }
  
  return updated;
}

// Promote academy prospect to first team
export function promoteToFirstTeam(prospect: AcademyProspect, country: string): { player: Partial<Player>; extended: Partial<PlayerExtended> } {
  const player: Partial<Player> = {
    id: prospect.id,
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    age: prospect.age,
    nationality: country,
    position: prospect.position,
    positionNumber: prospect.positionNumber,
    overall: prospect.currentAbility,
    form: 6,
    fitness: 90,
    injured: false,
    injuryWeeks: 0,
  };
  
  const extended = generatePlayerExtended(prospect.age, prospect.currentAbility, country, prospect.position);
  extended.potential = prospect.potentialCeiling;
  extended.potentialRevealed = prospect.potentialRevealed;
  extended.developmentRate = prospect.developmentRate;
  extended.isNewSigning = false;
  extended.integrationWeeks = 4; // academy graduates still need some integration
  extended.culturalFit = 90; // home-grown = high cultural fit
  
  return { player, extended };
}
