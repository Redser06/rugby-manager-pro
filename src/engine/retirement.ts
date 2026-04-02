// ========================
// RETIREMENT & CAREER TWILIGHT ENGINE
// ========================

import { Player } from '@/types/game';
import { PlayerExtended, PlayerChat, PlayerChatResponse, PlayerChatTopic } from '@/types/playerExtended';

// ---- Decline System ----
export function applyAgingDecline(player: Player, ext: PlayerExtended): { overallDelta: number; attributeDeclines: Record<string, number> } {
  if (player.age < 31) return { overallDelta: 0, attributeDeclines: {} };
  
  // Base decline rate increases with age
  const declineRate = player.age >= 36 ? 4 : player.age >= 34 ? 3 : player.age >= 32 ? 2 : 1;
  
  // Position-specific: props and locks can play longer, backs decline faster
  const positionModifier = ['Loosehead Prop', 'Tighthead Prop', 'Hooker', 'Lock'].some(p => 
    player.position.includes(p.split(' ')[0])
  ) ? 0.7 : 1.0;
  
  // Chronic injuries accelerate decline
  const chronicMod = ext.chronicInjuries.length > 0 ? 1.3 : 1.0;
  
  const adjustedRate = Math.round(declineRate * positionModifier * chronicMod);
  
  // Apply decline to all numeric attributes proportionally
  const attributeDeclines: Record<string, number> = {};
  const attrs = player.attributes as Record<string, number>;
  
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value !== 'number') continue;
    // Physical attributes decline faster (heuristic: shorter names tend to be physical)
    const isPhysical = ['pace', 'acceleration', 'stamina', 'agility'].includes(key.toLowerCase());
    const rate = isPhysical ? Math.ceil(adjustedRate * 1.3) : Math.ceil(adjustedRate * 0.7);
    attributeDeclines[key] = Math.min(value, rate);
  }
  
  // Rugby IQ and kicking actually improve or hold steady
  // (no decline for these)
  
  return { overallDelta: -adjustedRate, attributeDeclines };
}

// ---- Retirement Conversations ----
export type RetirementDecision = 'retire' | 'one_more_season' | 'coaching_role';

export interface RetirementChat {
  playerId: string;
  playerName: string;
  age: number;
  caps: number;
  message: string;
  options: RetirementOption[];
}

export interface RetirementOption {
  id: string;
  text: string;
  decision: RetirementDecision;
  effect: {
    happiness?: number;
    confidence?: number;
    teamMorale?: number; // affects whole squad
  };
}

export function shouldTriggerRetirementChat(player: Player, ext: PlayerExtended): boolean {
  if (player.age < 33) return false;
  if (player.age >= 37) return true; // always discuss at 37+
  
  // Factors that trigger the conversation
  const declining = ext.rollingForm < 5.5;
  const injured = ext.chronicInjuries.length >= 2;
  const unhappy = ext.happiness < 40;
  const lowConfidence = ext.confidence < 35;
  
  return declining || injured || unhappy || lowConfidence || Math.random() < 0.2;
}

export function generateRetirementChat(player: Player, ext: PlayerExtended): RetirementChat {
  const isLegend = ext.caps >= 150;
  const isInjuryDriven = ext.chronicInjuries.length >= 2;
  const isFormDriven = ext.rollingForm < 5;
  
  let message: string;
  if (isLegend) {
    message = `Boss, I've had a wonderful career here. ${ext.caps} caps is something I'm incredibly proud of. But I need to be honest — I'm thinking about hanging up the boots. What do you think?`;
  } else if (isInjuryDriven) {
    message = `Gaffer, my body is telling me it might be time. The injuries are piling up and I'm not sure I can keep going at this level. I wanted to have a chat about my future.`;
  } else if (isFormDriven) {
    message = `Coach, I know my form hasn't been what it was. I don't want to be someone who outstays their welcome. Should I start thinking about the next chapter?`;
  } else {
    message = `I've been thinking a lot lately. I've got a season or two left in me, but I want to make sure we're on the same page about my future.`;
  }
  
  const options: RetirementOption[] = [
    {
      id: 'one_more',
      text: `I still need you. One more season — let's go out on a high.`,
      decision: 'one_more_season',
      effect: { happiness: 20, confidence: 15, teamMorale: 5 },
    },
    {
      id: 'retire_hero',
      text: `You've been incredible for this club. Let's plan a proper send-off — testimonial match and all.`,
      decision: 'retire',
      effect: { happiness: 15, confidence: 10, teamMorale: 10 },
    },
    {
      id: 'coaching',
      text: `Have you ever thought about coaching? I'd love to have you on the staff when you're ready.`,
      decision: 'coaching_role',
      effect: { happiness: 25, confidence: 20, teamMorale: 8 },
    },
  ];
  
  // Add a firm option for non-legends
  if (!isLegend) {
    options.push({
      id: 'move_on',
      text: `I think it's time. Thank you for everything, but we need to look to the future.`,
      decision: 'retire',
      effect: { happiness: -10, confidence: -15, teamMorale: -5 },
    });
  }
  
  return {
    playerId: player.id,
    playerName: `${player.firstName} ${player.lastName}`,
    age: player.age,
    caps: ext.caps,
    message,
    options,
  };
}

// ---- Testimonial Match ----
export interface TestimonialEvent {
  playerId: string;
  playerName: string;
  caps: number;
  revenueBoost: number; // extra matchday revenue
  moraleBoost: number; // squad-wide morale boost
  fanEngagementBoost: number;
}

export function generateTestimonialEvent(player: Player, ext: PlayerExtended): TestimonialEvent {
  const revenueMultiplier = ext.caps >= 200 ? 3 : ext.caps >= 150 ? 2 : 1.5;
  
  return {
    playerId: player.id,
    playerName: `${player.firstName} ${player.lastName}`,
    caps: ext.caps,
    revenueBoost: Math.round(50000 * revenueMultiplier),
    moraleBoost: ext.leadership >= 80 ? 15 : 10,
    fanEngagementBoost: ext.caps >= 200 ? 25 : 15,
  };
}

// ---- Coaching Conversion ----
export interface CoachConversion {
  playerId: string;
  playerName: string;
  coachRole: string;
  coachRating: number; // based on player's attributes and leadership
  specialization: string;
}

export function calculateCoachConversion(player: Player, ext: PlayerExtended): CoachConversion {
  // Role based on what they were best at
  let coachRole: string;
  let specialization: string;
  
  const pos = player.position.toLowerCase();
  if (pos.includes('prop') || pos.includes('hooker') || pos.includes('lock')) {
    coachRole = 'Forwards Coach';
    specialization = pos.includes('prop') || pos.includes('hooker') ? 'Scrum' : 'Lineout';
  } else if (pos.includes('half') || pos.includes('fly')) {
    coachRole = 'Attack Coach';
    specialization = 'Backs Play';
  } else if (pos.includes('flanker') || pos.includes('8')) {
    coachRole = 'Defence Coach';
    specialization = 'Breakdown';
  } else {
    coachRole = 'Skills Coach';
    specialization = 'Back Three';
  }
  
  // Rating based on leadership + composure + experience
  const coachRating = Math.min(100, Math.round(
    ext.leadership * 0.4 + ext.composure * 0.2 + Math.min(ext.caps, 200) * 0.1 + (player.overall * 0.3)
  ));
  
  return {
    playerId: player.id,
    playerName: `${player.firstName} ${player.lastName}`,
    coachRole,
    coachRating,
    specialization,
  };
}
