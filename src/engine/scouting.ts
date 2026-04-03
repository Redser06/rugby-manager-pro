// ========================
// SCOUTING & OPPOSITION ANALYSIS ENGINE
// ========================

import { Team, Player } from '@/types/game';
import { StaffMember } from '@/types/staff';
import { ScoutingReport } from '@/types/staff';

// ========================
// PRE-MATCH SCOUTING
// ========================

export interface DetailedScoutingReport extends ScoutingReport {
  // Opponent stats analysis
  opponentFormLast5?: string; // e.g. 'WWLWL'
  averagePointsFor?: number;
  averagePointsAgainst?: number;
  
  // Tactical tendencies (revealed by quality)
  maulFrequency?: 'low' | 'medium' | 'high'; // How often do they maul?
  contestableKickRate?: number; // % of kicks that are contestable
  targetChannel?: string; // e.g. '10 channel', '13 channel', 'blindside'
  lineoutMaulPercentage?: number; // % of lineouts that go to maul
  scrumPenaltyRate?: number; // penalties conceded at scrum per match
  
  // Breakdown
  ruckSpeed?: 'fast' | 'average' | 'slow';
  jackallThreat?: 'low' | 'medium' | 'high';
  
  // Key threats
  topScorer?: { name: string; tries: number; recentGames: number };
  dangerPlayer?: { name: string; position: string; threat: string };
  
  // Weaknesses to exploit
  weaknesses: string[];
  
  // Your recommended focus areas
  suggestedDefensiveFocus?: DefensiveFocusArea[];
}

export interface DefensiveFocusArea {
  id: string;
  area: 'left_wing' | 'right_wing' | '10_channel' | '12_channel' | '13_channel' | 'blindside' | 'midfield' | 'back_field';
  instruction: string;
  targetPlayer?: string;
  intensity: 'normal' | 'double_team' | 'rush' | 'hold';
}

export interface MatchPrepPlan {
  scoutingReport?: DetailedScoutingReport;
  defensiveFocusAreas: DefensiveFocusArea[];
  setPiecePriorities: string[];
  kickingPlan: string;
}

