import { DevelopmentActivity } from '@/types/coachDevelopment';

export const DEVELOPMENT_ACTIVITIES: DevelopmentActivity[] = [
  // === SEMINARS ===
  {
    id: 'seminar_tactical_basics',
    name: 'Tactical Fundamentals Seminar',
    description: 'A comprehensive workshop covering the foundations of rugby tactics and game planning.',
    category: 'seminar',
    duration: 1,
    cost: 5000,
    xpReward: 50,
    skillBoosts: {
      tacticalAwareness: 3,
      attackCoaching: 2,
      defenseCoaching: 2
    },
    repeatable: false,
    icon: 'BookOpen'
  },
  {
    id: 'seminar_modern_attack',
    name: 'Modern Attack Patterns Workshop',
    description: 'Learn cutting-edge attacking strategies used by top international teams.',
    category: 'seminar',
    duration: 2,
    cost: 12000,
    xpReward: 100,
    skillBoosts: {
      attackCoaching: 5,
      tacticalAwareness: 3
    },
    requirements: {
      minLevel: 3,
      minSkill: { attackCoaching: 45 }
    },
    repeatable: false,
    icon: 'Zap'
  },
  {
    id: 'seminar_defensive_systems',
    name: 'Defensive Systems Masterclass',
    description: 'Deep dive into rush, drift, and blitz defensive structures.',
    category: 'seminar',
    duration: 2,
    cost: 12000,
    xpReward: 100,
    skillBoosts: {
      defenseCoaching: 5,
      tacticalAwareness: 3
    },
    requirements: {
      minLevel: 3,
      minSkill: { defenseCoaching: 45 }
    },
    repeatable: false,
    icon: 'Shield'
  },
  {
    id: 'seminar_set_piece_mastery',
    name: 'Set Piece Mastery Course',
    description: 'Advanced lineout, scrum, and restart strategies from former international coaches.',
    category: 'seminar',
    duration: 3,
    cost: 18000,
    xpReward: 150,
    skillBoosts: {
      setPieceCoaching: 6,
      tacticalAwareness: 2
    },
    requirements: {
      minLevel: 5,
      minSkill: { setPieceCoaching: 50 }
    },
    repeatable: false,
    icon: 'Target'
  },
  {
    id: 'seminar_leadership',
    name: 'Leadership & Communication Summit',
    description: 'Develop your leadership presence and communication skills with sports psychologists.',
    category: 'seminar',
    duration: 2,
    cost: 15000,
    xpReward: 120,
    skillBoosts: {
      leadership: 5,
      communication: 4,
      manManagement: 3
    },
    repeatable: false,
    icon: 'Users'
  },
  {
    id: 'seminar_sports_science',
    name: 'Sports Science Conference',
    description: 'Latest research on player conditioning, recovery, and performance optimization.',
    category: 'seminar',
    duration: 1,
    cost: 8000,
    xpReward: 75,
    skillBoosts: {
      conditioningKnowledge: 4,
      skillsCoaching: 2
    },
    repeatable: true,
    icon: 'Activity'
  },

  // === CROSS-TRAINING ===
  {
    id: 'cross_nfl',
    name: 'NFL Coaching Exchange',
    description: 'Spend time with an NFL coaching staff learning their approach to set plays and conditioning.',
    category: 'cross_training',
    duration: 4,
    cost: 25000,
    xpReward: 200,
    skillBoosts: {
      attackCoaching: 4,
      tacticalAwareness: 5,
      conditioningKnowledge: 3
    },
    requirements: {
      minLevel: 6
    },
    repeatable: false,
    icon: 'Trophy'
  },
  {
    id: 'cross_afl',
    name: 'AFL Skills Development Program',
    description: 'Learn high-tempo, aerial skills coaching from Australian Rules Football experts.',
    category: 'cross_training',
    duration: 3,
    cost: 20000,
    xpReward: 175,
    skillBoosts: {
      skillsCoaching: 5,
      conditioningKnowledge: 4,
      adaptability: 3
    },
    requirements: {
      minLevel: 4
    },
    repeatable: false,
    icon: 'Wind'
  },
  {
    id: 'cross_soccer',
    name: 'Football Tactical Immersion',
    description: 'Study pressing, spatial awareness, and possession-based tactics with soccer coaches.',
    category: 'cross_training',
    duration: 3,
    cost: 18000,
    xpReward: 160,
    skillBoosts: {
      tacticalAwareness: 5,
      defenseCoaching: 3,
      communication: 2
    },
    requirements: {
      minLevel: 4
    },
    repeatable: false,
    icon: 'Globe'
  },
  {
    id: 'cross_military',
    name: 'Military Leadership Training',
    description: 'Intensive leadership and discipline program based on military training principles.',
    category: 'cross_training',
    duration: 2,
    cost: 10000,
    xpReward: 125,
    skillBoosts: {
      leadership: 4,
      discipline: 5,
      motivation: 3
    },
    requirements: {
      minLevel: 2
    },
    repeatable: false,
    icon: 'Medal'
  },
  {
    id: 'cross_league',
    name: 'Rugby League Defensive Exchange',
    description: 'Learn aggressive line speed and tackle technique coaching from NRL experts.',
    category: 'cross_training',
    duration: 2,
    cost: 12000,
    xpReward: 110,
    skillBoosts: {
      defenseCoaching: 4,
      conditioningKnowledge: 3,
      discipline: 2
    },
    requirements: {
      minLevel: 3
    },
    repeatable: false,
    icon: 'Swords'
  },

  // === MENTORSHIP ===
  {
    id: 'mentor_veteran',
    name: 'Veteran Coach Mentorship',
    description: 'Monthly sessions with a legendary retired coach sharing decades of wisdom.',
    category: 'mentorship',
    duration: 8,
    cost: 30000,
    xpReward: 300,
    skillBoosts: {
      tacticalAwareness: 4,
      manManagement: 5,
      leadership: 4,
      adaptability: 3
    },
    requirements: {
      minLevel: 5
    },
    repeatable: false,
    icon: 'GraduationCap'
  },
  {
    id: 'mentor_psychologist',
    name: 'Sports Psychology Coaching',
    description: 'Work with a sports psychologist to enhance your motivational and man-management skills.',
    category: 'mentorship',
    duration: 4,
    cost: 15000,
    xpReward: 150,
    skillBoosts: {
      motivation: 5,
      manManagement: 4,
      communication: 3
    },
    requirements: {
      minLevel: 2
    },
    repeatable: false,
    icon: 'Brain'
  },
  {
    id: 'mentor_analyst',
    name: 'Analysis & Data Mentorship',
    description: 'Learn to leverage video analysis and data to improve tactical decision-making.',
    category: 'mentorship',
    duration: 3,
    cost: 12000,
    xpReward: 125,
    skillBoosts: {
      tacticalAwareness: 4,
      attackCoaching: 2,
      defenseCoaching: 2
    },
    repeatable: false,
    icon: 'LineChart'
  },

  // === EXPERIENCE (Passive/Auto-triggered) ===
  {
    id: 'exp_match_win',
    name: 'Match Victory',
    description: 'Learn from your team\'s successful performance.',
    category: 'experience',
    duration: 0,
    cost: 0,
    xpReward: 25,
    skillBoosts: {
      tacticalAwareness: 1,
      motivation: 1
    },
    repeatable: true,
    icon: 'Trophy'
  },
  {
    id: 'exp_match_loss',
    name: 'Match Defeat Analysis',
    description: 'Valuable lessons learned from analyzing a defeat.',
    category: 'experience',
    duration: 0,
    cost: 0,
    xpReward: 15,
    skillBoosts: {
      adaptability: 1,
      tacticalAwareness: 1
    },
    repeatable: true,
    icon: 'TrendingDown'
  },
  {
    id: 'exp_training_week',
    name: 'Training Week Complete',
    description: 'Steady improvement through consistent training.',
    category: 'experience',
    duration: 0,
    cost: 0,
    xpReward: 5,
    skillBoosts: {},
    repeatable: true,
    icon: 'Dumbbell'
  },
  {
    id: 'exp_season_complete',
    name: 'Season Complete',
    description: 'A full season of experience under your belt.',
    category: 'experience',
    duration: 0,
    cost: 0,
    xpReward: 100,
    skillBoosts: {
      tacticalAwareness: 2,
      manManagement: 2,
      adaptability: 2
    },
    repeatable: true,
    icon: 'Calendar'
  },
  {
    id: 'exp_title_win',
    name: 'Championship Victory',
    description: 'The ultimate validation of your coaching ability.',
    category: 'experience',
    duration: 0,
    cost: 0,
    xpReward: 250,
    skillBoosts: {
      leadership: 3,
      motivation: 3,
      tacticalAwareness: 2
    },
    repeatable: true,
    icon: 'Crown'
  }
];

