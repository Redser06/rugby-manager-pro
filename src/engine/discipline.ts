import { Player, PositionNumber } from '@/types/game';
import { Referee, TeamDiscipline, TMOReview, TMODecision, EnhancedMatchEvent } from '@/types/matchEngine';

// ========================
// PENALTY & DISCIPLINE ENGINE
// ========================

interface DisciplineContext {
  player: Player;
  playerDiscipline: number; // 0-100 from PlayerExtended
  minute: number;
  situation: 'breakdown' | 'scrum' | 'offside' | 'high_tackle' | 'cynical' | 'maul' | 'ruck_entry' | 'not_rolling';
  referee: Referee;
  teamDiscipline: TeamDiscipline;
  fatigue: number;
  isTrailing: boolean;
  scoreDifference: number;
}

export interface PenaltyResult {
  isPenalty: boolean;
  isYellowCard: boolean;
  isRedCard: boolean;
  triggersTMO: boolean;
  reason: string;
  description: string;
}

/**
 * Determine if a penalty occurs and its severity
 */
export function assessPenalty(ctx: DisciplineContext): PenaltyResult {
  // Base penalty chance from player discipline
  const basePenaltyChance = (100 - ctx.playerDiscipline) / 300; // 0 - 0.33

  // Fatigue increases penalty risk (tired players are sloppy)
  const fatigueModifier = ctx.fatigue > 60 ? (ctx.fatigue - 60) / 200 : 0;

  // Referee strictness
  const refModifier = ctx.referee.strictness / 50; // 0.02 to 0.2

  // Situation-specific modifiers
  let situationModifier = 0;
  let cardChance = 0;
  let tmoChance = 0;
  let reason = '';

  switch (ctx.situation) {
    case 'breakdown':
      situationModifier = ctx.referee.breakdownTolerance < 5 ? 0.1 : 0;
      reason = 'hands in the ruck';
      cardChance = 0.05;
      break;
    case 'scrum':
      situationModifier = 0.05;
      reason = 'collapsing the scrum';
      cardChance = 0.02;
      break;
    case 'offside':
      situationModifier = ctx.referee.offsideTolerance < 5 ? 0.08 : 0.03;
      reason = 'offside';
      cardChance = 0.03;
      break;
    case 'high_tackle':
      situationModifier = 0.12;
      reason = 'dangerous tackle - head contact';
      cardChance = 0.25; // high tackle framework
      tmoChance = 0.6;
      break;
    case 'cynical':
      situationModifier = ctx.isTrailing ? 0.1 : 0.05;
      reason = 'cynical play preventing a try-scoring opportunity';
      cardChance = 0.4;
      break;
    case 'maul':
      situationModifier = 0.06;
      reason = 'collapsing the maul';
      cardChance = 0.15;
      break;
    case 'ruck_entry':
      situationModifier = 0.05;
      reason = 'entering from the side at the ruck';
      cardChance = 0.03;
      break;
    case 'not_rolling':
      situationModifier = ctx.referee.breakdownTolerance < 5 ? 0.1 : 0.04;
      reason = 'not rolling away after the tackle';
      cardChance = 0.08;
      break;
  }

  const totalPenaltyChance = basePenaltyChance + fatigueModifier + refModifier * situationModifier;
  const isPenalty = Math.random() < totalPenaltyChance;

  if (!isPenalty) {
    return { isPenalty: false, isYellowCard: false, isRedCard: false, triggersTMO: false, reason: '', description: '' };
  }

  // Team warning escalation
  let isYellowCard = false;
  let isRedCard = false;
  const triggersTMO = Math.random() < tmoChance;

  // If team has a warning, next penalty = yellow
  if (ctx.teamDiscipline.hasTeamWarning) {
    isYellowCard = true;
  } else if (Math.random() < cardChance * (ctx.referee.cardThreshold < 5 ? 1.5 : 1)) {
    isYellowCard = true;
  }

  // Red card for high tackles (World Rugby Head Contact Process)
  if (ctx.situation === 'high_tackle' && Math.random() < 0.08) {
    isRedCard = true;
    isYellowCard = false;
  }

  const description = isRedCard
    ? `RED CARD! ${reason}. Sent off.`
    : isYellowCard
    ? `Yellow card for ${reason}. 10 minutes in the sin bin.`
    : `Penalty conceded for ${reason}.`;

  return { isPenalty, isYellowCard, isRedCard, triggersTMO, reason, description };
}