// Generate a detailed scouting report for an opponent
export function generateDetailedScoutingReport(
  opponent: Team,
  analystQuality: number, // 0-100
): DetailedScoutingReport {
  const q = analystQuality;
  
  // Calculate opponent tendencies from their tactics and players
  const tactics = opponent.tactics;
  const forwards = opponent.players.filter(p => p.positionNumber <= 8);
  const backs = opponent.players.filter(p => p.positionNumber >= 9);
  
  // Average forward strength determines maul tendency
  const fwdStrength = forwards.reduce((s, p) => s + p.overall, 0) / Math.max(1, forwards.length);
  const backStrength = backs.reduce((s, p) => s + p.overall, 0) / Math.max(1, backs.length);
  
  // Find top scorer
  const topPlayer = [...opponent.players].sort((a, b) => b.overall - a.overall)[0];
  const dangerBack = backs.sort((a, b) => b.overall - a.overall)[0];
  
  // Generate weaknesses based on squad analysis
  const weaknesses: string[] = [];
  if (q > 40) {
    if (fwdStrength < 65) weaknesses.push('Forward pack lacks physicality — target the scrum');
    if (backStrength < 65) weaknesses.push('Backline lacks pace — kick in behind');
    if (tactics.defenseStyle === 'rush') weaknesses.push('Rush defence leaves gaps in the wide channels');
    if (tactics.defenseStyle === 'drift') weaknesses.push('Drift defence is slow to cover the short side');
    if (tactics.tempo === 'slow') weaknesses.push('Slow tempo — press them with quick ruck ball');
    if (tactics.riskLevel === 'high') weaknesses.push('High-risk style leads to turnovers — be patient');
    
    // Position-specific weaknesses
    const loosehead = opponent.players.find(p => p.positionNumber === 1);
    const tighthead = opponent.players.find(p => p.positionNumber === 3);
    if (loosehead && loosehead.overall < 65) weaknesses.push(`Loosehead prop (${loosehead.firstName} ${loosehead.lastName}) is a scrum target`);
    if (tighthead && tighthead.overall < 65) weaknesses.push(`Tighthead prop (${tighthead.firstName} ${tighthead.lastName}) vulnerable at scrum time`);
  }
  
  // Determine kick approach
  const kickingPatterns = q > 60 ? (
    tactics.attackStyle === 'kicking' ? 'Heavy kicking game — expect 50:22 attempts and contestable kicks'
    : tactics.attackStyle === 'direct' ? 'Direct approach — occasional box kicks, exit strategy via 22'
    : tactics.attackStyle === 'expansive' ? 'Minimal kicking — prefer to keep ball in hand'
    : 'Structured kicking — tactical kicks to corners, exit via lineout'
  ) : undefined;

  const report: DetailedScoutingReport = {
    teamId: opponent.id,
    teamName: opponent.name,
    quality: q,
    generatedAt: new Date(),
    weaknesses,
    
    // Basic info (always revealed)
    scrumTendency: q > 25 ? (
      tactics.scrumFocus === 'power' ? 'Power-focused, drive for penalties'
      : tactics.scrumFocus === 'speed' ? 'Quick ball, hooker strike, get it out fast'
      : 'Balanced approach, solid but not dominant'
    ) : undefined,
    
    // Form (q > 20)
    opponentFormLast5: q > 20 ? generateFormString() : undefined,
    
    // Primary attack (q > 30)
    primaryAttackSide: q > 30 ? (
      tactics.attackStyle === 'direct' ? 'balanced'
      : Math.random() > 0.5 ? 'left' : 'right'
    ) : undefined,
    
    // Set piece strength (q > 35)
    setPieceStrength: q > 35 ? (
      fwdStrength > 75 ? 'strong' : fwdStrength > 60 ? 'average' : 'weak'
    ) : undefined,
    
    // Maul frequency (q > 40)
    maulFrequency: q > 40 ? (
      fwdStrength > 75 ? 'high' : fwdStrength > 60 ? 'medium' : 'low'
    ) : undefined,
    
    // Key player (q > 45)
    keyPlayer: q > 45 ? `${topPlayer.firstName} ${topPlayer.lastName} (${topPlayer.position}) — OVR ${topPlayer.overall}` : undefined,
    
    // Lineout calls (q > 50)
    lineoutCalls: q > 50 ? generateLineoutCalls(q) : undefined,
    lineoutMaulPercentage: q > 50 ? (fwdStrength > 70 ? 45 + Math.floor(Math.random() * 20) : 20 + Math.floor(Math.random() * 20)) : undefined,
    
    // Contestable kick rate (q > 55)
    contestableKickRate: q > 55 ? (
      tactics.attackStyle === 'kicking' ? 40 + Math.floor(Math.random() * 20)
      : 15 + Math.floor(Math.random() * 15)
    ) : undefined,
    
    // Target channel (q > 55)
    targetChannel: q > 55 ? (
      tactics.attackStyle === 'direct' ? '12 channel — crash ball and offload' 
      : tactics.attackStyle === 'expansive' ? '13 channel — wide plays to isolate outside backs'
      : '10 channel — structured phase play'
    ) : undefined,
    
    // Kicking patterns (q > 60)
    kickingPatterns,
    
    // Ruck analysis (q > 65)
    ruckSpeed: q > 65 ? (
      tactics.tempo === 'fast' ? 'fast' : tactics.tempo === 'slow' ? 'slow' : 'average'
    ) : undefined,
    jackallThreat: q > 65 ? (
      opponent.players.some(p => p.positionNumber === 7 && p.overall > 75) ? 'high' : 'medium'
    ) : undefined,
    
    // Danger player detail (q > 70)
    dangerPlayer: q > 70 && dangerBack ? {
      name: `${dangerBack.firstName} ${dangerBack.lastName}`,
      position: dangerBack.position,
      threat: dangerBack.overall > 80 ? 'World class — needs constant attention'
        : dangerBack.overall > 70 ? 'Quality player — capable of match-winning moments'
        : 'Solid but containable with good organisation'
    } : undefined,
    
    // Defensive weakness (q > 70)
    defensiveWeakness: q > 70 ? (
      tactics.defenseStyle === 'rush' ? 'Rush defence leaves space behind — chip kicks and inside balls effective'
      : tactics.defenseStyle === 'blitz' ? 'Blitz defence commits hard — dummy runners and wrap plays work'
      : tactics.defenseStyle === 'drift' ? 'Drift defence can be beaten with tempo changes and cut-back plays'
      : 'Standard umbrella — probe both edges and look for mismatches'
    ) : undefined,

    // Scrum penalties (q > 75)
    scrumPenaltyRate: q > 75 ? (fwdStrength < 65 ? 2.5 + Math.random() * 1.5 : 0.5 + Math.random() * 1.5) : undefined,
    
    // Suggested focus areas based on analysis
    suggestedDefensiveFocus: q > 50 ? generateSuggestedFocusAreas(opponent, q) : undefined,
  };
  
  return report;
}

