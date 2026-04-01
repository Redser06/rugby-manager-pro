import { PositionNumber } from '@/types/game';
import { MatchWeather, getWeatherEffects } from '@/types/matchEngine';

// ========================
// FATIGUE CURVES BY POSITION
// ========================

// Base fatigue rate per minute by position group
// Props tire fastest, backs tire slowest
const BASE_FATIGUE_RATES: Record<number, number> = {
  1: 1.4,   // Loosehead prop - scrummaging is brutal
  2: 1.2,   // Hooker
  3: 1.4,   // Tighthead prop
  4: 1.1,   // Lock
  5: 1.1,   // Lock
  6: 1.0,   // Blindside
  7: 1.15,  // Openside - does more work at breakdown
  8: 1.05,  // Number 8
  9: 0.85,  // Scrum-half
  10: 0.75, // Fly-half
  11: 0.7,  // Wing
  12: 0.9,  // Inside centre - more collisions
  13: 0.85, // Outside centre
  14: 0.7,  // Wing
  15: 0.8,  // Fullback
};

// After this minute, fatigue accelerates
const FATIGUE_ACCELERATION_MINUTE: Record<number, number> = {
  1: 50, 2: 55, 3: 50,  // Front row gasses out 50-55 min
  4: 60, 5: 60,          // Locks around 60
  6: 62, 7: 58, 8: 60,  // Back row
  9: 65, 10: 68,         // Halves
  11: 70, 12: 65, 13: 68, 14: 70, 15: 68, // Backs
};

interface FatigueContext {
  positionNumber: PositionNumber;
  currentMinute: number;
  endurance: number; // player's endurance/workRate stat 0-100
  age: number;
  weather: MatchWeather;
  staffFatigueResistance: number; // from S&C and nutritionist
  hasBeenSubbedOn: boolean;
  subbedOnMinute: number;
}

/**
 * Calculate fatigue increase for one minute of play
 * Returns fatigue delta (0-5ish per minute)
 */
export function calculateFatiguePerMinute(ctx: FatigueContext): number {
  const baseRate = BASE_FATIGUE_RATES[ctx.positionNumber] || 1.0;
  const accelMinute = FATIGUE_ACCELERATION_MINUTE[ctx.positionNumber] || 65;

  // Endurance reduces fatigue rate
  const enduranceModifier = 1 - (ctx.endurance / 200); // 0.5 to 1.0

  // Age: older players tire faster
  const ageModifier = ctx.age > 30 ? 1 + (ctx.age - 30) * 0.05 : 1.0;

  // After acceleration minute, fatigue ramps up
  const minuteModifier = ctx.currentMinute > accelMinute
    ? 1 + (ctx.currentMinute - accelMinute) * 0.04 // ramps up significantly
    : 1.0;

  // Weather
  const weatherEffects = getWeatherEffects(ctx.weather);
  const weatherModifier = weatherEffects.fatigueModifier;

  // Staff bonus
  const staffModifier = 1 - (ctx.staffFatigueResistance / 200); // up to 7.5% reduction

  // Fresh subs are fresh
  const subModifier = ctx.hasBeenSubbedOn ? 0.0 : 1.0; // no fatigue increase on sub minute

  if (ctx.hasBeenSubbedOn && ctx.currentMinute === ctx.subbedOnMinute) {
    return 0; // just came on
  }

  return baseRate * enduranceModifier * ageModifier * minuteModifier * weatherModifier * staffModifier;
}

/**
 * Get fatigue impact on player performance
 * Returns a multiplier 0.5 - 1.0
 */
export function getFatigueMultiplier(fatigue: number): number {
  if (fatigue < 30) return 1.0;
  if (fatigue < 50) return 1.0 - (fatigue - 30) * 0.005; // slight decline
  if (fatigue < 70) return 0.9 - (fatigue - 50) * 0.01;  // noticeable decline
  if (fatigue < 85) return 0.7 - (fatigue - 70) * 0.015;  // significant decline
  return 0.5; // gassed
}

/**
 * Should a substitution be triggered based on fatigue?
 */
export function shouldSubstitute(fatigue: number, positionNumber: PositionNumber, minute: number): boolean {
  // Front row: sub when hitting 65+ fatigue
  if ([1, 2, 3].includes(positionNumber) && fatigue > 65 && minute > 48) return true;
  // Locks: sub when hitting 70+
  if ([4, 5].includes(positionNumber) && fatigue > 70 && minute > 55) return true;
  // Back row: 70+
  if ([6, 7, 8].includes(positionNumber) && fatigue > 70 && minute > 55) return true;
  // Backs: 75+
  if (positionNumber >= 9 && fatigue > 75 && minute > 60) return true;

  return false;
}

/**
 * Calculate the "bomb squad" effect: fresh prop vs tired prop advantage
 */
export function getBombSquadAdvantage(freshPlayerFatigue: number, tiredPlayerFatigue: number): number {
  const diff = tiredPlayerFatigue - freshPlayerFatigue;
  if (diff < 20) return 0;
  if (diff < 40) return 0.1;
  if (diff < 60) return 0.25;
  return 0.4; // massive advantage when fresh vs gassed
}

/**
 * Get impact sub effectiveness
 * Impact subs perform at an amplified level for their first 15 minutes
 */
export function getImpactSubBoost(impactSubRating: number, minutesSinceEntry: number): number {
  if (minutesSinceEntry > 15) return 0;
  const baseBoost = impactSubRating / 100; // 0 to 1
  const decayFactor = 1 - (minutesSinceEntry / 15);
  return baseBoost * decayFactor * 0.15; // max 15% boost
}
