// ========================
// ACADEMY PIPELINE — RIVAL POACHING & GEOGRAPHY
// ========================

import { AcademyProspect, FeederClub } from './academy';
import { TEAM_LOCATIONS } from '@/data/teamLocations';

export interface AcademyPoachingAttempt {
  id: string;
  prospectId: string;
  prospectName: string;
  rivalTeamId: string;
  rivalTeamName: string;
  offeredSalary: number;
  week: number;
  status: 'pending' | 'retained' | 'lost';
  deadline: number; // weeks to respond
  prospectWillingnessToLeave: number; // 0-100
  reason: string;
  counterOfferOptions: CounterOfferOption[];
}

export interface CounterOfferOption {
  id: string;
  label: string;
  description: string;
  successChance: number; // 0-100
  salaryCost: number;
  effect: 'retain' | 'gamble' | 'lose_gracefully';
}

export interface GeographyFactor {
  prospectRegion: string;
  teamRegion: string;
  distance: 'local' | 'nearby' | 'far' | 'overseas';
  willingnessModifier: number; // -30 to +20 (negative = less likely to leave)
  description: string;
}

// Calculate geographic distance between prospect's origin and rival team
export function calculateGeographyFactor(
  prospectCountry: string,
  prospectRegion: string,
  rivalTeamId: string,
  rivalTeamCountry: string,
): GeographyFactor {
  const sameCountry = prospectCountry === rivalTeamCountry;

  if (!sameCountry) {
    return {
      prospectRegion,
      teamRegion: rivalTeamCountry,
      distance: 'overseas',
      willingnessModifier: -25,
      description: `Young player unlikely to move abroad at this stage. Family ties and comfort zone are strong.`,
    };
  }

  // Same country — check regional proximity
  const rivalLocation = TEAM_LOCATIONS.find(l => l.teamId === rivalTeamId.toLowerCase().replace(/\s+/g, '-'));

  // Regional mapping for closeness
  const REGION_PROXIMITY: Record<string, Record<string, 'local' | 'nearby' | 'far'>> = {
    'Leinster': { 'Dublin': 'local', 'Limerick': 'far', 'Belfast': 'far', 'Galway': 'far' },
    'Munster': { 'Dublin': 'far', 'Limerick': 'local', 'Cork': 'local', 'Belfast': 'far', 'Galway': 'nearby' },
    'Ulster': { 'Dublin': 'far', 'Belfast': 'local', 'Limerick': 'far', 'Galway': 'far' },
    'Connacht': { 'Dublin': 'far', 'Galway': 'local', 'Limerick': 'nearby', 'Belfast': 'far' },
    'South Wales': { 'Cardiff': 'local', 'Swansea': 'nearby', 'Newport': 'local' },
    'West Wales': { 'Llanelli': 'local', 'Swansea': 'nearby', 'Cardiff': 'nearby' },
  };

  const proximityMap = REGION_PROXIMITY[prospectRegion];
  const city = rivalLocation?.city || '';
  const distance = proximityMap?.[city] || (sameCountry ? 'nearby' : 'far');

  const modifiers: Record<string, number> = {
    local: -20, // very unlikely to leave — they're already near home
    nearby: -10,
    far: 5,    // might consider it for opportunity
  };

  const descriptions: Record<string, string> = {
    local: `${prospectRegion} lad — this is his backyard. Very unlikely to want to leave home.`,
    nearby: `Not far from home. Would need a compelling reason to move.`,
    far: `A big move from ${prospectRegion}. Might be tempted by the opportunity but homesickness is a factor.`,
  };

  return {
    prospectRegion,
    teamRegion: city || rivalTeamCountry,
    distance,
    willingnessModifier: modifiers[distance],
    description: descriptions[distance],
  };
}

