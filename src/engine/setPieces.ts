import { Player, PositionNumber } from '@/types/game';
import { Referee } from '@/types/matchEngine';
import { StaffBonuses } from '@/types/staff';

// ========================
// SCRUM ENGINE
// ========================

interface ScrumContext {
  homePackPlayers: Player[];
  awayPackPlayers: Player[];
  homeStaffBonuses: StaffBonuses;
  awayStaffBonuses: StaffBonuses;
  referee: Referee;
  homeFatigue: Record<string, number>; // playerId -> fatigue 0-100
  awayFatigue: Record<string, number>;
  homeDominanceStreak: number; // how many consecutive scrums dominated
  awayDominanceStreak: number;
}

export interface ScrumResult {
  winner: 'home' | 'away';
  outcome: 'clean_win' | 'messy_win' | 'penalty_won' | 'penalty_conceded' | 'free_kick' | 'reset';
  isDominant: boolean; // Was it a dominant scrum that degrades opposition ball quality?
  description: string;
  penaltyTo?: 'home' | 'away';
}

function getPackStrength(players: Player[], fatigue: Record<string, number>, staffBonus: number): number {
  let strength = 0;
  for (const p of players) {
    const attrs = p.attributes as any;
    const scrumVal = attrs.scrummaging || attrs.strength || 60;
    const strengthVal = attrs.strength || 60;
    const fatigueModifier = 1 - (fatigue[p.id] || 0) / 200; // fatigue reduces by up to 50%
    strength += (scrumVal * 0.6 + strengthVal * 0.4) * fatigueModifier;
  }
  return strength + staffBonus;
}

export function simulateScrum(ctx: ScrumContext): ScrumResult {
  const homeStrength = getPackStrength(ctx.homePackPlayers, ctx.homeFatigue, ctx.homeStaffBonuses.scrumBonus);
  const awayStrength = getPackStrength(ctx.awayPackPlayers, ctx.awayFatigue, ctx.awayStaffBonuses.scrumBonus);

  // Fatigue advantage: fresh front row vs tired = big advantage
  const homeAvgFatigue = Object.values(ctx.homeFatigue).reduce((a, b) => a + b, 0) / Math.max(Object.values(ctx.homeFatigue).length, 1);
  const awayAvgFatigue = Object.values(ctx.awayFatigue).reduce((a, b) => a + b, 0) / Math.max(Object.values(ctx.awayFatigue).length, 1);
  const fatigueDiff = awayAvgFatigue - homeAvgFatigue; // positive = home advantage

  const total = homeStrength + awayStrength;
  const homeChance = (homeStrength / total) + (fatigueDiff / 500);

  // Referee bias
  let refBias = 0;
  if (ctx.referee.scrumBias === 'loosehead') refBias = 0.03;
  else if (ctx.referee.scrumBias === 'tighthead') refBias = -0.03;

  const roll = Math.random();
  const adjustedChance = homeChance + refBias;

  // Determine outcome
  const strengthDiff = Math.abs(homeStrength - awayStrength) / total;
  const isDominant = strengthDiff > 0.15;

  if (roll < adjustedChance * 0.6) {
    // Clean win
    return {
      winner: 'home',
      outcome: 'clean_win',
      isDominant,
      description: isDominant ? 'Home pack absolutely dominates the scrum. Clean ball out the back.' : 'Home team wins the scrum. Solid platform.',
    };
  } else if (roll < adjustedChance * 0.85) {
    // Penalty to home
    return {
      winner: 'home',
      outcome: 'penalty_won',
      isDominant,
      penaltyTo: 'home',
      description: 'The scrum collapses under pressure. Penalty to the home side.',
    };
  } else if (roll < adjustedChance) {
    // Messy home win
    return {
      winner: 'home',
      outcome: 'messy_win',
      isDominant: false,
      description: 'Scrum is messy but home team get ball back.',
    };
  } else if (roll < adjustedChance + (1 - adjustedChance) * 0.6) {
    // Clean away win
    return {
      winner: 'away',
      outcome: 'clean_win',
      isDominant,
      description: isDominant ? 'Away pack takes the home front row apart. Textbook scrum.' : 'Away team win their own ball cleanly.',
    };
  } else if (roll < adjustedChance + (1 - adjustedChance) * 0.85) {
    // Penalty to away
    return {
      winner: 'away',
      outcome: 'penalty_won',
      isDominant,
      penaltyTo: 'away',
      description: 'Penalty at scrum time! Away team on top in the tight exchanges.',
    };
  } else {
    // Reset
    return {
      winner: Math.random() < 0.5 ? 'home' : 'away',
      outcome: 'reset',
      isDominant: false,
      description: 'Scrum collapses. Referee calls for a reset.',
    };
  }
}

// ========================
// LINEOUT ENGINE
// ========================

interface LineoutContext {
  throwingTeam: 'home' | 'away';
  hooker: Player;
  jumpers: Player[]; // locks and back row
  oppositionJumpers: Player[];
  staffBonus: number;
  oppositionStaffBonus: number;
  repertoireSize: number; // base 8 + lineout coach bonus
  matchesAgainstOpponent: number; // more matches = more scouted
  referee: Referee;
}

export interface LineoutResult {
  winner: 'home' | 'away';
  outcome: 'clean_catch' | 'messy_catch' | 'stolen' | 'not_straight';
  targetZone: 'front' | 'middle' | 'back';
  description: string;
}