export const getActivityById = (id: string): DevelopmentActivity | undefined => {
  return DEVELOPMENT_ACTIVITIES.find(a => a.id === id);
};

export const getActivitiesByCategory = (category: string): DevelopmentActivity[] => {
  return DEVELOPMENT_ACTIVITIES.filter(a => a.category === category);
};

export const getAvailableActivities = (
  currentLevel: number,
  skills: Record<string, number>,
  completedActivities: string[]
): DevelopmentActivity[] => {
  return DEVELOPMENT_ACTIVITIES.filter(activity => {
    // Skip experience activities (auto-triggered)
    if (activity.category === 'experience') return false;
    
    // Check if already completed and not repeatable
    if (!activity.repeatable && completedActivities.includes(activity.id)) return false;
    
    // Check level requirement
    if (activity.requirements?.minLevel && currentLevel < activity.requirements.minLevel) return false;
    
    // Check skill requirements
    if (activity.requirements?.minSkill) {
      for (const [skill, minValue] of Object.entries(activity.requirements.minSkill)) {
        if ((skills[skill] || 0) < minValue) return false;
      }
    }
    
    // Check prerequisite activities
    if (activity.requirements?.completedActivities) {
      for (const reqActivity of activity.requirements.completedActivities) {
        if (!completedActivities.includes(reqActivity)) return false;
      }
    }
    
    return true;
  });
};

export const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  seminar: {
    label: 'Seminars & Workshops',
    description: 'Structured learning opportunities to develop specific skills'
  },
  cross_training: {
    label: 'Cross-Training Programs',
    description: 'Learn from other sports and disciplines'
  },
  mentorship: {
    label: 'Mentorship Programs',
    description: 'One-on-one guidance from experts'
  },
  experience: {
    label: 'Match Experience',
    description: 'Learn through managing your team'
  }
};
