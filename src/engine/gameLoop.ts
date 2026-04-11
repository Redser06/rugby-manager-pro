/**
 * Core Game Loop — orchestrates weekly simulation:
 *   1. Simulate all league matches for the current week
 *   2. Update fixture statuses and scores
 *   3. Recalculate league standings from all completed fixtures
 *   4. Apply player effects (fatigue, injuries, form)
 */

import { Team, League, LeagueStanding, Player } from '@/types/game';
import { SeasonSchedule, Fixture } from '@/types/fixture';
import { simulateFullMatch, createDefaultSubPlan } from './matchSimulator';
import { StaffBonuses, DEFAULT_STAFF_BONUSES } from '@/types/staff';

// ========================
// QUICK MATCH SIM (for AI teams)
// ========================

interface QuickMatchResult {
  homeScore: number;
  awayScore: number;
  homeTries: number;
  awayTries: number;
}

function quickSimMatch(homeTeam: Team, awayTeam: Team): QuickMatchResult {
  // Use the full engine for player's team matches; this is a lightweight fallback
  // for matches between two AI teams to avoid perf issues with 8 full sims per week
  const homeStr = homeTeam.players.slice(0, 15).reduce((s, p) => s + p.overall, 0) / 15 + homeTeam.reputation * 0.1;
  const awayStr = awayTeam.players.slice(0, 15).reduce((s, p) => s + p.overall, 0) / 15 + awayTeam.reputation * 0.1;
  
  const homeAdvantage = 3;
  const totalStr = homeStr + homeAdvantage + awayStr;
  const homeWinProb = (homeStr + homeAdvantage) / totalStr;
  
  const roll = Math.random();
  let homeScore: number, awayScore: number;
  
  if (roll < homeWinProb * 0.7) {
    // Home win
    homeScore = 15 + Math.floor(Math.random() * 25);
    awayScore = Math.floor(Math.random() * (homeScore - 3));
  } else if (roll < homeWinProb) {
    // Close home win
    homeScore = 15 + Math.floor(Math.random() * 15);
    awayScore = homeScore - (1 + Math.floor(Math.random() * 7));
  } else if (roll < homeWinProb + 0.05) {
    // Draw
    homeScore = 15 + Math.floor(Math.random() * 15);
    awayScore = homeScore;
  } else {
    // Away win
    awayScore = 15 + Math.floor(Math.random() * 25);
    homeScore = Math.floor(Math.random() * (awayScore - 1));
  }
  
  // Ensure non-negative
  homeScore = Math.max(0, homeScore);
  awayScore = Math.max(0, awayScore);
  
  // Estimate tries (rugby scores are multiples of 5/7 for tries, 3 for penalties)
  const homeTries = Math.floor(homeScore / 7) + (Math.random() < 0.3 ? 1 : 0);
  const awayTries = Math.floor(awayScore / 7) + (Math.random() < 0.3 ? 1 : 0);
  
  return { homeScore, awayScore, homeTries, awayTries };
}

// ========================
// SIMULATE WEEK
// ========================

export interface WeekSimResult {
  updatedSchedule: SeasonSchedule;
  updatedLeagues: League[];
  updatedTeam: Team | null;
  playerMatchResult?: {
    homeScore: number;
    awayScore: number;
    opponent: string;
    isHome: boolean;
    won: boolean;
  };
}

function getStaffBonuses(team: Team): StaffBonuses {
  if (!team.staff || team.staff.length === 0) return DEFAULT_STAFF_BONUSES;
  
  const bonuses: StaffBonuses = { ...DEFAULT_STAFF_BONUSES };
  for (const s of team.staff) {
    switch (s.role) {
      case 'scrum_coach': bonuses.scrumBonus += s.rating * 0.05; break;
      case 'defence_coach': bonuses.tackleBonus += s.rating * 0.05; break;
      case 'attack_coach': bonuses.attackBonus += s.rating * 0.05; break;
      case 'kicking_coach': bonuses.kickingBonus += s.rating * 0.05; break;
      case 'lineout_coach': bonuses.lineoutBonus += s.rating * 0.05; break;
    }
  }
  return bonuses;
}