export function simulateLineout(ctx: LineoutContext): LineoutResult {
  const hookerAttrs = ctx.hooker.attributes as any;
  const throwingAccuracy = (hookerAttrs.throwing || hookerAttrs.workRate || 60) / 100;

  // Best jumper
  const bestJumperAbility = Math.max(...ctx.jumpers.map(j => {
    const a = j.attributes as any;
    return a.lineout || a.aerialAbility || 60;
  })) / 100;

  const bestOppJumperAbility = Math.max(...ctx.oppositionJumpers.map(j => {
    const a = j.attributes as any;
    return a.lineout || a.aerialAbility || 50;
  })) / 100;

  // Scouting factor: opponent learns your calls over time
  const scoutedPenalty = Math.min(ctx.matchesAgainstOpponent * 3, 15) / 100; // up to 15% penalty
  const repertoireDefense = Math.min(ctx.repertoireSize * 2, 20) / 100; // more calls = harder to scout

  const successChance = (throwingAccuracy * 0.4 + bestJumperAbility * 0.35 + ctx.staffBonus / 100 * 0.15 + repertoireDefense * 0.1) - scoutedPenalty;
  const stealChance = bestOppJumperAbility * 0.3 + scoutedPenalty * 0.5 + ctx.oppositionStaffBonus / 100 * 0.1;

  const zones: ('front' | 'middle' | 'back')[] = ['front', 'middle', 'back'];
  const targetZone = zones[Math.floor(Math.random() * 3)];

  const roll = Math.random();

  if (roll < 0.03) {
    // Not straight
    return {
      winner: ctx.throwingTeam === 'home' ? 'away' : 'home',
      outcome: 'not_straight',
      targetZone,
      description: `Not straight at the lineout! Scrum to the ${ctx.throwingTeam === 'home' ? 'away' : 'home'} side.`,
    };
  }

  if (roll < successChance * 0.7) {
    return {
      winner: ctx.throwingTeam,
      outcome: 'clean_catch',
      targetZone,
      description: `Clean lineout ball at the ${targetZone}. Good platform for the attack.`,
    };
  }

  if (roll < successChance) {
    return {
      winner: ctx.throwingTeam,
      outcome: 'messy_catch',
      targetZone,
      description: 'Lineout won but it was untidy. Ball takes time to get to the backs.',
    };
  }

  if (roll < successChance + stealChance * 0.3) {
    return {
      winner: ctx.throwingTeam === 'home' ? 'away' : 'home',
      outcome: 'stolen',
      targetZone,
      description: 'Lineout STOLEN! The opposition read that call perfectly!',
    };
  }

  // Default: messy win for throwing team
  return {
    winner: ctx.throwingTeam,
    outcome: 'messy_catch',
    targetZone,
    description: 'Lineout secured after a bit of a scramble.',
  };
}

// ========================
// MAUL ENGINE
// ========================

interface MaulContext {
  attackingTeam: 'home' | 'away';
  attackingForwards: Player[];
  defendingForwards: Player[];
  attackingFatigue: Record<string, number>;
  defendingFatigue: Record<string, number>;
  distanceFromLine: number; // metres from try line
  trainingInvestment: number; // 0-100, how much maul work done
  referee: Referee;
}

export interface MaulResult {
  outcome: 'try' | 'held_up' | 'collapsed_penalty_attack' | 'collapsed_penalty_defence' | 'sacked' | 'ball_lost';
  metresGained: number;
  description: string;
}

export function simulateMaul(ctx: MaulContext): MaulResult {
  // Pack weight and strength advantage
  const getPackPower = (players: Player[], fatigue: Record<string, number>) => {
    return players.reduce((total, p) => {
      const attrs = p.attributes as any;
      const str = attrs.strength || attrs.ballCarrying || 60;
      const endurance = attrs.endurance || attrs.workRate || 60;
      const fatigueModifier = 1 - (fatigue[p.id] || 0) / 200;
      return total + (str * 0.6 + endurance * 0.4) * fatigueModifier;
    }, 0);
  };

  const attackPower = getPackPower(ctx.attackingForwards, ctx.attackingFatigue) + ctx.trainingInvestment * 0.5;
  const defencePower = getPackPower(ctx.defendingForwards, ctx.defendingFatigue);

  const advantage = attackPower / (attackPower + defencePower);
  const roll = Math.random();

  // Close to the line = more likely to score
  const distanceBonus = Math.max(0, (10 - ctx.distanceFromLine) / 10) * 0.2;

  if (advantage + distanceBonus > 0.55 && roll < 0.35 + distanceBonus) {
    // Maul try
    return {
      outcome: 'try',
      metresGained: ctx.distanceFromLine,
      description: 'The driving maul is UNSTOPPABLE! They\'ve scored from the lineout maul! Textbook rugby!',
    };
  }

  if (roll < 0.15) {
    // Defence sacks it
    return {
      outcome: 'sacked',
      metresGained: 0,
      description: 'Great work by the defence! They\'ve sacked the maul before it could get going!',
    };
  }

  if (roll < 0.35) {
    // Collapse - penalty
    const penaltyToAttack = advantage > 0.5;
    return {
      outcome: penaltyToAttack ? 'collapsed_penalty_attack' : 'collapsed_penalty_defence',
      metresGained: Math.floor(Math.random() * 5),
      description: penaltyToAttack
        ? 'The maul is brought down illegally! Penalty to the attacking team!'
        : 'The maul collapses. Referee penalises the attacking team for going off their feet.',
    };
  }

  if (roll < 0.55) {
    // Held up
    const metres = Math.floor(Math.random() * 8) + 1;
    return {
      outcome: 'held_up',
      metresGained: metres,
      description: `The maul is eventually held up after gaining ${metres} metres. Scrum to the attacking team.`,
    };
  }

  // Good gain but ball lost
  const metres = Math.floor(Math.random() * 6) + 2;
  return {
    outcome: 'ball_lost',
    metresGained: metres,
    description: `The maul gained ${metres} metres but the ball was lost in the collapse.`,
  };
}