/**
 * Should the referee issue a team warning?
 */
export function shouldIssueTeamWarning(discipline: TeamDiscipline, referee: Referee): boolean {
  if (discipline.hasTeamWarning) return false;

  // Count penalties in similar areas
  const repeatedAreas = discipline.infringementAreas.reduce((acc, area) => {
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxRepeats = Math.max(...Object.values(repeatedAreas), 0);

  // 3+ penalties or 2+ in same area
  if (discipline.penaltyCount >= 3 || maxRepeats >= 2) {
    return referee.cardThreshold <= 6;
  }
  if (discipline.penaltyCount >= 4) {
    return true;
  }

  return false;
}

/**
 * TMO Review simulation
 */
export function simulateTMO(
  originalEvent: string,
  reason: 'try_check' | 'foul_play' | 'offside' | 'knock_on',
  referee: Referee
): TMOReview {
  const roll = Math.random();
  let finalDecision: TMODecision;
  let description: string;

  switch (reason) {
    case 'try_check':
      if (roll < 0.65) {
        finalDecision = 'try_awarded';
        description = 'TMO confirms the try. Grounding is good.';
      } else if (roll < 0.85) {
        finalDecision = 'try_disallowed';
        description = 'TMO disallows the try! Knock-on in the build-up.';
      } else {
        finalDecision = 'penalty_only';
        description = 'TMO disallows the try but awards a penalty for a prior infringement.';
      }
      break;
    case 'foul_play':
      if (roll < 0.3) {
        finalDecision = 'card_upgraded';
        description = 'TMO upgrades the decision. Card issued for dangerous play.';
      } else if (roll < 0.7) {
        finalDecision = 'penalty_only';
        description = 'TMO recommends a penalty only. Not enough for a card.';
      } else {
        finalDecision = 'no_action';
        description = 'TMO review complete. No further action required.';
      }
      break;
    case 'offside':
      if (roll < 0.5) {
        finalDecision = 'try_disallowed';
        description = 'TMO finds an offside in the build-up. Try disallowed.';
      } else {
        finalDecision = 'try_awarded';
        description = 'TMO clears it. Player was onside. Try stands!';
      }
      break;
    case 'knock_on':
      if (roll < 0.4) {
        finalDecision = 'try_disallowed';
        description = 'TMO spots a knock-on. Try disallowed. Scrum to the defence.';
      } else {
        finalDecision = 'try_awarded';
        description = 'TMO confirms. Ball went backwards. Try awarded!';
      }
      break;
    default:
      finalDecision = 'no_action';
      description = 'No further action.';
  }

  return {
    minute: 0, // set by caller
    reason,
    originalDecision: originalEvent,
    finalDecision,
    description,
  };
}

/**
 * Penalty decision: kick at goal or go to the corner?
 */
export function penaltyDecision(
  fieldPosition: number, // 0-100, 100 = opposition try line
  scoreDifference: number, // positive = ahead
  minute: number,
  kickerAccuracy: number, // 0-100
  packStrength: number, // relative pack dominance
  maulTraining: number // maul investment
): 'kick_at_goal' | 'kick_to_corner' | 'tap_and_go' {
  // Close to the line + strong pack = corner
  if (fieldPosition > 85 && packStrength > 60 && maulTraining > 50) {
    return 'kick_to_corner';
  }

  // Behind and late = more aggressive
  if (scoreDifference < -10 && minute > 60) {
    return fieldPosition > 70 ? 'kick_to_corner' : 'kick_at_goal';
  }

  // Good kicker + reasonable distance = kick at goal
  if (kickerAccuracy > 70 && fieldPosition > 40 && fieldPosition < 80) {
    return 'kick_at_goal';
  }

  // Close game, take the 3
  if (Math.abs(scoreDifference) <= 6 && kickerAccuracy > 60 && fieldPosition > 35) {
    return 'kick_at_goal';
  }

  // Tap and go if very close and behind
  if (fieldPosition > 90 && scoreDifference < 0 && minute > 75) {
    return 'tap_and_go';
  }

  return fieldPosition > 45 ? 'kick_at_goal' : 'kick_to_corner';
}
