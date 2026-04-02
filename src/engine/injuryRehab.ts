// ========================
// INJURY & REHABILITATION ENGINE
// ========================

import { Player } from '@/types/game';
import { PlayerExtended, ChronicInjury, InjuryRehab } from '@/types/playerExtended';

// ---- Injury Generation ----
export function rollForInjury(player: Player, ext: PlayerExtended, matchMinutes: number): InjuryRehab | null {
  // Base chance per match
  let baseChance = ext.injuryProneness / 500; // 0-0.2 base
  
  // Fatigue multiplier
  if (ext.weeklyFatigue > 80) baseChance *= 2;
  else if (ext.weeklyFatigue > 60) baseChance *= 1.5;
  
  // Age factor
  if (player.age > 32) baseChance *= 1.5;
  else if (player.age > 30) baseChance *= 1.2;
  
  // Chronic injury flare-up check
  for (const chronic of ext.chronicInjuries) {
    if (Math.random() * 100 < chronic.reinjuryRisk) {
      return generateInjuryFromChronic(player.id, chronic);
    }
  }
  
  // Minutes played factor
  baseChance *= matchMinutes / 80;
  
  if (Math.random() < baseChance) {
    return generateRandomInjury(player.id, player.age);
  }
  
  return null;
}

function generateInjuryFromChronic(playerId: string, chronic: ChronicInjury): InjuryRehab {
  const weeksMap: Record<ChronicInjury['severity'], [number, number]> = {
    mild: [1, 3],
    moderate: [3, 6],
    severe: [6, 12],
  };
  const [min, max] = weeksMap[chronic.severity];
  const weeks = min + Math.floor(Math.random() * (max - min + 1));
  
  const surgeryEligible = ['knee', 'shoulder', 'ankle'].includes(chronic.type) && chronic.severity !== 'mild';
  
  return {
    playerId,
    injuryType: `${chronic.type} (chronic flare-up)`,
    originalWeeks: weeks,
    strategy: 'normal',
    actualWeeks: weeks,
    reinjuryRiskModifier: 1,
    surgerRequired: false,
    ...(surgeryEligible ? {
      surgeryWeeks: Math.ceil(weeks * 2.5),
      restWeeks: weeks,
    } : {}),
  };
}

const INJURY_TYPES = [
  { type: 'Hamstring strain', minWeeks: 2, maxWeeks: 6, surgeryEligible: false },
  { type: 'Knee ligament', minWeeks: 4, maxWeeks: 12, surgeryEligible: true },
  { type: 'Shoulder dislocation', minWeeks: 4, maxWeeks: 10, surgeryEligible: true },
  { type: 'Ankle sprain', minWeeks: 1, maxWeeks: 4, surgeryEligible: false },
  { type: 'Concussion (HIA)', minWeeks: 1, maxWeeks: 3, surgeryEligible: false },
  { type: 'Calf tear', minWeeks: 2, maxWeeks: 5, surgeryEligible: false },
  { type: 'Broken nose', minWeeks: 1, maxWeeks: 2, surgeryEligible: false },
  { type: 'Rib fracture', minWeeks: 3, maxWeeks: 6, surgeryEligible: false },
  { type: 'ACL tear', minWeeks: 24, maxWeeks: 40, surgeryEligible: true },
  { type: 'Groin strain', minWeeks: 2, maxWeeks: 6, surgeryEligible: false },
  { type: 'Back spasm', minWeeks: 1, maxWeeks: 4, surgeryEligible: false },
  { type: 'Quad tear', minWeeks: 3, maxWeeks: 8, surgeryEligible: false },
];

function generateRandomInjury(playerId: string, age: number): InjuryRehab {
  const injury = INJURY_TYPES[Math.floor(Math.random() * INJURY_TYPES.length)];
  const weeks = injury.minWeeks + Math.floor(Math.random() * (injury.maxWeeks - injury.minWeeks + 1));
  
  return {
    playerId,
    injuryType: injury.type,
    originalWeeks: weeks,
    strategy: 'normal',
    actualWeeks: weeks,
    reinjuryRiskModifier: 1,
    surgerRequired: false,
    ...(injury.surgeryEligible ? {
      surgeryWeeks: Math.ceil(weeks * 2.5),
      restWeeks: weeks,
    } : {}),
  };
}

// ---- Rehab Strategy Application ----
export function applyRehabStrategy(rehab: InjuryRehab, strategy: InjuryRehab['strategy']): InjuryRehab {
  switch (strategy) {
    case 'rush_back':
      return {
        ...rehab,
        strategy: 'rush_back',
        actualWeeks: Math.max(1, Math.ceil(rehab.originalWeeks * 0.7)),
        reinjuryRiskModifier: 2.0, // doubled re-injury risk for 4 weeks after return
      };
    case 'conservative':
      return {
        ...rehab,
        strategy: 'conservative',
        actualWeeks: Math.ceil(rehab.originalWeeks * 1.3),
        reinjuryRiskModifier: 0.5, // halved re-injury risk
      };
    case 'normal':
    default:
      return {
        ...rehab,
        strategy: 'normal',
        actualWeeks: rehab.originalWeeks,
        reinjuryRiskModifier: 1,
      };
  }
}

export function chooseSurgery(rehab: InjuryRehab, takeSurgery: boolean): InjuryRehab {
  if (!rehab.surgeryWeeks) return rehab;
  
  if (takeSurgery) {
    return {
      ...rehab,
      surgerRequired: true,
      actualWeeks: rehab.surgeryWeeks,
      reinjuryRiskModifier: 0.3, // surgery mostly fixes it
    };
  } else {
    return {
      ...rehab,
      surgerRequired: false,
      actualWeeks: rehab.restWeeks || rehab.originalWeeks,
      reinjuryRiskModifier: 1.5, // recurring risk
    };
  }
}

// ---- Chronic Injury Management ----
export function shouldRestForChronic(ext: PlayerExtended): { needsRest: boolean; reason: string } | null {
  for (const chronic of ext.chronicInjuries) {
    if (chronic.managementStrategy === 'rest_every_3rd' && ext.matchesSinceRest >= 3) {
      return { needsRest: true, reason: `${chronic.type} management — rest every 3rd game` };
    }
    if (chronic.managementStrategy === 'managed_minutes' && ext.matchesSinceRest >= 2) {
      return { needsRest: true, reason: `${chronic.type} — managed minutes protocol` };
    }
  }
  return null;
}

export function updateChronicManagement(
  ext: PlayerExtended, 
  injuryIndex: number, 
  strategy: ChronicInjury['managementStrategy']
): PlayerExtended {
  const chronicInjuries = [...ext.chronicInjuries];
  chronicInjuries[injuryIndex] = { ...chronicInjuries[injuryIndex], managementStrategy: strategy };
  return { ...ext, chronicInjuries };
}

// ---- Post-return monitoring ----
export function isInRushBackWindow(rehab: InjuryRehab, weeksSinceReturn: number): boolean {
  return rehab.strategy === 'rush_back' && weeksSinceReturn <= 4;
}

export function getRushBackReinjuryChance(ext: PlayerExtended, rehab: InjuryRehab): number {
  return ext.injuryProneness * rehab.reinjuryRiskModifier / 100;
}
