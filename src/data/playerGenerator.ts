import { Player, Position, PositionNumber, PositionAttributes } from '@/types/game';

const FIRST_NAMES = [
  'James', 'Owen', 'Sean', 'Patrick', 'Conor', 'Finn', 'Tadhg', 'Cian', 'Ronan', 'Declan',
  'Maro', 'Kyle', 'Manu', 'Dan', 'George', 'Tom', 'Ben', 'Jamie', 'Stuart', 'Greig',
  'Antoine', 'Romain', 'Gregory', 'Thomas', 'Baptiste', 'Maxime', 'Louis', 'Charles', 'Virimi', 'Damian',
  'Beauden', 'Richie', 'Sam', 'Ardie', 'Brodie', 'Aaron', 'TJ', 'Jordie', 'Will', 'Sevu',
  'Siya', 'Eben', 'Pieter', 'Faf', 'Handre', 'Cheslin', 'Lukhanyo', 'Malcolm', 'Steven', 'Duane',
  'Michael', 'Quade', 'Israel', 'Kurtley', 'David', 'Taniela', 'Scott', 'Rob', 'Matt', 'Samu'
];

const LAST_NAMES = [
  'Ryan', 'Farrell', 'Sexton', 'Murray', 'Healy', 'Furlong', 'Henshaw', 'Ringrose', 'Lowe', 'Keenan',
  'Itoje', 'Sinckler', 'Curry', 'Watson', 'Ford', 'Youngs', 'May', 'Daly', 'Tuilagi', 'Slade',
  'Dupont', 'Ntamack', 'Fickou', 'Alldritt', 'Marchand', 'Baille', 'Ollivon', 'Vakatawa', 'Penaud', 'Thomas',
  'Barrett', 'McCaw', 'Whitelock', 'Savea', 'Retallick', 'Smith', 'Perenara', 'Clarke', 'Jordan', 'Reece',
  'Kolisi', 'Etzebeth', 'Du Toit', 'De Klerk', 'Pollard', 'Kolbe', 'Am', 'Marx', 'Kitshoff', 'Vermeulen',
  'Hooper', 'Cooper', 'Folau', 'Beale', 'Pocock', 'Tupou', 'Sio', 'Valetini', 'White', 'Kerevi'
];

