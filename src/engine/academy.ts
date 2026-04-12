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

// Team-specific feeder schools/clubs aligned to provinces/regions
// Each team gets a realistic mix of schools and clubs from their catchment area
const TEAM_FEEDERS: Record<string, { name: string; type: 'school' | 'club' | 'regional' | 'university' }[]> = {
  // === IRELAND — Schools system is strongest in Leinster ===
  'Leinster Rugby': [
    { name: 'Blackrock College', type: 'school' },
    { name: "St Michael's College", type: 'school' },
    { name: "St Mary's College", type: 'school' },
    { name: 'Clongowes Wood College', type: 'school' },
    { name: 'Belvedere College', type: 'school' },
    { name: 'Terenure College', type: 'school' },
    { name: 'Gonzaga College', type: 'school' },
    { name: "St Andrew's College", type: 'school' },
    { name: 'Newbridge College', type: 'school' },
    { name: 'CBC Monkstown', type: 'school' },
    { name: 'Cistercian College Roscrea', type: 'school' },
    { name: 'King\'s Hospital', type: 'school' },
    { name: 'Lansdowne FC', type: 'club' },
    { name: 'Old Wesley', type: 'club' },
    { name: 'UCD RFC', type: 'university' },
    { name: 'Trinity College RFC', type: 'university' },
    { name: 'Naas RFC', type: 'club' },
    { name: 'Skerries RFC', type: 'club' },
  ],
  'Munster Rugby': [
    { name: "St Munchin's College", type: 'school' },
    { name: 'PBC Cork', type: 'school' },
    { name: 'CBC Cork', type: 'school' },
    { name: 'Crescent College', type: 'school' },
    { name: 'Rockwell College', type: 'school' },
    { name: 'Glenstal Abbey', type: 'school' },
    { name: 'Ardscoil Rís', type: 'school' },
    { name: 'Young Munster RFC', type: 'club' },
    { name: 'Shannon RFC', type: 'club' },
    { name: 'Garryowen FC', type: 'club' },
    { name: 'Cork Constitution', type: 'club' },
    { name: 'UL Bohemian RFC', type: 'club' },
    { name: 'UCC RFC', type: 'university' },
    { name: 'Cashel RFC', type: 'club' },
    { name: 'Bruff RFC', type: 'club' },
  ],
  'Ulster Rugby': [
    { name: 'Campbell College', type: 'school' },
    { name: 'RBAI', type: 'school' },
    { name: 'Methodist College', type: 'school' },
    { name: 'Royal School Armagh', type: 'school' },
    { name: 'Royal School Dungannon', type: 'school' },
    { name: 'Sullivan Upper', type: 'school' },
    { name: 'Wallace High School', type: 'school' },
    { name: 'Ballymena RFC', type: 'club' },
    { name: 'Ballynahinch RFC', type: 'club' },
    { name: 'Banbridge RFC', type: 'club' },
    { name: 'Malone RFC', type: 'club' },
    { name: 'Queen\'s University RFC', type: 'university' },
    { name: 'Dungannon RFC', type: 'club' },
    { name: 'City of Armagh RFC', type: 'club' },
  ],
  'Connacht Rugby': [
    { name: 'Garbally College', type: 'school' },
    { name: 'Coláiste Iognáid', type: 'school' },
    { name: 'Sligo Grammar', type: 'school' },
    { name: 'Galwegians RFC', type: 'club' },
    { name: 'Corinthians RFC', type: 'club' },
    { name: 'Buccaneers RFC', type: 'club' },
    { name: 'Ballina RFC', type: 'club' },
    { name: 'Westport RFC', type: 'club' },
    { name: 'NUI Galway RFC', type: 'university' },
    { name: 'Sligo RFC', type: 'club' },
    { name: 'Creggs RFC', type: 'club' },
  ],

  // === WALES — Mix of schools and clubs, less schools-dominated than Leinster ===
  'Scarlets': [
    { name: 'Coleg Sir Gâr', type: 'school' },
    { name: 'Ysgol Gyfun Gŵyr', type: 'school' },
    { name: 'Llandovery College', type: 'school' },
    { name: 'Llanelli RFC', type: 'club' },
    { name: 'Carmarthen Quins', type: 'club' },
    { name: 'Llandovery RFC', type: 'club' },
    { name: 'Amman United', type: 'club' },
    { name: 'Tumble RFC', type: 'club' },
  ],
  'Ospreys': [
    { name: 'Ysgol Gyfun Ystalyfera', type: 'school' },
    { name: 'Bishopston Comprehensive', type: 'school' },
    { name: 'Neath RFC', type: 'club' },
    { name: 'Swansea RFC', type: 'club' },
    { name: 'Aberavon RFC', type: 'club' },
    { name: 'Bridgend Ravens', type: 'club' },
    { name: 'Tonmawr RFC', type: 'club' },
    { name: 'Swansea University RFC', type: 'university' },
  ],
  'Cardiff Rugby': [
    { name: 'Cardiff High School', type: 'school' },
    { name: 'Whitchurch High School', type: 'school' },
    { name: 'Cardiff Met RFC', type: 'university' },
    { name: 'Pontypridd RFC', type: 'club' },
    { name: 'Cardiff RFC', type: 'club' },
    { name: 'Glamorgan Wanderers', type: 'club' },
    { name: 'Rumney RFC', type: 'club' },
    { name: 'Llandaff RFC', type: 'club' },
  ],
  'Dragons RFC': [
    { name: 'West Monmouth School', type: 'school' },
    { name: 'Rougemont School', type: 'school' },
    { name: 'Newport RFC', type: 'club' },
    { name: 'Cross Keys RFC', type: 'club' },
    { name: 'Ebbw Vale RFC', type: 'club' },
    { name: 'Pontypool RFC', type: 'club' },
    { name: 'Newbridge RFC', type: 'club' },
    { name: 'Bedwas RFC', type: 'club' },
  ],

  // === SCOTLAND — Mix of private schools and clubs ===
  'Edinburgh Rugby': [
    { name: "Stewart's Melville College", type: 'school' },
    { name: "George Watson's College", type: 'school' },
    { name: 'Merchiston Castle School', type: 'school' },
    { name: 'Edinburgh Academicals', type: 'club' },
    { name: 'Heriot\'s RFC', type: 'club' },
    { name: 'Boroughmuir Bears', type: 'club' },
    { name: 'Watsonians RFC', type: 'club' },
    { name: 'Currie RFC', type: 'club' },
    { name: 'Edinburgh University RFC', type: 'university' },
  ],
  'Glasgow Warriors': [
    { name: 'Glasgow Academy', type: 'school' },
    { name: 'Hutchesons\' Grammar', type: 'school' },
    { name: 'Glasgow Hawks', type: 'club' },
    { name: 'Ayr RFC', type: 'club' },
    { name: 'GHK RFC', type: 'club' },
    { name: 'Stirling County', type: 'club' },
    { name: 'West of Scotland FC', type: 'club' },
    { name: 'Strathclyde University RFC', type: 'university' },
  ],
  'Caledonia Reds': [
    { name: 'Robert Gordon\'s College', type: 'school' },
    { name: 'Dollar Academy', type: 'school' },
    { name: 'Aberdeen Grammar RFC', type: 'club' },
    { name: 'Dundee HSFP', type: 'club' },
    { name: 'Highland RFC', type: 'club' },
    { name: 'Gordonians RFC', type: 'club' },
  ],
  'Border Reivers': [
    { name: 'Hawick High School', type: 'school' },
    { name: 'Hawick RFC', type: 'club' },
    { name: 'Melrose RFC', type: 'club' },
    { name: 'Gala RFC', type: 'club' },
    { name: 'Kelso RFC', type: 'club' },
    { name: 'Jed-Forest RFC', type: 'club' },
    { name: 'Selkirk RFC', type: 'club' },
  ],

  // === ITALY — Club-based system ===
  'Benetton Rugby': [
    { name: 'Petrarca Padova Youth', type: 'club' },
    { name: 'Rugby Paese', type: 'club' },
    { name: 'Mogliano Rugby', type: 'club' },
    { name: 'Valsugana Rugby', type: 'club' },
    { name: 'Accademia FIR Treviso', type: 'regional' },
    { name: 'Rugby Villorba', type: 'club' },
  ],
  'Zebre Parma': [
    { name: 'Rugby Reggio', type: 'club' },
    { name: 'Modena Rugby', type: 'club' },
    { name: 'Noceto Rugby', type: 'club' },
    { name: 'Colorno Rugby', type: 'club' },
    { name: 'Accademia FIR Parma', type: 'regional' },
  ],
  'Roma Leoni': [
    { name: 'Rugby Roma Olimpic', type: 'club' },
    { name: 'Lazio Rugby', type: 'club' },
    { name: 'Unione Rugby Capitolina', type: 'club' },
    { name: 'Fiamme Oro Rugby', type: 'club' },
    { name: 'Accademia FIR Roma', type: 'regional' },
  ],
  'Milano Rugby': [
    { name: 'Rugby Milano', type: 'club' },
    { name: 'ASR Milano', type: 'club' },
    { name: 'Amatori & Union Milano', type: 'club' },
    { name: 'CUS Milano', type: 'university' },
    { name: 'Accademia FIR Nord', type: 'regional' },
  ],

  // === ENGLAND — Strong school and club system ===
  'Saracens': [
    { name: 'Harrow School', type: 'school' },
    { name: 'Mill Hill School', type: 'school' },
    { name: 'Haileybury College', type: 'school' },
    { name: 'Saracens Amateurs', type: 'club' },
    { name: 'Hertford RFC', type: 'club' },
    { name: 'Old Albanians', type: 'club' },
    { name: 'Bishop\'s Stortford RFC', type: 'club' },
  ],
  'Leicester Tigers': [
    { name: 'Oakham School', type: 'school' },
    { name: 'Uppingham School', type: 'school' },
    { name: 'Loughborough Grammar', type: 'school' },
    { name: 'Hinckley RFC', type: 'club' },
    { name: 'Loughborough University RFC', type: 'university' },
    { name: 'Syston RFC', type: 'club' },
    { name: 'Market Harborough RFC', type: 'club' },
  ],
  'Sale Sharks': [
    { name: 'Stockport Grammar', type: 'school' },
    { name: 'Wilmslow RFC', type: 'club' },
    { name: 'Sale FC', type: 'club' },
    { name: 'Sedgley Park RFC', type: 'club' },
    { name: 'Manchester RFC', type: 'club' },
    { name: 'Macclesfield RFC', type: 'club' },
  ],
  'Northampton Saints': [
    { name: 'Stowe School', type: 'school' },
    { name: 'RGS High Wycombe', type: 'school' },
    { name: 'Northampton Old Scouts', type: 'club' },
    { name: 'Towcestrians RFC', type: 'club' },
    { name: 'Bedford Blues', type: 'club' },
    { name: 'Buckingham RFC', type: 'club' },
  ],
  'Bath Rugby': [
    { name: 'Millfield School', type: 'school' },
    { name: 'King Edward\'s Bath', type: 'school' },
    { name: 'Beechen Cliff School', type: 'school' },
    { name: 'Bath University RFC', type: 'university' },
    { name: 'Walcot RFC', type: 'club' },
    { name: 'Trowbridge RFC', type: 'club' },
  ],
  'Harlequins': [
    { name: 'Whitgift School', type: 'school' },
    { name: 'Trinity School Croydon', type: 'school' },
    { name: 'John Fisher School', type: 'school' },
    { name: 'Esher RFC', type: 'club' },
    { name: 'Twickenham RFC', type: 'club' },
    { name: 'Richmond FC', type: 'club' },
    { name: 'Brunel University RFC', type: 'university' },
  ],
  'Bristol Bears': [
    { name: 'Clifton College', type: 'school' },
    { name: 'QEH Bristol', type: 'school' },
    { name: 'Filton College', type: 'school' },
    { name: 'Clifton RFC', type: 'club' },
    { name: 'Dings Crusaders', type: 'club' },
    { name: 'Old Bristolians', type: 'club' },
    { name: 'UWE RFC', type: 'university' },
  ],
  'Exeter Chiefs': [
    { name: 'Blundell\'s School', type: 'school' },
    { name: 'Exeter School', type: 'school' },
    { name: 'Ivybridge Community College', type: 'school' },
    { name: 'Exeter University RFC', type: 'university' },
    { name: 'Tiverton RFC', type: 'club' },
    { name: 'Crediton RFC', type: 'club' },
    { name: 'Barnstaple RFC', type: 'club' },
  ],
  'Gloucester Rugby': [
    { name: 'Hartpury College', type: 'school' },
    { name: 'Dean Close School', type: 'school' },
    { name: 'Cheltenham College', type: 'school' },
    { name: 'Cinderford RFC', type: 'club' },
    { name: 'Lydney RFC', type: 'club' },
    { name: 'Cheltenham RFC', type: 'club' },
  ],
  'London Irish': [
    { name: 'Wellington College', type: 'school' },
    { name: 'Reading Blue Coat', type: 'school' },
    { name: 'Henley Hawks', type: 'club' },
    { name: 'Reading RFC', type: 'club' },
    { name: 'Bracknell RFC', type: 'club' },
    { name: 'Maidenhead RFC', type: 'club' },
  ],
  'Newcastle Falcons': [
    { name: 'RGS Newcastle', type: 'school' },
    { name: 'Sedbergh School', type: 'school' },
    { name: 'Gosforth RFC', type: 'club' },
    { name: 'Northern FC', type: 'club' },
    { name: 'Percy Park RFC', type: 'club' },
    { name: 'Durham University RFC', type: 'university' },
  ],
  'Worcester Warriors': [
    { name: 'RGS Worcester', type: 'school' },
    { name: 'Bromsgrove School', type: 'school' },
    { name: 'Malvern College', type: 'school' },
    { name: 'Worcester RFC', type: 'club' },
    { name: 'Bromsgrove RFC', type: 'club' },
    { name: 'Droitwich RFC', type: 'club' },
  ],
  'Wasps': [
    { name: 'Warwick School', type: 'school' },
    { name: 'Rugby School', type: 'school' },
    { name: 'Kenilworth RFC', type: 'club' },
    { name: 'Leamington RFC', type: 'club' },
    { name: 'Old Leamingtonians', type: 'club' },
    { name: 'Warwick University RFC', type: 'university' },
  ],
  'Richmond FC': [
    { name: 'Hampton School', type: 'school' },
    { name: 'Kingston Grammar', type: 'school' },
    { name: 'Rosslyn Park FC', type: 'club' },
    { name: 'Old Deer Park', type: 'club' },
    { name: 'Teddington RFC', type: 'club' },
  ],
  'Coventry Rugby': [
    { name: 'Bablake School', type: 'school' },
    { name: 'King Henry VIII School', type: 'school' },
    { name: 'Barkers Butts RFC', type: 'club' },
    { name: 'Nuneaton RFC', type: 'club' },
    { name: 'Broadstreet RFC', type: 'club' },
  ],
  'Ealing Trailfinders': [
    { name: 'St Benedict\'s School', type: 'school' },
    { name: 'Latymer Upper School', type: 'school' },
    { name: 'Ealing RFC', type: 'club' },
    { name: 'Acton RFC', type: 'club' },
    { name: 'West London RFC', type: 'club' },
  ],

  // === FRANCE — Espoirs/Centre de Formation system, NOT schools ===
  'Toulouse': [
    { name: 'Centre de Formation Toulouse', type: 'club' },
    { name: 'Espoirs Stade Toulousain', type: 'club' },
    { name: 'Colomiers Rugby', type: 'club' },
    { name: 'US Montauban', type: 'club' },
    { name: 'Blagnac SCR', type: 'club' },
    { name: 'Albi RL', type: 'club' },
  ],
  'La Rochelle': [
    { name: 'Centre de Formation La Rochelle', type: 'club' },
    { name: 'Espoirs Stade Rochelais', type: 'club' },
    { name: 'Rochefort RFC', type: 'club' },
    { name: 'Niort RC', type: 'club' },
    { name: 'Saintes RC', type: 'club' },
  ],
  'Racing 92': [
    { name: 'Racing Academy', type: 'club' },
    { name: 'Espoirs Racing 92', type: 'club' },
    { name: 'PUC Paris', type: 'university' },
    { name: 'Massy RC', type: 'club' },
    { name: 'Suresnes RC', type: 'club' },
  ],
  'Stade Français Paris': [
    { name: 'Centre de Formation Stade Français', type: 'club' },
    { name: 'Espoirs Stade Français', type: 'club' },
    { name: 'SCUF Paris', type: 'club' },
    { name: 'Bobigny AC', type: 'club' },
  ],
  'RC Toulon': [
    { name: 'Centre de Formation Toulon', type: 'club' },
    { name: 'Espoirs RC Toulon', type: 'club' },
    { name: 'US Seynoise', type: 'club' },
    { name: 'Hyères RC', type: 'club' },
  ],
  'ASM Clermont': [
    { name: 'Centre de Formation Clermont', type: 'club' },
    { name: 'Espoirs ASM', type: 'club' },
    { name: 'Issoire RC', type: 'club' },
    { name: 'Riom RC', type: 'club' },
    { name: 'Aurillac RC', type: 'club' },
  ],
  'Montpellier': [
    { name: 'Centre de Formation Montpellier', type: 'club' },
    { name: 'Espoirs MHR', type: 'club' },
    { name: 'RC Narbonne', type: 'club' },
    { name: 'Béziers ASBH', type: 'club' },
  ],
  'Lyon OU': [
    { name: 'Centre de Formation Lyon', type: 'club' },
    { name: 'Espoirs LOU', type: 'club' },
    { name: 'CS Vienne', type: 'club' },
    { name: 'FC Grenoble', type: 'club' },
  ],
  'Castres Olympique': [
    { name: 'Centre de Formation Castres', type: 'club' },
    { name: 'Espoirs CO', type: 'club' },
    { name: 'Mazamet RC', type: 'club' },
    { name: 'Graulhet RC', type: 'club' },
  ],
  'Bordeaux-Bègles': [
    { name: 'Centre de Formation UBB', type: 'club' },
    { name: 'Espoirs UBB', type: 'club' },
    { name: 'Libourne RC', type: 'club' },
    { name: 'Mérignac RC', type: 'club' },
  ],
  'Stade Rochelais': [
    { name: 'Centre de Formation Stade Rochelais', type: 'club' },
    { name: 'Angoulême RC', type: 'club' },
    { name: 'Cognac RC', type: 'club' },
  ],
  'Section Paloise': [
    { name: 'Centre de Formation Pau', type: 'club' },
    { name: 'Espoirs Section Paloise', type: 'club' },
    { name: 'Oloron RC', type: 'club' },
    { name: 'Tarbes PRC', type: 'club' },
  ],
  'USA Perpignan': [
    { name: 'Centre de Formation Perpignan', type: 'club' },
    { name: 'Espoirs USAP', type: 'club' },
    { name: 'Narbonne RC', type: 'club' },
    { name: 'Thuir RC', type: 'club' },
  ],
  'Aviron Bayonnais': [
    { name: 'Centre de Formation Bayonne', type: 'club' },
    { name: 'Espoirs Aviron', type: 'club' },
    { name: 'Biarritz Olympique', type: 'club' },
    { name: 'Saint-Jean-de-Luz RC', type: 'club' },
  ],
  'Brive': [
    { name: 'Centre de Formation Brive', type: 'club' },
    { name: 'Espoirs Brive', type: 'club' },
    { name: 'Tulle RC', type: 'club' },
    { name: 'Objat RC', type: 'club' },
  ],
  'Oyonnax Rugby': [
    { name: 'Centre de Formation Oyonnax', type: 'club' },
    { name: 'Espoirs Oyonnax', type: 'club' },
    { name: 'Bourg-en-Bresse RC', type: 'club' },
    { name: 'Ambérieu RC', type: 'club' },
  ],

  // === NEW ZEALAND — School system ===
  'Crusaders': [
    { name: 'Christchurch BHS', type: 'school' },
    { name: 'Nelson College', type: 'school' },
    { name: 'Timaru BHS', type: 'school' },
    { name: 'St Bede\'s College', type: 'school' },
    { name: 'Lincoln University RFC', type: 'university' },
    { name: 'Canterbury University RFC', type: 'university' },
    { name: 'Burnside RFC', type: 'club' },
    { name: 'Christchurch FC', type: 'club' },
  ],
  'Blues': [
    { name: 'Auckland Grammar', type: 'school' },
    { name: 'Kelston BHS', type: 'school' },
    { name: 'De La Salle College', type: 'school' },
    { name: 'Sacred Heart College', type: 'school' },
    { name: 'Mt Albert Grammar', type: 'school' },
    { name: 'Ponsonby RFC', type: 'club' },
    { name: 'Grammar TEC', type: 'club' },
    { name: 'Marist RFC', type: 'club' },
  ],

  // === SOUTH AFRICA — School system is massive ===
  'Stormers': [
    { name: 'Paarl Gimnasium', type: 'school' },
    { name: 'Paul Roos Gymnasium', type: 'school' },
    { name: 'Bishops', type: 'school' },
    { name: 'Rondebosch BHS', type: 'school' },
    { name: 'SACS', type: 'school' },
    { name: 'Stellenbosch University RFC', type: 'university' },
    { name: 'UCT RFC', type: 'university' },
    { name: 'False Bay RFC', type: 'club' },
  ],
  'Bulls': [
    { name: 'Affies', type: 'school' },
    { name: 'Grey College', type: 'school' },
    { name: 'Waterkloof HS', type: 'school' },
    { name: 'Garsfontein HS', type: 'school' },
    { name: 'Menlo Park HS', type: 'school' },
    { name: 'UP Tuks RFC', type: 'university' },
    { name: 'Blue Bulls U21', type: 'regional' },
    { name: 'Centurion RFC', type: 'club' },
  ],

  // === AUSTRALIA — GPS school system + clubs ===
  'Queensland Reds': [
    { name: 'Nudgee College', type: 'school' },
    { name: "St Joseph's Gregory Terrace", type: 'school' },
    { name: 'Brisbane Grammar', type: 'school' },
    { name: 'Brisbane Boys College', type: 'school' },
    { name: 'GPS RFC', type: 'club' },
    { name: 'University of Queensland RFC', type: 'university' },
    { name: 'Brothers Old Boys', type: 'club' },
    { name: 'Souths RFC Brisbane', type: 'club' },
  ],
  'NSW Waratahs': [
    { name: "The King's School", type: 'school' },
    { name: 'Scots College', type: 'school' },
    { name: 'Newington College', type: 'school' },
    { name: 'Shore School', type: 'school' },
    { name: 'Sydney University RFC', type: 'university' },
    { name: 'Eastwood RFC', type: 'club' },
    { name: 'Randwick RFC', type: 'club' },
    { name: 'Manly RFC', type: 'club' },
  ],
};

