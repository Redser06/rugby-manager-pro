import { AICoach, CoachRole, ExperienceLevel, Specialization } from '@/types/coach';

const FIRST_NAMES_BY_NATIONALITY: Record<string, string[]> = {
  'Ireland': ['Sean', 'Padraig', 'Conor', 'Cian', 'Ronan', 'Declan', 'Eoin', 'Niall', 'Brendan', 'Colm'],
  'Wales': ['Gareth', 'Rhys', 'Dylan', 'Ieuan', 'Geraint', 'Gethin', 'Dafydd', 'Huw', 'Bryn', 'Idris'],
  'Scotland': ['Alistair', 'Hamish', 'Angus', 'Fraser', 'Gregor', 'Finlay', 'Ross', 'Duncan', 'Callum', 'Lachlan'],
  'Italy': ['Marco', 'Alessandro', 'Sergio', 'Matteo', 'Luca', 'Giovanni', 'Andrea', 'Roberto', 'Federico', 'Davide'],
  'England': ['James', 'Richard', 'Stuart', 'Eddie', 'Graham', 'Martin', 'Neil', 'Steve', 'Andy', 'Phil'],
  'France': ['Fabien', 'Thierry', 'Philippe', 'Laurent', 'Christophe', 'Yannick', 'Julien', 'Sébastien', 'Pascal', 'Pierre'],
  'New Zealand': ['Steve', 'Ian', 'Graham', 'Wayne', 'Scott', 'Joe', 'Jamie', 'Aaron', 'Dave', 'Craig'],
  'South Africa': ['Jake', 'Rassie', 'Johan', 'Pieter', 'Deon', 'Victor', 'Frans', 'Schalk', 'Jaco', 'Morne'],
  'Australia': ['Michael', 'Dave', 'Rod', 'Eddie', 'Tim', 'Nathan', 'Scott', 'Matt', 'Greg', 'Brad']
};

const LAST_NAMES_BY_NATIONALITY: Record<string, string[]> = {
  'Ireland': ["O'Brien", "Murphy", "Sullivan", "Ryan", "Kelly", "Walsh", "Fitzgerald", 'Kennedy', "O'Connor", 'Brennan'],
  'Wales': ['Jones', 'Williams', 'Davies', 'Thomas', 'Evans', 'Jenkins', 'Hughes', 'Lewis', 'Morgan', 'Griffiths'],
  'Scotland': ['MacLeod', 'Campbell', 'Stewart', 'MacDonald', 'Robertson', 'Anderson', 'Thomson', 'Murray', 'Reid', 'Scott'],
  'Italy': ['Rossi', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Galli', 'Conti'],
  'England': ['Smith', 'Johnson', 'Brown', 'Wilson', 'Taylor', 'Robinson', 'Lancaster', 'Ashton', 'Ford', 'Watson'],
  'France': ['Dupont', 'Laporte', 'Galthié', 'Brunel', 'Novès', 'Saint-André', 'Lièvremont', 'Skrela', 'Villeneuve', 'Bernard'],
  'New Zealand': ['Hansen', 'Henry', 'Foster', 'Robertson', 'Schmidt', 'Gatland', 'Mauger', 'Plumtree', 'Crockett', 'Mains'],
  'South Africa': ['Erasmus', 'White', 'Nienaber', 'Meyer', 'de Villiers', 'Mallett', 'Coetzee', 'van Graan', 'Fleck', 'du Plessis'],
  'Australia': ['Cheika', 'Rennie', 'McKenzie', 'Connolly', 'Deans', 'Jones', 'Macqueen', 'Williams', 'Smith', 'Ella']
};

const NATIONALITIES = Object.keys(FIRST_NAMES_BY_NATIONALITY);

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCoachName(nationality: string): { firstName: string; lastName: string } {
  const firstNames = FIRST_NAMES_BY_NATIONALITY[nationality] || FIRST_NAMES_BY_NATIONALITY['England'];
  const lastNames = LAST_NAMES_BY_NATIONALITY[nationality] || LAST_NAMES_BY_NATIONALITY['England'];
  
  return {
    firstName: randomElement(firstNames),
    lastName: randomElement(lastNames)
  };
}

function getTeamNationality(teamId: string): string {
  // Map team IDs to nationalities based on league structure
  if (teamId.startsWith('ire-')) return 'Ireland';
  if (teamId.startsWith('wal-')) return 'Wales';
  if (teamId.startsWith('sco-')) return 'Scotland';
  if (teamId.startsWith('ita-')) return 'Italy';
  if (teamId.startsWith('eng-')) return 'England';
  if (teamId.startsWith('fra-')) return 'France';
  if (teamId.startsWith('nzl-')) return 'New Zealand';
  if (teamId.startsWith('zaf-')) return 'South Africa';
  if (teamId.startsWith('aus-')) return 'Australia';
  return randomElement(NATIONALITIES);
}

function generateExperienceLevel(reputation: number): ExperienceLevel {
  if (reputation >= 80) return randomElement(['veteran', 'legendary']);
  if (reputation >= 60) return randomElement(['experienced', 'veteran']);
  if (reputation >= 40) return randomElement(['developing', 'experienced']);
  return randomElement(['rookie', 'developing']);
}

function getSpecializationForRole(role: CoachRole): Specialization {
  switch (role) {
    case 'attack_coach': return 'attack';
    case 'defense_coach': return 'defense';
    case 'scrum_coach': return 'set_pieces';
    case 'skills_coach': return randomElement(['attack', 'balanced']);
    case 'head_coach': return randomElement(['balanced', 'attack', 'defense']);
  }
}

export function generateAICoachesForTeam(teamId: string, teamReputation: number): AICoach[] {
  const nationality = getTeamNationality(teamId);
  const roles: CoachRole[] = ['head_coach', 'attack_coach', 'defense_coach', 'scrum_coach', 'skills_coach'];
  
  return roles.map(role => {
    // Head coach tends to be slightly higher reputation
    const reputationModifier = role === 'head_coach' ? 10 : Math.floor(Math.random() * 20) - 10;
    const coachReputation = Math.max(20, Math.min(100, teamReputation + reputationModifier));
    
    // 70% chance of same nationality, 30% chance of different
    const coachNationality = Math.random() > 0.3 ? nationality : randomElement(NATIONALITIES);
    const name = generateCoachName(coachNationality);
    
    return {
      id: `${teamId}-${role}`,
      team_id: teamId,
      first_name: name.firstName,
      last_name: name.lastName,
      nationality: coachNationality,
      role,
      experience_level: generateExperienceLevel(coachReputation),
      specialization: getSpecializationForRole(role),
      reputation: coachReputation,
      created_at: new Date().toISOString()
    };
  });
}

export function generateAllAICoaches(teams: { id: string; reputation: number }[]): AICoach[] {
  return teams.flatMap(team => generateAICoachesForTeam(team.id, team.reputation));
}
