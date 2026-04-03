// ========================
// RETIREMENT & CAREER TWILIGHT ENGINE
// ========================

import { Player } from '@/types/game';
import { PlayerExtended } from '@/types/playerExtended';

// ---- Position-Based Peak & Decline Windows ----
// Returns { peakRange: [min, max], declineRange: [min, max] }
function getPositionAgingProfile(position: string): { peakRange: [number, number]; declineRange: [number, number] } {
  const pos = position.toLowerCase();

  // Front row — late peak, slow decline (set-piece mastery improves with age)
  if (pos.includes('prop') || pos.includes('hooker')) {
    return { peakRange: [28, 32], declineRange: [34, 38] };
  }
  // Locks — latest peak of all, physical but technique-heavy
  if (pos.includes('lock') || pos.includes('2nd row') || pos.includes('second row')) {
    return { peakRange: [28, 33], declineRange: [34, 38] };
  }
  // Back row — moderate, breakdown specialists can last longer
  if (pos.includes('flanker') || pos.includes('number 8') || pos.includes('no.8') || pos.includes('no 8')) {
    return { peakRange: [27, 31], declineRange: [33, 37] };
  }
  // Scrum-half — less physical, game management improves with age
  if (pos.includes('scrum') || pos.includes('9')) {
    return { peakRange: [27, 31], declineRange: [33, 37] };
  }
  // Fly-half — brain position, some peak very late (Sexton 35+, Carter 34)
  if (pos.includes('fly') || pos.includes('out-half') || pos.includes('outhalf') || pos.includes('10')) {
    return { peakRange: [27, 33], declineRange: [33, 39] };
  }
  // Centres — physical and fast-twitch, decline earlier but experience helps
  if (pos.includes('centre') || pos.includes('center') || pos.includes('12') || pos.includes('13')) {
    return { peakRange: [26, 30], declineRange: [31, 35] };
  }
  // Back three (wing, fullback) — most reliant on pace, earliest decline
  if (pos.includes('wing') || pos.includes('fullback') || pos.includes('full back') || pos.includes('14') || pos.includes('15') || pos.includes('11')) {
    return { peakRange: [25, 29], declineRange: [30, 34] };
  }

  // Default fallback
  return { peakRange: [27, 31], declineRange: [32, 36] };
}

// Generate a player's unique decline onset age (call once on player creation)
export function generateDeclineOnsetAge(position: string): { declineOnsetAge: number; peakAge: number } {
  const profile = getPositionAgingProfile(position);

  // Random within range, with a small chance of outlier (+1 or +2 beyond range)
  const outlierRoll = Math.random();
  let declineBonus = 0;
  if (outlierRoll < 0.05) declineBonus = 2; // 5% chance: late bloomer / sports science marvel
  else if (outlierRoll < 0.15) declineBonus = 1; // 10% chance: ages well

  const [decMin, decMax] = profile.declineRange;
  const declineOnsetAge = decMin + Math.floor(Math.random() * (decMax - decMin + 1)) + declineBonus;

  const [peakMin, peakMax] = profile.peakRange;
  const peakAge = peakMin + Math.floor(Math.random() * (peakMax - peakMin + 1));

  return { declineOnsetAge, peakAge };
}

// ---- Which attributes are "fast-twitch" / physical vs mental ----
const PHYSICAL_ATTRS = new Set(['pace', 'acceleration', 'stamina', 'agility', 'strength', 'jumping', 'speed', 'power']);
const MENTAL_ATTRS = new Set(['rugby_iq', 'decision_making', 'composure', 'leadership', 'kicking', 'vision', 'positioning', 'tactical_awareness']);

function isFastTwitchPosition(position: string): boolean {
  const pos = position.toLowerCase();
  return pos.includes('wing') || pos.includes('fullback') || pos.includes('full back') ||
    pos.includes('centre') || pos.includes('center');
}