export function simulateWeek(
  currentWeek: number,
  schedule: SeasonSchedule,
  leagues: League[],
  selectedTeam: Team | null,
): WeekSimResult {
  const updatedSchedule = { ...schedule, fixtures: [...schedule.fixtures] };
  const updatedLeagues = leagues.map(l => ({ ...l, teams: [...l.teams], standings: [...l.standings] }));
  let updatedTeam = selectedTeam ? { ...selectedTeam, players: [...selectedTeam.players] } : null;
  let playerMatchResult: WeekSimResult['playerMatchResult'] | undefined;

  // Find all fixtures for this week
  const weekFixtures = updatedSchedule.fixtures.filter(
    f => f.week === currentWeek && f.status === 'scheduled'
  );

  for (let i = 0; i < updatedSchedule.fixtures.length; i++) {
    const fixture = updatedSchedule.fixtures[i];
    if (fixture.week !== currentWeek || fixture.status !== 'scheduled') continue;

    // Find the teams from leagues
    let homeTeam: Team | undefined;
    let awayTeam: Team | undefined;
    for (const league of updatedLeagues) {
      if (!homeTeam) homeTeam = league.teams.find(t => t.id === fixture.homeTeamId);
      if (!awayTeam) awayTeam = league.teams.find(t => t.id === fixture.awayTeamId);
    }

    if (!homeTeam || !awayTeam) continue;

    // Use full sim for player's team, quick sim for AI vs AI
    const isPlayerMatch = selectedTeam && 
      (fixture.homeTeamId === selectedTeam.id || fixture.awayTeamId === selectedTeam.id);

    let homeScore: number, awayScore: number, homeTries: number, awayTries: number;

    if (isPlayerMatch) {
      try {
        const result = simulateFullMatch({
          homeTeam: fixture.homeTeamId === selectedTeam!.id ? selectedTeam! : homeTeam,
          awayTeam: fixture.awayTeamId === selectedTeam!.id ? selectedTeam! : awayTeam,
          homeSubPlan: createDefaultSubPlan(fixture.homeTeamId === selectedTeam!.id ? selectedTeam! : homeTeam),
          awaySubPlan: createDefaultSubPlan(fixture.awayTeamId === selectedTeam!.id ? selectedTeam! : awayTeam),
          homeStaffBonuses: getStaffBonuses(fixture.homeTeamId === selectedTeam!.id ? selectedTeam! : homeTeam),
          awayStaffBonuses: getStaffBonuses(fixture.awayTeamId === selectedTeam!.id ? selectedTeam! : awayTeam),
        });
        homeScore = result.homeScore;
        awayScore = result.awayScore;
        homeTries = result.homeTries;
        awayTries = result.awayTries;
      } catch {
        // Fallback to quick sim if full sim fails
        const result = quickSimMatch(homeTeam, awayTeam);
        homeScore = result.homeScore;
        awayScore = result.awayScore;
        homeTries = result.homeTries;
        awayTries = result.awayTries;
      }

      const isHome = fixture.homeTeamId === selectedTeam!.id;
      const myScore = isHome ? homeScore : awayScore;
      const oppScore = isHome ? awayScore : homeScore;
      playerMatchResult = {
        homeScore, awayScore,
        opponent: isHome ? fixture.awayTeamName : fixture.homeTeamName,
        isHome,
        won: myScore > oppScore,
      };
    } else {
      const result = quickSimMatch(homeTeam, awayTeam);
      homeScore = result.homeScore;
      awayScore = result.awayScore;
      homeTries = result.homeTries;
      awayTries = result.awayTries;
    }

    // Update fixture
    updatedSchedule.fixtures[i] = {
      ...fixture,
      status: 'completed',
      homeScore,
      awayScore,
    };
  }

  // ========================
  // RECALCULATE STANDINGS
  // ========================
  for (const league of updatedLeagues) {
    const leagueFixtures = updatedSchedule.fixtures.filter(
      f => f.status === 'completed' && 
      league.teams.some(t => t.id === f.homeTeamId)
    );

    league.standings = league.teams.map(team => {
      const standing: LeagueStanding = {
        teamId: team.id,
        played: 0, won: 0, drawn: 0, lost: 0,
        pointsFor: 0, pointsAgainst: 0,
        bonusPoints: 0, totalPoints: 0,
      };

      for (const f of leagueFixtures) {
        if (f.homeTeamId !== team.id && f.awayTeamId !== team.id) continue;
        const isHome = f.homeTeamId === team.id;
        const myScore = isHome ? (f.homeScore || 0) : (f.awayScore || 0);
        const oppScore = isHome ? (f.awayScore || 0) : (f.homeScore || 0);

        standing.played++;
        standing.pointsFor += myScore;
        standing.pointsAgainst += oppScore;

        if (myScore > oppScore) {
          standing.won++;
          standing.totalPoints += 4;
        } else if (myScore === oppScore) {
          standing.drawn++;
          standing.totalPoints += 2;
        } else {
          standing.lost++;
          // Losing bonus point (within 7)
          if (oppScore - myScore <= 7) {
            standing.bonusPoints++;
            standing.totalPoints++;
          }
        }

        // Try bonus point (4+ tries) — estimate from score
        const estimatedTries = Math.floor(myScore / 7);
        if (estimatedTries >= 4) {
          standing.bonusPoints++;
          standing.totalPoints++;
        }
      }

      return standing;
    });

    // Sort standings
    league.standings.sort((a, b) => 
      b.totalPoints - a.totalPoints || 
      (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
    );
  }

  // ========================
  // APPLY PLAYER EFFECTS
  // ========================
  if (updatedTeam) {
    const hadMatch = weekFixtures.some(
      f => f.homeTeamId === updatedTeam!.id || f.awayTeamId === updatedTeam!.id
    );

    updatedTeam.players = updatedTeam.players.map(player => {
      const updated = { ...player };

      // Injury recovery
      if (updated.injured && updated.injuryWeeks > 0) {
        updated.injuryWeeks = Math.max(0, updated.injuryWeeks - 1);
        if (updated.injuryWeeks === 0) {
          updated.injured = false;
          updated.fitness = 60 + Math.floor(Math.random() * 20);
        }
      }

      if (!updated.injured) {
        if (hadMatch) {
          // Starting XV played — fatigue + injury risk
          const isStarter = updatedTeam!.players.indexOf(player) < 15;
          if (isStarter) {
            updated.fitness = Math.max(40, updated.fitness - (8 + Math.floor(Math.random() * 10)));
            // Injury roll: ~5% chance per match
            if (Math.random() < 0.05) {
              updated.injured = true;
              updated.injuryWeeks = 1 + Math.floor(Math.random() * 6);
              updated.fitness = Math.max(20, updated.fitness - 20);
            }
            // Form adjustment based on match result
            if (playerMatchResult) {
              updated.form = Math.min(10, Math.max(1, 
                updated.form + (playerMatchResult.won ? 0.3 : -0.2) + (Math.random() * 0.4 - 0.2)
              ));
            }
          } else {
            // Bench/unused — slight recovery
            updated.fitness = Math.min(100, updated.fitness + 3);
          }
        } else {
          // Bye week — good recovery
          updated.fitness = Math.min(100, updated.fitness + 8);
          // Form regresses to mean slightly
          updated.form = updated.form + (7 - updated.form) * 0.05;
        }
      }

      return updated;
    });

    // Also update the team in leagues array
    for (const league of updatedLeagues) {
      league.teams = league.teams.map(t =>
        t.id === updatedTeam!.id ? updatedTeam! : t
      );
    }
  }

  return { updatedSchedule, updatedLeagues, updatedTeam, playerMatchResult };
}

// ========================
// WEEK-TO-MONTH MAPPING
// ========================
// Season starts in September (NH) or February (SH)
// Each week ≈ 1 real week of the calendar

export function weekToMonth(week: number, isSouthernHemisphere: boolean): number {
  // NH: Week 1 = September (month 9)
  // SH: Week 1 = February (month 2)
  const startMonth = isSouthernHemisphere ? 2 : 9;
  const monthOffset = Math.floor((week - 1) / 4);
  return ((startMonth - 1 + monthOffset) % 12) + 1;
}

export function weekToMonthName(week: number, isSouthernHemisphere: boolean): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[weekToMonth(week, isSouthernHemisphere) - 1];
}

export function isTransferWindowOpenForWeek(week: number, isSouthernHemisphere: boolean): boolean {
  const month = weekToMonth(week, isSouthernHemisphere);
  if (isSouthernHemisphere) {
    // SH window: July-September (off-season)
    return month >= 7 && month <= 9;
  }
  // NH window: June-August (off-season) — but also a mid-season January window
  return (month >= 6 && month <= 8) || month === 1;
}