// Generate a poaching attempt from a rival club
export function generatePoachingAttempt(
  prospect: AcademyProspect,
  prospectCountry: string,
  rivalTeamId: string,
  rivalTeamName: string,
  rivalReputation: number,
  currentWeek: number,
): AcademyPoachingAttempt | null {
  // Only target promising prospects
  if (prospect.starRating < 3) return null;
  if (prospect.age < 17) return null;

  // Higher star rating = more likely to be targeted
  let poachChance = 0.02 * prospect.starRating;
  if (prospect.isGenerationalTalent) poachChance += 0.15;
  if (prospect.currentAbility > 55) poachChance += 0.1;

  // Rival reputation matters
  poachChance *= (rivalReputation / 80);

  if (Math.random() > poachChance) return null;

  const geography = calculateGeographyFactor(
    prospectCountry,
    prospect.feederSource,
    rivalTeamId,
    prospectCountry, // assume same country rivals for now
  );

  // Base willingness to leave
  let willingness = 40;
  willingness += geography.willingnessModifier;

  // Young players from rural areas might want to go to big city
  if (prospect.age >= 18 && geography.distance === 'far') willingness += 10;

  // High attitude = more loyal
  if (prospect.attitude === 'excellent') willingness -= 15;
  if (prospect.attitude === 'poor') willingness += 15;

  // Coach attention keeps them
  if (prospect.coachAttention > 70) willingness -= 20;
  if (prospect.coachAttention < 30) willingness += 15;

  willingness = Math.max(5, Math.min(95, willingness));

  // If willingness is very low, don't generate the event
  if (willingness < 15) return null;

  const offeredSalary = 30000 + Math.floor(prospect.starRating * 15000) + Math.floor(Math.random() * 20000);

  const counterOfferOptions: CounterOfferOption[] = [
    {
      id: 'match_offer',
      label: 'Match the offer',
      description: `Offer a professional contract now to secure his future`,
      successChance: Math.min(90, 70 + (prospect.coachAttention > 60 ? 15 : 0)),
      salaryCost: offeredSalary,
      effect: 'retain',
    },
    {
      id: 'promise_pathway',
      label: 'Promise first-team pathway',
      description: `Guarantee meaningful senior minutes next season`,
      successChance: Math.min(80, 50 + (prospect.attitude === 'excellent' ? 20 : prospect.attitude === 'good' ? 10 : 0)),
      salaryCost: Math.round(offeredSalary * 0.6),
      effect: 'retain',
    },
    {
      id: 'let_go',
      label: 'Wish him well',
      description: `Accept the loss and focus on other prospects`,
      successChance: 0,
      salaryCost: 0,
      effect: 'lose_gracefully',
    },
    {
      id: 'hardball',
      label: 'Play hardball',
      description: `Remind him he owes his development to this club. Risky — could backfire.`,
      successChance: prospect.attitude === 'excellent' ? 60 : prospect.attitude === 'poor' ? 10 : 35,
      salaryCost: 0,
      effect: 'gamble',
    },
  ];

  const reason = willingness > 60
    ? `${rivalTeamName} are offering more money and a bigger stage. The player is seriously considering it.`
    : `${rivalTeamName} have made an approach, but the player is settled here. A small gesture should keep him.`;

  return {
    id: Math.random().toString(36).substring(2, 9),
    prospectId: prospect.id,
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
    rivalTeamId,
    rivalTeamName,
    offeredSalary,
    week: currentWeek,
    status: 'pending',
    deadline: 3,
    prospectWillingnessToLeave: willingness,
    reason,
    counterOfferOptions,
  };
}

// Process a counter-offer response
export function resolvePoachingAttempt(
  attempt: AcademyPoachingAttempt,
  chosenOptionId: string,
): { retained: boolean; message: string } {
  const option = attempt.counterOfferOptions.find(o => o.id === chosenOptionId);
  if (!option) return { retained: false, message: 'Invalid option.' };

  if (option.effect === 'lose_gracefully') {
    return {
      retained: false,
      message: `${attempt.prospectName} has departed for ${attempt.rivalTeamName}. You wished him well and the relationship remains positive.`,
    };
  }

  // Roll against success chance, modified by willingness
  const adjustedChance = option.successChance - (attempt.prospectWillingnessToLeave > 60 ? 15 : 0);
  const roll = Math.random() * 100;

  if (roll < adjustedChance) {
    return {
      retained: true,
      message: option.effect === 'gamble'
        ? `${attempt.prospectName} was moved by your words. He's staying — for now. Keep investing in him.`
        : `${attempt.prospectName} has signed a new contract and committed his future to the club!`,
    };
  }

  return {
    retained: false,
    message: option.effect === 'gamble'
      ? `${attempt.prospectName} felt pressured and resented the approach. He's leaving for ${attempt.rivalTeamName}.`
      : `Despite your best efforts, ${attempt.prospectName} has been lured away by ${attempt.rivalTeamName}. The pull was too strong.`,
  };
}

// Check which academy prospects should be offered contracts early
export function identifyAtRiskProspects(
  prospects: AcademyProspect[],
  teamReputation: number,
): { prospect: AcademyProspect; riskLevel: 'high' | 'medium' | 'low'; recommendation: string }[] {
  return prospects
    .filter(p => p.age >= 17 && p.starRating >= 3)
    .map(prospect => {
      let riskLevel: 'high' | 'medium' | 'low' = 'low';

      if (prospect.starRating >= 4 && prospect.coachAttention < 50) riskLevel = 'high';
      else if (prospect.isGenerationalTalent) riskLevel = 'high';
      else if (prospect.starRating >= 4 && prospect.age >= 18) riskLevel = 'medium';
      else if (prospect.attitude === 'poor') riskLevel = 'medium';

      const recommendations: Record<string, string> = {
        high: `Offer a contract immediately. ${prospect.firstName} is attracting attention and could be poached.`,
        medium: `Monitor closely. Consider offering terms before end of season.`,
        low: `No immediate risk. Continue development in the academy.`,
      };

      return {
        prospect,
        riskLevel,
        recommendation: recommendations[riskLevel],
      };
    })
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.riskLevel] - order[b.riskLevel];
    });
}
