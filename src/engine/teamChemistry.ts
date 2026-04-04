// ========================
// TEAM CHEMISTRY & CULTURAL FIT
// ========================

import { Player, Team } from '@/types/game';
import { PlayerExtended } from '@/types/playerExtended';

export interface TeamChemistryState {
  overallChemistry: number; // 0-100
  recentSigningsDisruption: number; // 0-100 (higher = more disruption)
  clubVsCountryTension: number; // 0-100
  culturalBalance: CulturalBalance;
  chemistryBonuses: ChemistryBonus[];
  events: ChemistryEvent[];
}

export interface CulturalBalance {
  homegrownCount: number;
  foreignCount: number;
  homegrownPercentage: number;
  dominantNationalities: { nationality: string; count: number }[];
  superstarPresence: SuperstarImpact[];
}

export interface SuperstarImpact {
  playerId: string;
  playerName: string;
  nationality: string;
  overall: number;
  internationalCaps: number;
  impactType: 'positive_culture' | 'neutral' | 'negative_disruption';
  impactDescription: string;
  cultureBonus: number; // -20 to +20
}

export interface ChemistryBonus {
  type: 'nationality' | 'province' | 'former_teammates' | 'mentor_protege' | 'superstar_lift';
  playerIds: string[];
  bonusValue: number; // percentage boost
  description: string;
}

export interface ChemistryEvent {
  id: string;
  week: number;
  type: 'integration_complete' | 'club_country_tension' | 'superstar_boost' | 'team_disruption' | 'bonding_session' | 'dressing_room_unrest';
  message: string;
  moraleImpact: number;
  affectedPlayerIds: string[];
}

// Calculate integration time for a new signing
export function calculateIntegrationWeeks(
  player: Player,
  targetTeam: Team,
  isFromSameCountry: boolean,
  isFromSameLeague: boolean,
  playerOverall: number,
  teamSigningsThisWindow: number,
): number {
  let baseWeeks = 6; // default 4-6 weeks

  // Same country = faster integration
  if (isFromSameCountry) baseWeeks -= 2;
  // Same league = knows the structures
  if (isFromSameLeague) baseWeeks -= 1;

  // Star players adapt faster (or slower if ego is high)
  if (playerOverall >= 85) baseWeeks -= 1;

  // Too many signings = slower for everyone
  if (teamSigningsThisWindow > 3) baseWeeks += 2;
  if (teamSigningsThisWindow > 5) baseWeeks += 2;

  // Young players take longer (unfamiliar with professional setup)
  if (player.age <= 22) baseWeeks += 1;

  return Math.max(2, Math.min(10, baseWeeks));
}

