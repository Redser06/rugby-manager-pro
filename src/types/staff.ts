// ========================
// COACHING STAFF SYSTEM
// ========================

export type StaffRole =
  | 'head_coach'
  | 'attack_coach'
  | 'defence_coach'
  | 'scrum_coach'
  | 'kicking_coach'
  | 'lineout_coach'
  | 'analyst'
  | 'sports_psychologist'
  | 'nutritionist'
  | 'head_physio'
  | 'strength_conditioning';

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  nationality: string;
  age: number;
  experience: number; // 1-100
  quality: number; // 1-100
  salary: number; // annual
  contractYears: number;
  speciality?: string;
}

export const STAFF_ROLE_INFO: Record<StaffRole, {
  name: string;
  description: string;
  bonusArea: string;
  icon: string;
}> = {
  head_coach: {
    name: 'Head Coach',
    description: 'Overall team management and match-day decisions',
    bonusArea: 'Team morale and cohesion',
    icon: '👔',
  },
  attack_coach: {
    name: 'Attack Coach',
    description: 'Develops attacking patterns and backline plays',
    bonusArea: 'Backs move execution, offload rate',
    icon: '⚔️',
  },
  defence_coach: {
    name: 'Defence Coach',
    description: 'Organises defensive line speed and tackle technique',
    bonusArea: 'Tackle completion %, defensive reads',
    icon: '🛡️',
  },
  scrum_coach: {
    name: 'Scrum Coach',
    description: 'Front row technique and pack cohesion at scrum time',
    bonusArea: 'Scrum success rate, scrum penalties won',
    icon: '💪',
  },
  kicking_coach: {
    name: 'Kicking Coach',
    description: 'Goal kicking accuracy and tactical kicking execution',
    bonusArea: 'Goal kicking %, 50:22 success, exit quality',
    icon: '🦶',
  },
  lineout_coach: {
    name: 'Lineout Coach',
    description: 'Lineout calling, throwing accuracy and repertoire',
    bonusArea: 'Lineout success rate, call repertoire size',
    icon: '📐',
  },
  analyst: {
    name: 'Performance Analyst',
    description: 'Opposition analysis and performance data',
    bonusArea: 'Scouting report quality, pattern recognition',
    icon: '📊',
  },
  sports_psychologist: {
    name: 'Sports Psychologist',
    description: 'Mental preparation and player wellbeing',
    bonusArea: 'Confidence recovery, ego management, big-game performance',
    icon: '🧠',
  },
  nutritionist: {
    name: 'Nutritionist',
    description: 'Diet planning and recovery optimisation',
    bonusArea: 'Recovery speed between matches, injury prevention',
    icon: '🥗',
  },
  head_physio: {
    name: 'Head Physiotherapist',
    description: 'Injury treatment and prevention programmes',
    bonusArea: 'Injury recovery time, re-injury prevention',
    icon: '🏥',
  },
  strength_conditioning: {
    name: 'S&C Coach',
    description: 'Physical preparation and athletic development',
    bonusArea: 'Player fitness, fatigue resistance, power development',
    icon: '🏋️',
  },
};

// Staff bonuses applied to match engine
export interface StaffBonuses {
  scrumBonus: number; // 0-15 points
  lineoutBonus: number;
  tackleBonus: number;
  kickingBonus: number;
  attackBonus: number;
  ruckSpeedBonus: number;
  fatigueResistance: number; // reduces fatigue rate
  injuryRecoveryBonus: number; // % faster recovery
  confidenceRecoveryBonus: number;
  scoutingQuality: number; // 0-100
  lineoutRepertoire: number; // additional calls
}