// Country-level fallback feeders for teams not explicitly mapped
const COUNTRY_FALLBACK_FEEDERS: Record<string, { name: string; type: 'school' | 'club' | 'regional' | 'university' }[]> = {
  Ireland: [
    { name: 'Local GAA/Rugby Club', type: 'club' },
    { name: 'Community Rugby Programme', type: 'regional' },
    { name: 'Provincial Development Squad', type: 'regional' },
  ],
  Wales: [
    { name: 'Local RFC', type: 'club' },
    { name: 'Regional Development', type: 'regional' },
  ],
  England: [
    { name: 'Local Grammar School', type: 'school' },
    { name: 'County RFC', type: 'club' },
    { name: 'RFU Academy', type: 'regional' },
  ],
  France: [
    { name: 'Centre de Formation Local', type: 'club' },
    { name: 'Espoirs Régional', type: 'club' },
    { name: 'Club Local', type: 'club' },
  ],
  'New Zealand': [
    { name: 'Local BHS', type: 'school' },
    { name: 'Provincial Union', type: 'regional' },
    { name: 'Club RFC', type: 'club' },
  ],
  'South Africa': [
    { name: 'Local Hoërskool', type: 'school' },
    { name: 'Provincial Academy', type: 'regional' },
    { name: 'Club RFC', type: 'club' },
  ],
  Australia: [
    { name: 'GPS School', type: 'school' },
    { name: 'Local Club RFC', type: 'club' },
    { name: 'State Academy', type: 'regional' },
  ],
  Scotland: [
    { name: 'Local Academy', type: 'school' },
    { name: 'District RFC', type: 'club' },
  ],
  Italy: [
    { name: 'Club Giovanile', type: 'club' },
    { name: 'Accademia FIR', type: 'regional' },
  ],
};

export function generateFeedersForTeam(country: string, academyRep: number, teamName?: string): FeederClub[] {
  const feeders: FeederClub[] = [];
  const demographics = REGIONAL_DEMOGRAPHICS.filter(d => d.country === country);
  
  // Get team-specific feeders, or fall back to country defaults
  const teamSpecificFeeders = teamName ? TEAM_FEEDERS[teamName] : null;
  const fallbackFeeders = COUNTRY_FALLBACK_FEEDERS[country] || COUNTRY_FALLBACK_FEEDERS['England'];
  const availableFeeders = teamSpecificFeeders || fallbackFeeders;
  
  // Number of feeders based on academy reputation
  const count = Math.max(3, Math.min(availableFeeders.length, Math.floor(academyRep / 12)));
  
  // Shuffle to avoid always picking the same ones
  const shuffled = [...availableFeeders].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  
  for (const feederData of selected) {
    const region = demographics.length > 0 ? pick(demographics) : { region: country, rugbyPopulation: 50 };
    
    feeders.push({
      id: Math.random().toString(36).substring(2, 7),
      name: feederData.name,
      type: feederData.type,
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