// Calculate full team chemistry
export function calculateTeamChemistry(
  players: Player[],
  extendedData: Record<string, PlayerExtended>,
  teamCountry: string,
  recentSigningsCount: number,
): TeamChemistryState {
  let chemistry = 70; // base

  // Count nationalities
  const nationalityCounts: Record<string, number> = {};
  let homegrownCount = 0;
  let foreignCount = 0;
  const integrating: string[] = [];

  players.forEach(p => {
    const nat = p.nationality;
    nationalityCounts[nat] = (nationalityCounts[nat] || 0) + 1;
    if (nat === teamCountry || isHomegrown(nat, teamCountry)) {
      homegrownCount++;
    } else {
      foreignCount++;
    }

    const ext = extendedData[p.id];
    if (ext?.isNewSigning && ext.integrationWeeks > 0) {
      integrating.push(p.id);
    }
  });

  // Nationality chemistry bonuses
  const chemistryBonuses: ChemistryBonus[] = [];
  Object.entries(nationalityCounts).forEach(([nat, count]) => {
    if (count >= 3) {
      chemistryBonuses.push({
        type: 'nationality',
        playerIds: players.filter(p => p.nationality === nat).map(p => p.id),
        bonusValue: Math.min(8, count * 2),
        description: `${count} ${nat} players — shared language and culture`,
      });
      chemistry += Math.min(5, count);
    }
  });

  // Homegrown balance bonus
  const homegrownPct = players.length > 0 ? (homegrownCount / players.length) * 100 : 0;
  if (homegrownPct >= 60) {
    chemistry += 10;
    chemistryBonuses.push({
      type: 'province',
      playerIds: players.filter(p => isHomegrown(p.nationality, teamCountry)).map(p => p.id),
      bonusValue: 10,
      description: 'Strong homegrown core — shared identity and pride',
    });
  } else if (homegrownPct < 30) {
    chemistry -= 10;
  }

  // New signings disruption
  const disruptionFromSignings = Math.min(30, recentSigningsCount * 5 + integrating.length * 3);
  chemistry -= disruptionFromSignings;

  // Superstar impact assessment
  const superstarImpacts: SuperstarImpact[] = [];
  players.forEach(p => {
    if (p.overall >= 82) {
      const ext = extendedData[p.id];
      const caps = ext?.internationalCaps || 0;
      const isForeign = !isHomegrown(p.nationality, teamCountry);

      let impactType: SuperstarImpact['impactType'] = 'neutral';
      let cultureBonus = 0;
      let desc = '';

      if (p.overall >= 87 && caps >= 30) {
        // True international superstar
        if (isForeign) {
          // Foreign superstar — can be hugely positive
          impactType = 'positive_culture';
          cultureBonus = 12;
          desc = `World-class presence. Brings international winning mentality, raises standards across the squad.`;
          chemistry += 8;
        } else {
          impactType = 'positive_culture';
          cultureBonus = 15;
          desc = `Homegrown legend. Inspirational leader who embodies the club's values.`;
          chemistry += 10;
        }
      } else if (p.overall >= 82 && isForeign && caps < 15) {
        // Decent foreign player but not a superstar — less cultural impact
        impactType = 'neutral';
        cultureBonus = -2;
        desc = `Solid player from abroad. Not yet established enough internationally to add cultural lift — a homegrown option might integrate better.`;
        chemistry -= 2;
      } else if (ext?.ego && ext.ego > 80 && p.overall < 85) {
        // Big ego, not the talent to back it up
        impactType = 'negative_disruption';
        cultureBonus = -8;
        desc = `High ego relative to ability. Can create dressing room tension.`;
        chemistry -= 5;
      }

      if (impactType !== 'neutral' || cultureBonus !== 0) {
        superstarImpacts.push({
          playerId: p.id,
          playerName: `${p.firstName} ${p.lastName}`,
          nationality: p.nationality,
          overall: p.overall,
          internationalCaps: caps,
          impactType,
          impactDescription: desc,
          cultureBonus,
        });
      }
    }
  });

  // Club vs Country tension (mid/late season, post-international windows)
  const clubVsCountryTension = calculateClubVsCountryTension(players, extendedData);

  chemistry = Math.max(10, Math.min(100, chemistry));

  const dominantNationalities = Object.entries(nationalityCounts)
    .map(([nationality, count]) => ({ nationality, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    overallChemistry: chemistry,
    recentSigningsDisruption: disruptionFromSignings,
    clubVsCountryTension,
    culturalBalance: {
      homegrownCount,
      foreignCount,
      homegrownPercentage: Math.round(homegrownPct),
      dominantNationalities,
      superstarPresence: superstarImpacts,
    },
    chemistryBonuses,
    events: [],
  };
}

function calculateClubVsCountryTension(
  players: Player[],
  extendedData: Record<string, PlayerExtended>,
): number {
  let tension = 0;

  players.forEach(p => {
    const ext = extendedData[p.id];
    if (!ext) return;

    const caps = ext.internationalCaps || 0;
    if (caps > 20) {
      // Senior internationals may have split focus
      tension += 3;
      // Fatigue from international duty
      if (p.fitness < 70) tension += 2;
    }
  });

  return Math.min(100, tension);
}

function isHomegrown(nationality: string, teamCountry: string): boolean {
  // Irish provinces = Irish players are homegrown
  const countryGroups: Record<string, string[]> = {
    Ireland: ['Irish', 'Ireland'],
    Wales: ['Welsh', 'Wales'],
    Scotland: ['Scottish', 'Scotland'],
    England: ['English', 'England'],
    France: ['French', 'France'],
    Italy: ['Italian', 'Italy'],
    'New Zealand': ['New Zealander', 'New Zealand'],
    'South Africa': ['South African', 'South Africa'],
    Australia: ['Australian', 'Australia'],
  };

  const group = countryGroups[teamCountry];
  return group ? group.includes(nationality) : nationality === teamCountry;
}

// Generate weekly chemistry events
export function generateChemistryEvent(
  chemistry: TeamChemistryState,
  currentWeek: number,
  players: Player[],
): ChemistryEvent | null {
  const roll = Math.random();

  if (chemistry.overallChemistry < 40 && roll < 0.3) {
    return {
      id: Math.random().toString(36).substring(2, 9),
      week: currentWeek,
      type: 'dressing_room_unrest',
      message: 'Senior players have raised concerns about squad harmony. Too many changes and not enough cohesion on the training pitch.',
      moraleImpact: -10,
      affectedPlayerIds: players.filter(p => p.overall >= 75).map(p => p.id),
    };
  }

  if (chemistry.clubVsCountryTension > 60 && roll < 0.25) {
    const internationals = players.filter(p => p.overall >= 78);
    return {
      id: Math.random().toString(36).substring(2, 9),
      week: currentWeek,
      type: 'club_country_tension',
      message: 'Players returning from international duty seem mentally distracted. Training intensity has dropped.',
      moraleImpact: -5,
      affectedPlayerIds: internationals.map(p => p.id),
    };
  }

  if (chemistry.culturalBalance.superstarPresence.some(s => s.impactType === 'positive_culture') && roll < 0.15) {
    const star = chemistry.culturalBalance.superstarPresence.find(s => s.impactType === 'positive_culture')!;
    return {
      id: Math.random().toString(36).substring(2, 9),
      week: currentWeek,
      type: 'superstar_boost',
      message: `${star.playerName} led an extra training session for the younger players. His standards are rubbing off on the squad.`,
      moraleImpact: 8,
      affectedPlayerIds: players.filter(p => p.age <= 24).map(p => p.id),
    };
  }

  if (chemistry.overallChemistry > 80 && roll < 0.1) {
    return {
      id: Math.random().toString(36).substring(2, 9),
      week: currentWeek,
      type: 'bonding_session',
      message: 'The squad organised a social event off the pitch. Team spirit is excellent.',
      moraleImpact: 5,
      affectedPlayerIds: players.map(p => p.id),
    };
  }

  return null;
}

// Calculate match performance modifier from chemistry
export function getChemistryMatchModifier(chemistry: number): number {
  // -5% to +5% on team performance
  if (chemistry >= 90) return 0.05;
  if (chemistry >= 75) return 0.03;
  if (chemistry >= 60) return 0.01;
  if (chemistry >= 40) return -0.02;
  return -0.05;
}
