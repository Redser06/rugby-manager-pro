// Coach Skills and Development Types

export interface CoachSkills {
  // Core coaching skills (0-100)
  tacticalAwareness: number;
  manManagement: number;
  motivation: number;
  discipline: number;
  
  // Technical skills
  attackCoaching: number;
  defenseCoaching: number;
  setPieceCoaching: number;
  skillsCoaching: number;
  conditioningKnowledge: number;
  
  // Mental attributes
  adaptability: number;
  communication: number;
  leadership: number;
}

export interface CoachDevelopmentState {
  skills: CoachSkills;
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  completedActivities: string[]; // Activity IDs
  activeActivity: ActiveActivity | null;
  activityHistory: ActivityHistoryEntry[];
}

export interface ActiveActivity {
  activityId: string;
  startedWeek: number;
  startedSeason: number;
  completionWeek: number;
  completionSeason: number;
}

export interface ActivityHistoryEntry {
  activityId: string;
  completedWeek: number;
  completedSeason: number;
  xpGained: number;
  skillsImproved: Partial<CoachSkills>;
}

export type ActivityCategory = 'seminar' | 'cross_training' | 'experience' | 'mentorship';

export interface DevelopmentActivity {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  duration: number; // In weeks
  cost: number; // In game currency
  xpReward: number;
  skillBoosts: Partial<CoachSkills>;
  requirements?: {
    minLevel?: number;
    minSkill?: Partial<CoachSkills>;
    completedActivities?: string[];
  };
  repeatable: boolean;
  icon: string; // Lucide icon name
}

// Helper functions
export const getDefaultCoachSkills = (experienceLevel: string, specialization: string): CoachSkills => {
  const baseSkills: CoachSkills = {
    tacticalAwareness: 40,
    manManagement: 40,
    motivation: 40,
    discipline: 40,
    attackCoaching: 40,
    defenseCoaching: 40,
    setPieceCoaching: 40,
    skillsCoaching: 40,
    conditioningKnowledge: 40,
    adaptability: 40,
    communication: 40,
    leadership: 40
  };

  // Modify based on experience level
  const experienceBonus = {
    rookie: 0,
    developing: 10,
    experienced: 20,
    veteran: 30,
    legendary: 40
  }[experienceLevel] || 0;

  Object.keys(baseSkills).forEach(key => {
    baseSkills[key as keyof CoachSkills] += experienceBonus + Math.floor(Math.random() * 10);
  });

  // Boost specialization skills
  switch (specialization) {
    case 'attack':
      baseSkills.attackCoaching += 15;
      baseSkills.tacticalAwareness += 10;
      break;
    case 'defense':
      baseSkills.defenseCoaching += 15;
      baseSkills.discipline += 10;
      break;
    case 'set_pieces':
      baseSkills.setPieceCoaching += 15;
      baseSkills.tacticalAwareness += 10;
      break;
    case 'conditioning':
      baseSkills.conditioningKnowledge += 15;
      baseSkills.motivation += 10;
      break;
    case 'balanced':
      baseSkills.adaptability += 10;
      baseSkills.communication += 10;
      break;
  }

  // Cap all skills at 100
  Object.keys(baseSkills).forEach(key => {
    baseSkills[key as keyof CoachSkills] = Math.min(100, baseSkills[key as keyof CoachSkills]);
  });

  return baseSkills;
};

export const calculateLevel = (totalXP: number): { level: number; xpToNext: number; xpProgress: number } => {
  // XP required per level: 100, 250, 450, 700, 1000, 1350, 1750...
  // Formula: level * 100 + (level - 1) * 50
  let level = 1;
  let totalRequired = 0;
  
  while (true) {
    const xpForLevel = level * 100 + (level - 1) * 50;
    if (totalRequired + xpForLevel > totalXP) {
      const xpProgress = totalXP - totalRequired;
      return { level, xpToNext: xpForLevel - xpProgress, xpProgress };
    }
    totalRequired += xpForLevel;
    level++;
  }
};

export const SKILL_LABELS: Record<keyof CoachSkills, string> = {
  tacticalAwareness: 'Tactical Awareness',
  manManagement: 'Man Management',
  motivation: 'Motivation',
  discipline: 'Discipline',
  attackCoaching: 'Attack Coaching',
  defenseCoaching: 'Defense Coaching',
  setPieceCoaching: 'Set Piece Coaching',
  skillsCoaching: 'Skills Coaching',
  conditioningKnowledge: 'Conditioning Knowledge',
  adaptability: 'Adaptability',
  communication: 'Communication',
  leadership: 'Leadership'
};

export const SKILL_CATEGORIES = {
  core: ['tacticalAwareness', 'manManagement', 'motivation', 'discipline'] as (keyof CoachSkills)[],
  technical: ['attackCoaching', 'defenseCoaching', 'setPieceCoaching', 'skillsCoaching', 'conditioningKnowledge'] as (keyof CoachSkills)[],
  mental: ['adaptability', 'communication', 'leadership'] as (keyof CoachSkills)[]
};