// ---- Decline System ----
export function applyAgingDecline(player: Player, ext: PlayerExtended): { overallDelta: number; attributeDeclines: Record<string, number> } {
  const declineAge = ext.declineOnsetAge ?? 33; // fallback for legacy data

  if (player.age < declineAge) {
    // Before decline — mental attributes may still IMPROVE
    if (player.age >= (ext.peakAge || 28)) {
      const mentalGains: Record<string, number> = {};
      const attrs = player.attributes as unknown as Record<string, number>;
      for (const [key, value] of Object.entries(attrs)) {
        if (typeof value !== 'number') continue;
        if (MENTAL_ATTRS.has(key.toLowerCase()) && value < 95) {
          // Small annual mental improvement from experience
          const gain = Math.random() < 0.4 ? 1 : 0;
          if (gain > 0) mentalGains[key] = gain;
        }
      }
      return { overallDelta: 0, attributeDeclines: mentalGains }; // positive values = gains here
    }
    return { overallDelta: 0, attributeDeclines: {} };
  }

  // Years past decline onset determines severity
  const yearsPastDecline = player.age - declineAge;
  const baseDeclineRate = Math.min(yearsPastDecline + 1, 5); // 1-5 scale

  // Chronic injuries accelerate decline
  const chronicMod = ext.chronicInjuries.length > 0 ? 1.0 + (ext.chronicInjuries.length * 0.15) : 1.0;

  // Fast-twitch positions lose physical attributes faster
  const fastTwitch = isFastTwitchPosition(player.position);

  const attributeDeclines: Record<string, number> = {};
  const attrs = player.attributes as unknown as Record<string, number>;
  let totalDecline = 0;

  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value !== 'number') continue;

    const keyLower = key.toLowerCase();
    const isPhysical = PHYSICAL_ATTRS.has(keyLower);
    const isMental = MENTAL_ATTRS.has(keyLower);

    let rate: number;
    if (isPhysical) {
      // Physical decline — faster for backs, slower for forwards
      rate = Math.ceil(baseDeclineRate * (fastTwitch ? 1.5 : 1.0) * chronicMod);
      // Add randomness: some years you decline more, some less
      rate = Math.max(0, rate + (Math.random() < 0.3 ? 1 : Math.random() < 0.2 ? -1 : 0));
    } else if (isMental) {
      // Mental attributes hold steady or even improve slightly in early decline
      if (yearsPastDecline <= 2 && Math.random() < 0.3) {
        rate = -1; // slight improvement (experience)
      } else {
        rate = Math.max(0, Math.ceil(baseDeclineRate * 0.3));
      }
    } else {
      // Technical attributes — moderate decline
      rate = Math.ceil(baseDeclineRate * 0.6 * chronicMod);
    }

    if (rate > 0) {
      const decline = Math.min(value, rate);
      attributeDeclines[key] = decline;
      totalDecline += decline;
    } else if (rate < 0 && value < 95) {
      // Improvement (negative decline = gain)
      attributeDeclines[key] = rate; // negative number
    }
  }

  const avgDecline = Object.keys(attributeDeclines).length > 0
    ? Math.round(totalDecline / Math.max(1, Object.keys(attributeDeclines).filter(k => attributeDeclines[k] > 0).length))
    : 0;

  return { overallDelta: -avgDecline, attributeDeclines };
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
    teamMorale?: number;
  };
}

export function shouldTriggerRetirementChat(player: Player, ext: PlayerExtended): boolean {
  const declineAge = ext.declineOnsetAge ?? 33;
  // Only start retirement chats 3+ years after decline onset, or at 37+
  if (player.age < declineAge + 3 && player.age < 37) return false;
  if (player.age >= 38) return true;

  const declining = ext.rollingForm < 5.5;
  const injured = ext.chronicInjuries.length >= 2;
  const unhappy = ext.happiness < 40;
  const lowConfidence = ext.confidence < 35;

  return declining || injured || unhappy || lowConfidence || Math.random() < 0.15;
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
  revenueBoost: number;
  moraleBoost: number;
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
  coachRating: number;
  specialization: string;
}

export function calculateCoachConversion(player: Player, ext: PlayerExtended): CoachConversion {
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