function generateFormString(): string {
  return Array.from({ length: 5 }, () => {
    const r = Math.random();
    return r > 0.55 ? 'W' : r > 0.25 ? 'L' : 'D';
  }).join('');
}

function generateLineoutCalls(quality: number): string[] {
  const allCalls = [
    'Front lift — short throw to pod 1',
    'Middle drive — maul from centre',
    'Back peel — hooker to tail',
    'Dummy pod 1 — ball over the top',
    'Quick throw — skip the lineout',
    'Front steal set — contest their ball',
  ];
  const count = Math.min(allCalls.length, Math.floor(quality / 20) + 1);
  return allCalls.slice(0, count);
}

function generateSuggestedFocusAreas(opponent: Team, quality: number): DefensiveFocusArea[] {
  const areas: DefensiveFocusArea[] = [];
  
  // Find their most dangerous back
  const leftWing = opponent.players.find(p => p.positionNumber === 11);
  const rightWing = opponent.players.find(p => p.positionNumber === 14);
  const flyHalf = opponent.players.find(p => p.positionNumber === 10);
  
  if (leftWing && leftWing.overall > 75) {
    areas.push({
      id: Math.random().toString(36).substring(2, 7),
      area: 'left_wing',
      instruction: `Double-team ${leftWing.firstName} ${leftWing.lastName} — high try threat`,
      targetPlayer: `${leftWing.firstName} ${leftWing.lastName}`,
      intensity: 'double_team',
    });
  }
  
  if (rightWing && rightWing.overall > 75) {
    areas.push({
      id: Math.random().toString(36).substring(2, 7),
      area: 'right_wing',
      instruction: `Contain ${rightWing.firstName} ${rightWing.lastName} — don't let him get outside`,
      targetPlayer: `${rightWing.firstName} ${rightWing.lastName}`,
      intensity: 'rush',
    });
  }
  
  if (flyHalf && flyHalf.overall > 78 && quality > 60) {
    areas.push({
      id: Math.random().toString(36).substring(2, 7),
      area: '10_channel',
      instruction: `Pressure their 10 early — rush up on first receiver`,
      targetPlayer: `${flyHalf.firstName} ${flyHalf.lastName}`,
      intensity: 'rush',
    });
  }

  if (opponent.tactics.attackStyle === 'direct') {
    areas.push({
      id: Math.random().toString(36).substring(2, 7),
      area: 'midfield',
      instruction: 'Stack the midfield — they run direct through 12',
      intensity: 'double_team',
    });
  }

  return areas;
}

// ========================
// DEFENSIVE FOCUS PRESETS
// ========================

export const DEFENSIVE_FOCUS_PRESETS: { label: string; areas: Omit<DefensiveFocusArea, 'id'>[] }[] = [
  {
    label: 'Contain the edges',
    areas: [
      { area: 'left_wing', instruction: 'Hold width, don\'t commit', intensity: 'hold' },
      { area: 'right_wing', instruction: 'Hold width, don\'t commit', intensity: 'hold' },
    ],
  },
  {
    label: 'Blitz the 10 channel',
    areas: [
      { area: '10_channel', instruction: 'Rush up on first receiver', intensity: 'rush' },
      { area: '12_channel', instruction: 'Close the inside gap', intensity: 'double_team' },
    ],
  },
  {
    label: 'Protect the back field',
    areas: [
      { area: 'back_field', instruction: 'Deep coverage against kicks in behind', intensity: 'hold' },
    ],
  },
  {
    label: 'Shut down the blindside',
    areas: [
      { area: 'blindside', instruction: 'Commit extra defender to short side', intensity: 'double_team' },
    ],
  },
];