const NATIONALITIES_BY_COUNTRY: Record<string, string[]> = {
  'Ireland': ['Irish'],
  'Wales': ['Welsh'],
  'Scotland': ['Scottish'],
  'Italy': ['Italian'],
  'England': ['English', 'Welsh', 'Scottish', 'Irish', 'Samoan', 'Fijian', 'South African'],
  'France': ['French', 'Fijian', 'Georgian', 'South African', 'Argentinian'],
  'New Zealand': ['New Zealander', 'Samoan', 'Tongan', 'Fijian'],
  'South Africa': ['South African'],
  'Australia': ['Australian', 'Fijian', 'Samoan', 'Tongan', 'New Zealander']
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAttributeValue(baseMin: number, baseMax: number, reputation: number): number {
  const repBonus = Math.floor((reputation - 50) / 10);
  const min = Math.max(1, Math.min(100, baseMin + repBonus));
  const max = Math.max(1, Math.min(100, baseMax + repBonus));
  return randomBetween(min, max);
}

function getPositionAttributes(positionNumber: PositionNumber, reputation: number): PositionAttributes {
  const gen = (min: number, max: number) => generateAttributeValue(min, max, reputation);

  switch (positionNumber) {
    case 1:
    case 3:
      return {
        scrummaging: gen(60, 95),
        strength: gen(65, 95),
        endurance: gen(55, 85),
        lineoutLifting: gen(50, 80),
        ballCarrying: gen(45, 75),
        tackling: gen(55, 85)
      };
    case 2:
      return {
        throwing: gen(60, 95),
        scrummaging: gen(55, 85),
        strength: gen(60, 90),
        workRate: gen(65, 95),
        tackling: gen(55, 85),
        ballCarrying: gen(50, 80)
      };
    case 4:
    case 5:
      return {
        lineout: gen(65, 95),
        strength: gen(60, 90),
        workRate: gen(60, 90),
        tackling: gen(55, 85),
        ballCarrying: gen(50, 80),
        aerialAbility: gen(65, 95)
      };
    case 6:
    case 7:
      return {
        tackling: gen(70, 98),
        workRate: gen(70, 98),
        ballCarrying: gen(55, 85),
        breakdown: gen(70, 98),
        speed: gen(55, 85),
        handling: gen(50, 80)
      };
    case 8:
      return {
        ballCarrying: gen(65, 95),
        strength: gen(65, 95),
        tackling: gen(60, 90),
        breakdown: gen(60, 90),
        handling: gen(55, 85),
        vision: gen(50, 80)
      };
    case 9:
      return {
        passing: gen(70, 98),
        kicking: gen(55, 85),
        speed: gen(60, 90),
        decisionMaking: gen(65, 95),
        boxKicking: gen(60, 90),
        sniping: gen(55, 85)
      };
    case 10:
      return {
        kicking: gen(70, 98),
        passing: gen(70, 98),
        decisionMaking: gen(70, 98),
        gameManagement: gen(65, 95),
        tackling: gen(45, 75),
        running: gen(50, 80)
      };
    case 12:
    case 13:
      return {
        speed: gen(60, 90),
        strength: gen(60, 90),
        tackling: gen(60, 90),
        passing: gen(55, 85),
        handling: gen(55, 85),
        defensiveReading: gen(60, 90)
      };
    case 11:
    case 14:
      return {
        speed: gen(75, 98),
        finishing: gen(65, 95),
        aerialAbility: gen(55, 85),
        stepping: gen(60, 90),
        tackling: gen(45, 75),
        workRate: gen(55, 85)
      };
    case 15:
      return {
        kicking: gen(60, 90),
        catching: gen(70, 98),
        speed: gen(65, 95),
        positioning: gen(65, 95),
        counterAttacking: gen(65, 95),
        tackling: gen(50, 80)
      };
  }
}

function calculateOverall(attributes: PositionAttributes): number {
  const values = Object.values(attributes);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.round(avg);
}

function getPositionFromNumber(num: PositionNumber): Position {
  const positions: Record<PositionNumber, Position> = {
    1: 'Loosehead Prop',
    2: 'Hooker',
    3: 'Tighthead Prop',
    4: 'Lock',
    5: 'Lock',
    6: 'Blindside Flanker',
    7: 'Openside Flanker',
    8: 'Number 8',
    9: 'Scrum-half',
    10: 'Fly-half',
    11: 'Left Wing',
    12: 'Inside Centre',
    13: 'Outside Centre',
    14: 'Right Wing',
    15: 'Fullback'
  };
  return positions[num];
}

export function generatePlayer(positionNumber: PositionNumber, country: string, reputation: number): Player {
  const nationalities = NATIONALITIES_BY_COUNTRY[country] || ['Unknown'];
  const nationality = nationalities[randomBetween(0, nationalities.length - 1)];
  const attributes = getPositionAttributes(positionNumber, reputation);
  
  return {
    id: generateId(),
    firstName: FIRST_NAMES[randomBetween(0, FIRST_NAMES.length - 1)],
    lastName: LAST_NAMES[randomBetween(0, LAST_NAMES.length - 1)],
    age: randomBetween(20, 34),
    nationality,
    position: getPositionFromNumber(positionNumber),
    positionNumber,
    attributes,
    overall: calculateOverall(attributes),
    form: randomBetween(5, 10),
    fitness: randomBetween(80, 100),
    injured: Math.random() < 0.05,
    injuryWeeks: 0
  };
}

export function generateSquad(country: string, reputation: number): Player[] {
  const squad: Player[] = [];
  
  // Generate 2-3 players per position for a full squad of ~30-35 players
  const positionCounts: Record<PositionNumber, number> = {
    1: 3, 2: 3, 3: 3, // Front row
    4: 2, 5: 2, // Locks
    6: 2, 7: 2, 8: 2, // Back row
    9: 2, 10: 2, // Half backs
    11: 2, 12: 2, 13: 2, 14: 2, 15: 2 // Backs
  };

  for (const [posNum, count] of Object.entries(positionCounts)) {
    for (let i = 0; i < count; i++) {
      squad.push(generatePlayer(parseInt(posNum) as PositionNumber, country, reputation));
    }
  }

  return squad;
}
