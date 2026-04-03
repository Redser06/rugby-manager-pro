import { StaffMember, StaffRole, CoachingPhilosophy } from '@/types/staff';

const FIRST_NAMES: Record<string, string[]> = {
  Ireland: ['Seán', 'Padraig', 'Ciarán', 'Niall', 'Colm', 'Eoghan', 'Ronan', 'Declan', 'Fergus', 'Darragh'],
  Wales: ['Gareth', 'Rhys', 'Owain', 'Dylan', 'Iwan', 'Bryn', 'Gethin', 'Dafydd', 'Huw', 'Aled'],
  Scotland: ['Gregor', 'Callum', 'Hamish', 'Angus', 'Ewan', 'Rory', 'Finlay', 'Fraser', 'Lachlan', 'Blair'],
  Italy: ['Marco', 'Alessandro', 'Andrea', 'Luca', 'Matteo', 'Giovanni', 'Stefano', 'Roberto', 'Fabio', 'Carlo'],
  England: ['James', 'William', 'Richard', 'Edward', 'Simon', 'Andrew', 'Tom', 'Nick', 'Paul', 'Chris'],
  France: ['Jean', 'Pierre', 'Christophe', 'Philippe', 'Laurent', 'Thierry', 'Fabien', 'Yannick', 'Raphaël', 'Sébastien'],
  'New Zealand': ['Dan', 'Scott', 'Aaron', 'Richie', 'Sam', 'Beauden', 'Kieran', 'Brodie', 'TJ', 'Codie'],
  'South Africa': ['Johan', 'Pieter', 'Schalk', 'Handré', 'Duane', 'Eben', 'Frans', 'Damian', 'Faf', 'Cheslin'],
  Australia: ['Michael', 'David', 'Matt', 'Drew', 'Jake', 'Tate', 'Noah', 'Liam', 'Josh', 'Will'],
};

const LAST_NAMES: Record<string, string[]> = {
  Ireland: ["O'Brien", "Murphy", 'Kelly', 'Walsh', "O'Connell", 'Ryan', 'Doyle', 'Byrne', 'McCarthy', 'Hennessy'],
  Wales: ['Jones', 'Williams', 'Davies', 'Thomas', 'Evans', 'Roberts', 'Lewis', 'Morgan', 'Griffiths', 'Hughes'],
  Scotland: ['Campbell', 'Murray', 'Stewart', 'Robertson', 'Thomson', 'Anderson', 'MacDonald', 'Wilson', 'Russell', 'Watson'],
  Italy: ['Rossi', 'Bianchi', 'Colombo', 'Ferrari', 'Romano', 'Garbisi', 'Lamaro', 'Capuozzo', 'Menoncello', 'Brex'],
  England: ['Smith', 'Johnson', 'Brown', 'Taylor', 'Wilson', 'Wright', 'Harrison', 'Ford', 'Curry', 'Lawes'],
  France: ['Dupont', 'Ntamack', 'Penaud', 'Fickou', 'Marchand', 'Ramos', 'Mauvaka', 'Baille', 'Cros', 'Jelonch'],
  'New Zealand': ['Barrett', 'Smith', 'Savea', 'Retallick', 'Whitelock', 'Taylor', 'Cane', 'Perenara', 'Ioane', 'Bridge'],
  'South Africa': ['du Plessis', 'Vermeulen', 'de Klerk', 'Pollard', 'Steyn', 'Malherbe', 'van der Merwe', 'Kriel', 'Etzebeth', 'Kitshoff'],
  Australia: ['Hooper', 'Kerevi', 'Koroibete', 'Cooper', 'Slipper', 'Wright', 'Bell', 'Lolesio', 'Valetini', 'Swain'],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStaffMember(role: StaffRole, country: string, reputation: number): StaffMember {
  const names = FIRST_NAMES[country] || FIRST_NAMES['England'];
  const surnames = LAST_NAMES[country] || LAST_NAMES['England'];
  
  // Quality scales with team reputation but has variance
  const baseQuality = Math.floor(reputation * 0.7 + Math.random() * 30);
  const quality = Math.min(99, Math.max(20, baseQuality));
  const experience = Math.min(99, Math.max(10, quality + Math.floor(Math.random() * 20 - 10)));
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    firstName: pick(names),
    lastName: pick(surnames),
    role,
    nationality: country,
    age: 35 + Math.floor(Math.random() * 25),
    experience,
    quality,
    salary: Math.floor(quality * 1500 + Math.random() * 30000),
    contractYears: 1 + Math.floor(Math.random() * 3),
  };
}

const CORE_ROLES: StaffRole[] = [
  'head_coach', 'attack_coach', 'defence_coach', 'scrum_coach',
  'kicking_coach', 'strength_conditioning', 'head_physio',
];

const OPTIONAL_ROLES: StaffRole[] = [
  'lineout_coach', 'analyst', 'sports_psychologist', 'nutritionist',
];

export function generateStaffForTeam(country: string, reputation: number): StaffMember[] {
  const staff: StaffMember[] = [];
  
  // All teams get core roles
  for (const role of CORE_ROLES) {
    staff.push(generateStaffMember(role, country, reputation));
  }
  
  // Higher reputation teams get more optional staff
  const optionalCount = reputation >= 80 ? 4 : reputation >= 60 ? 3 : reputation >= 40 ? 2 : 1;
  const shuffled = [...OPTIONAL_ROLES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < optionalCount; i++) {
    staff.push(generateStaffMember(shuffled[i], country, reputation));
  }
  
  return staff;
}

export function getDefaultPhilosophy(reputation: number): CoachingPhilosophy {
  if (reputation >= 80) return Math.random() > 0.5 ? 'structured' : 'expansive';
  if (reputation >= 60) return Math.random() > 0.5 ? 'pragmatic' : 'structured';
  return 'development';
}

export function generateStaffCandidate(role: StaffRole, targetQuality: number): StaffMember {
  const countries = Object.keys(FIRST_NAMES);
  const country = pick(countries);
  const member = generateStaffMember(role, country, targetQuality);
  // Add some salary premium for hiring (market rate)
  member.salary = Math.floor(member.salary * 1.2);
  return member;
}