export function calculateStaffBonuses(staff: StaffMember[]): StaffBonuses {
  const bonuses: StaffBonuses = {
    scrumBonus: 0,
    lineoutBonus: 0,
    tackleBonus: 0,
    kickingBonus: 0,
    attackBonus: 0,
    ruckSpeedBonus: 0,
    fatigueResistance: 0,
    injuryRecoveryBonus: 0,
    confidenceRecoveryBonus: 0,
    scoutingQuality: 0,
    lineoutRepertoire: 0,
  };

  for (const member of staff) {
    const bonus = Math.floor(member.quality * 0.15); // max ~15 points per staff

    switch (member.role) {
      case 'scrum_coach':
        bonuses.scrumBonus += bonus;
        break;
      case 'lineout_coach':
        bonuses.lineoutBonus += bonus;
        bonuses.lineoutRepertoire += Math.floor(member.quality / 25) + 1; // 1-5 extra calls
        break;
      case 'defence_coach':
        bonuses.tackleBonus += bonus;
        break;
      case 'kicking_coach':
        bonuses.kickingBonus += bonus;
        break;
      case 'attack_coach':
        bonuses.attackBonus += bonus;
        bonuses.ruckSpeedBonus += Math.floor(bonus * 0.5);
        break;
      case 'analyst':
        bonuses.scoutingQuality += member.quality;
        break;
      case 'sports_psychologist':
        bonuses.confidenceRecoveryBonus += bonus;
        break;
      case 'nutritionist':
        bonuses.fatigueResistance += Math.floor(bonus * 0.5);
        bonuses.injuryRecoveryBonus += Math.floor(bonus * 0.7);
        break;
      case 'head_physio':
        bonuses.injuryRecoveryBonus += bonus;
        break;
      case 'strength_conditioning':
        bonuses.fatigueResistance += bonus;
        break;
    }
  }

  return bonuses;
}

// Coaching philosophy
export type CoachingPhilosophy = 'structured' | 'expansive' | 'pragmatic' | 'development';

export const COACHING_PHILOSOPHIES: Record<CoachingPhilosophy, {
  name: string;
  description: string;
  example: string;
  effects: {
    setPieceBonus: number;
    creativityBonus: number;
    riskTolerance: number;
    youthDevelopment: number;
    matchPreparedness: number;
  };
}> = {
  structured: {
    name: 'Structured',
    description: 'Highly organised game plan with detailed set-piece routines and controlled phase play.',
    example: 'Joe Schmidt era Ireland',
    effects: {
      setPieceBonus: 15,
      creativityBonus: -5,
      riskTolerance: -10,
      youthDevelopment: 0,
      matchPreparedness: 10,
    },
  },
  expansive: {
    name: 'Expansive',
    description: 'Width and tempo. Encourage offloads, skip passes and creative running lines.',
    example: 'Warren Gatland Wales',
    effects: {
      setPieceBonus: 0,
      creativityBonus: 15,
      riskTolerance: 10,
      youthDevelopment: 5,
      matchPreparedness: 0,
    },
  },
  pragmatic: {
    name: 'Pragmatic',
    description: 'Win by any means necessary. Bench-heavy, kicking game, physical dominance.',
    example: 'Rassie Erasmus Springboks',
    effects: {
      setPieceBonus: 10,
      creativityBonus: -10,
      riskTolerance: -5,
      youthDevelopment: -5,
      matchPreparedness: 15,
    },
  },
  development: {
    name: 'Development',
    description: 'Build for the future. Young players get more minutes. Short-term results may suffer.',
    example: 'Academy-focused rebuild',
    effects: {
      setPieceBonus: -5,
      creativityBonus: 5,
      riskTolerance: 5,
      youthDevelopment: 20,
      matchPreparedness: -10,
    },
  },
};

// Scouting report
export interface ScoutingReport {
  teamId: string;
  teamName: string;
  quality: number; // 0-100, determines how much is revealed
  generatedAt: Date;
  
  // Revealed based on quality
  scrumTendency?: string;
  lineoutCalls?: string[]; // known calls
  primaryAttackSide?: 'left' | 'right' | 'balanced';
  kickingPatterns?: string;
  defensiveWeakness?: string;
  keyPlayer?: string;
  setPieceStrength?: 'strong' | 'average' | 'weak';
}
