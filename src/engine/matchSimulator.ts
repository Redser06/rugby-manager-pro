import { Team, Player, PositionNumber } from '@/types/game';
import {
  EnhancedMatch, EnhancedMatchEvent, EnhancedEventType,
  MatchStats, createEmptyStats, PlayerMatchState, PlayerMatchRating,
  Referee, REFEREE_POOL, MatchWeather, getWeatherEffects,
  TeamDiscipline, SubstitutionPlan, SubstitutionRule, BenchSplit,
  COMMENTARY, TMOReview,
  CaptainInteraction, CaptainApproach, SidelineInstruction, SidelineInstructionType,
} from '@/types/matchEngine';
import { StaffBonuses } from '@/types/staff';
import { simulateScrum, simulateLineout, simulateMaul } from './setPieces';
import { calculateFatiguePerMinute, getFatigueMultiplier, shouldSubstitute, getBombSquadAdvantage, getImpactSubBoost } from './fatigue';
import { assessPenalty, shouldIssueTeamWarning, simulateTMO, penaltyDecision } from './discipline';

// ========================
// MAIN MATCH SIMULATOR
// ========================

interface MatchConfig {
  homeTeam: Team;
  awayTeam: Team;
  homeSubPlan: SubstitutionPlan;
  awaySubPlan: SubstitutionPlan;
  homeStaffBonuses: StaffBonuses;
  awayStaffBonuses: StaffBonuses;
  referee?: Referee;
  weather?: MatchWeather;
  isNeutralVenue?: boolean;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function playerName(p: Player): string {
  return `${p.firstName} ${p.lastName}`;
}

function generateWeather(): MatchWeather {
  const conditions: MatchWeather['condition'][] = ['clear', 'clear', 'overcast', 'overcast', 'light_rain', 'heavy_rain', 'wind'];
  const condition = randomPick(conditions);
  const windDirs: MatchWeather['windDirection'][] = ['north', 'south', 'east', 'west'];
  return {
    condition,
    windSpeed: condition === 'wind' ? 25 + Math.floor(Math.random() * 20) : Math.floor(Math.random() * 15),
    windDirection: randomPick(windDirs),
    temperature: 8 + Math.floor(Math.random() * 15),
    pitchCondition: ['heavy_rain', 'storm'].includes(condition) ? 'heavy' : (condition === 'light_rain' ? 'soft' : 'firm'),
  };
}

function getTeamStrength(team: Team, staffBonuses: StaffBonuses): number {
  const playerAvg = team.players.slice(0, 15).reduce((sum, p) => sum + p.overall, 0) / 15;
  const repBonus = team.reputation * 0.1;
  const staffTotal = (staffBonuses.scrumBonus + staffBonuses.lineoutBonus + staffBonuses.tackleBonus +
    staffBonuses.kickingBonus + staffBonuses.attackBonus) / 5;
  return playerAvg + repBonus + staffTotal;
}

function getPlayerAttr(player: Player, attr: string): number {
  return (player.attributes as any)[attr] || 50;
}

function getForwards(team: Team): Player[] {
  return team.players.filter(p => p.positionNumber >= 1 && p.positionNumber <= 8).slice(0, 8);
}

function getBacks(team: Team): Player[] {
  return team.players.filter(p => p.positionNumber >= 9 && p.positionNumber <= 15).slice(0, 7);
}

function getFrontRow(team: Team): Player[] {
  return team.players.filter(p => [1, 2, 3].includes(p.positionNumber)).slice(0, 3);
}

function getPlayerByPosition(team: Team, pos: PositionNumber): Player | undefined {
  return team.players.find(p => p.positionNumber === pos);
}

function formatCommentary(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [key, val] of Object.entries(replacements)) {
    result = result.replace(`{${key}}`, val);
  }
  return result;
}

export function simulateFullMatch(config: MatchConfig): EnhancedMatch {
  const { homeTeam, awayTeam, homeSubPlan, awaySubPlan, homeStaffBonuses, awayStaffBonuses } = config;
  const referee = config.referee || randomPick(REFEREE_POOL);
  const weather = config.weather || generateWeather();
  const weatherEffects = getWeatherEffects(weather);

  // Match state
  let homeScore = 0;
  let awayScore = 0;
  let homeTries = 0;
  let awayTries = 0;
  const events: EnhancedMatchEvent[] = [];
  const homeStats = createEmptyStats();
  const awayStats = createEmptyStats();
  let homePossessionMins = 0;
  let awayPossessionMins = 0;
  let homeTerritoryMins = 0;
  let awayTerritoryMins = 0;

  // Player states
  const homeFatigue: Record<string, number> = {};
  const awayFatigue: Record<string, number> = {};
  const homeOnField = new Set(homeSubPlan.startingXV);
  const awayOnField = new Set(awaySubPlan.startingXV);
  let homeSinBin: { playerId: string; returnMinute: number }[] = [];
  let awaySinBin: { playerId: string; returnMinute: number }[] = [];
  let homeRedCards = 0;
  let awayRedCards = 0;

  // Discipline tracking
  const homeDiscipline: TeamDiscipline = { penaltyCount: 0, hasTeamWarning: false, infringementAreas: [] };
  const awayDiscipline: TeamDiscipline = { penaltyCount: 0, hasTeamWarning: false, infringementAreas: [] };

  // Substitution tracking
  const homeSubsDone: { minute: number; playerOffId: string; playerOnId: string }[] = [];
  const awaySubsDone: { minute: number; playerOffId: string; playerOnId: string }[] = [];
  let homeSubsRemaining = 8;
  let awaySubsRemaining = 8;

  // Player ratings
  const playerPerformance: Record<string, {
    tackles: number; missedTackles: number; carries: number; metres: number;
    offloads: number; turnoversWon: number; penaltiesConceded: number; tries: number;
    conversions: number; penaltyGoals: number; minutesPlayed: number;
  }> = {};

  // Init fatigue and performance trackers
  for (const pid of [...homeSubPlan.startingXV, ...awaySubPlan.startingXV]) {
    homeFatigue[pid] = 0;
    awayFatigue[pid] = 0;
    playerPerformance[pid] = {
      tackles: 0, missedTackles: 0, carries: 0, metres: 0,
      offloads: 0, turnoversWon: 0, penaltiesConceded: 0, tries: 0,
      conversions: 0, penaltyGoals: 0, minutesPlayed: 0,
    };
  }

  const homeStrength = getTeamStrength(homeTeam, homeStaffBonuses);
  const awayStrength = getTeamStrength(awayTeam, awayStaffBonuses);
  const homeAdvantage = config.isNeutralVenue ? 0 : 3;

  function addEvent(
    minute: number, type: EnhancedEventType, team: 'home' | 'away',
    description: string, commentary: string,
    fieldPos: number, opts?: { player?: Player; player2?: Player; scoreDelta?: number; isKey?: boolean; tmo?: TMOReview }
  ): EnhancedMatchEvent {
    const ev: EnhancedMatchEvent = {
      id: generateId(),
      minute,
      second: Math.floor(Math.random() * 60),
      type,
      team,
      player: opts?.player ? { id: opts.player.id, name: playerName(opts.player), number: opts.player.positionNumber } : undefined,
      player2: opts?.player2 ? { id: opts.player2.id, name: playerName(opts.player2), number: opts.player2.positionNumber } : undefined,
      description,
      commentary,
      fieldPosition: fieldPos,
      scoreDelta: opts?.scoreDelta,
      isKeyMoment: opts?.isKey || false,
      tmoReview: opts?.tmo,
    };
    events.push(ev);
    return ev;
  }

  function processSubstitution(team: 'home' | 'away', minute: number) {
    const plan = team === 'home' ? homeSubPlan : awaySubPlan;
    const fatigue = team === 'home' ? homeFatigue : awayFatigue;
    const onField = team === 'home' ? homeOnField : awayOnField;
    const subsDone = team === 'home' ? homeSubsDone : awaySubsDone;
    const subsRemaining = team === 'home' ? homeSubsRemaining : awaySubsRemaining;
    const teamObj = team === 'home' ? homeTeam : awayTeam;

    if (subsRemaining <= 0) return;

    // Check planned subs
    for (const rule of plan.rules) {
      if (rule.executed) continue;
      if (minute < rule.triggerMinute) continue;

      // Check conditions
      const scoreDiff = team === 'home' ? homeScore - awayScore : awayScore - homeScore;
      if (rule.condition === 'unless_winning_by_20' && scoreDiff >= 20) continue;
      if (rule.condition === 'unless_losing' && scoreDiff < 0) continue;
      if (rule.condition === 'if_trailing' && scoreDiff >= 0) continue;

      if (onField.has(rule.playerOffId) && !onField.has(rule.playerOnId)) {
        const playerOff = teamObj.players.find(p => p.id === rule.playerOffId);
        const playerOn = teamObj.players.find(p => p.id === rule.playerOnId);
        if (playerOff && playerOn) {
          onField.delete(rule.playerOffId);
          onField.add(rule.playerOnId);
          fatigue[rule.playerOnId] = 0;
          rule.executed = true;
          subsDone.push({ minute, playerOffId: rule.playerOffId, playerOnId: rule.playerOnId });
          if (team === 'home') homeSubsRemaining--; else awaySubsRemaining--;

          const templates = COMMENTARY.substitution;
          addEvent(minute, 'substitution', team,
            `${playerName(playerOn)} replaces ${playerName(playerOff)}`,
            formatCommentary(randomPick([...templates]), { playerOff: playerName(playerOff), playerOn: playerName(playerOn) }),
            50, { player: playerOn, player2: playerOff }
          );
        }
      }
    }

    // Auto-sub for fatigued players
    for (const pid of Array.from(onField)) {
      const player = teamObj.players.find(p => p.id === pid);
      if (!player) continue;
      if (shouldSubstitute(fatigue[pid] || 0, player.positionNumber, minute)) {
        // Find a bench player for this position
        const replacement = plan.bench.find(bid =>
          !onField.has(bid) &&
          teamObj.players.find(p => p.id === bid)?.positionNumber === player.positionNumber
        );
        if (replacement) {
          const repPlayer = teamObj.players.find(p => p.id === replacement);
          if (repPlayer && (team === 'home' ? homeSubsRemaining : awaySubsRemaining) > 0) {
            onField.delete(pid);
            onField.add(replacement);
            fatigue[replacement] = 0;
            subsDone.push({ minute, playerOffId: pid, playerOnId: replacement });
            if (team === 'home') homeSubsRemaining--; else awaySubsRemaining--;

            const templates = COMMENTARY.substitution;
            addEvent(minute, 'substitution', team,
              `${playerName(repPlayer)} replaces ${playerName(player)}`,
              formatCommentary(randomPick([...templates]), { playerOff: playerName(player), playerOn: playerName(repPlayer) }),
              50, { player: repPlayer, player2: player }
            );
          }
        }
      }
    }
  }

  // ===== MAIN SIMULATION LOOP =====
  for (let minute = 1; minute <= 80; minute++) {
    // Update fatigue for all on-field players
    for (const pid of [...homeOnField]) {
      const player = homeTeam.players.find(p => p.id === pid);
      if (player) {
        const endurance = getPlayerAttr(player, 'endurance') || getPlayerAttr(player, 'workRate') || 60;
        homeFatigue[pid] = (homeFatigue[pid] || 0) + calculateFatiguePerMinute({
          positionNumber: player.positionNumber,
          currentMinute: minute,
          endurance,
          age: player.age,
          weather,
          staffFatigueResistance: homeStaffBonuses.fatigueResistance,
          hasBeenSubbedOn: !homeSubPlan.startingXV.includes(pid),
          subbedOnMinute: homeSubsDone.find(s => s.playerOnId === pid)?.minute || 0,
        });
        if (playerPerformance[pid]) playerPerformance[pid].minutesPlayed++;
      }
    }
    for (const pid of [...awayOnField]) {
      const player = awayTeam.players.find(p => p.id === pid);
      if (player) {
        const endurance = getPlayerAttr(player, 'endurance') || getPlayerAttr(player, 'workRate') || 60;
        awayFatigue[pid] = (awayFatigue[pid] || 0) + calculateFatiguePerMinute({
          positionNumber: player.positionNumber,
          currentMinute: minute,
          endurance,
          age: player.age,
          weather,
          staffFatigueResistance: awayStaffBonuses.fatigueResistance,
          hasBeenSubbedOn: !awaySubPlan.startingXV.includes(pid),
          subbedOnMinute: awaySubsDone.find(s => s.playerOnId === pid)?.minute || 0,
        });
        if (playerPerformance[pid]) playerPerformance[pid].minutesPlayed++;
      }
    }

    // Sin bin returns
    for (const sb of homeSinBin) {
      if (minute >= sb.returnMinute) {
        addEvent(minute, 'sin_bin_return', 'home', 'Sin bin time is up. Back to 15 men.', 'Player returns from the sin bin.', 50);
      }
    }
    homeSinBin = homeSinBin.filter(sb => minute < sb.returnMinute);
    for (const sb of awaySinBin) {
      if (minute >= sb.returnMinute) {
        addEvent(minute, 'sin_bin_return', 'away', 'Sin bin time is up. Back to 15 men.', 'Player returns from the sin bin.', 50);
      }
    }
    awaySinBin = awaySinBin.filter(sb => minute < sb.returnMinute);

    // Half time
    if (minute === 40) {
      const templates = COMMENTARY.halfTime;
      addEvent(40, 'half_time', 'home',
        `Half Time: ${homeTeam.shortName} ${homeScore} - ${awayTeam.shortName} ${awayScore}`,
        formatCommentary(randomPick([...templates]), {
          homeTeam: homeTeam.shortName, awayTeam: awayTeam.shortName,
          homeScore: homeScore.toString(), awayScore: awayScore.toString()
        }),
        50, { isKey: true }
      );
      continue;
    }

    // Substitutions
    processSubstitution('home', minute);
    processSubstitution('away', minute);

    // ===== POSSESSION PHASE =====
    // Determine who has the ball this minute
    const homeEffective = (homeStrength + homeAdvantage) * (1 - (homeSinBin.length + homeRedCards) * 0.07);
    const awayEffective = awayStrength * (1 - (awaySinBin.length + awayRedCards) * 0.07);
    const possessionChance = homeEffective / (homeEffective + awayEffective);
    const hasPossession: 'home' | 'away' = Math.random() < possessionChance ? 'home' : 'away';
    
    if (hasPossession === 'home') homePossessionMins++; else awayPossessionMins++;

    // Field position (0 = own line, 100 = opp line)
    let fieldPosition = 40 + Math.floor(Math.random() * 30);
    if (hasPossession === 'home') homeTerritoryMins++; else awayTerritoryMins++;

    const attackTeam = hasPossession === 'home' ? homeTeam : awayTeam;
    const defenseTeam = hasPossession === 'home' ? awayTeam : homeTeam;
    const atkFatigue = hasPossession === 'home' ? homeFatigue : awayFatigue;
    const defFatigue = hasPossession === 'home' ? awayFatigue : homeFatigue;
    const atkStats = hasPossession === 'home' ? homeStats : awayStats;
    const defStats = hasPossession === 'home' ? awayStats : homeStats;
    const atkStaff = hasPossession === 'home' ? homeStaffBonuses : awayStaffBonuses;
    const defStaff = hasPossession === 'home' ? awayStaffBonuses : homeStaffBonuses;
    const atkDiscipline = hasPossession === 'home' ? homeDiscipline : awayDiscipline;
    const defDiscipline = hasPossession === 'home' ? awayDiscipline : homeDiscipline;

    // Event probability roll
    const roll = Math.random();

    // ===== SET PIECE EVENTS =====
    if (roll < 0.06) {
      // SCRUM
      const scrumResult = simulateScrum({
        homePackPlayers: getFrontRow(homeTeam),
        awayPackPlayers: getFrontRow(awayTeam),
        homeStaffBonuses, awayStaffBonuses, referee,
        homeFatigue, awayFatigue,
        homeDominanceStreak: 0, awayDominanceStreak: 0,
      });

      if (scrumResult.outcome === 'penalty_won' && scrumResult.penaltyTo) {
        const penTeam = scrumResult.penaltyTo;
        const penStats = penTeam === 'home' ? homeStats : awayStats;
        penStats.scrums.penaltiesWon++;
        const concedingDiscipline = penTeam === 'home' ? awayDiscipline : homeDiscipline;
        concedingDiscipline.penaltyCount++;
        concedingDiscipline.infringementAreas.push('scrum');

        // Team warning check
        if (shouldIssueTeamWarning(concedingDiscipline, referee)) {
          concedingDiscipline.hasTeamWarning = true;
          concedingDiscipline.warningMinute = minute;
          const warnTeam = penTeam === 'home' ? 'away' : 'home';
          addEvent(minute, 'team_warning', warnTeam,
            'Team warning issued by the referee',
            randomPick([...COMMENTARY.teamWarning]).replace('{team}', warnTeam === 'home' ? homeTeam.shortName : awayTeam.shortName),
            fieldPosition, { isKey: true }
          );
        }

        addEvent(minute, 'scrum_penalty', penTeam, scrumResult.description,
          randomPick([...COMMENTARY.scrumPenalty]).replace('{team}', penTeam === 'home' ? homeTeam.shortName : awayTeam.shortName),
          fieldPosition
        );
        penStats.scrums.won++;
      } else {
        const winStats = scrumResult.winner === 'home' ? homeStats : awayStats;
        const loseStats = scrumResult.winner === 'home' ? awayStats : homeStats;
        winStats.scrums.won++;
        loseStats.scrums.lost++;
        addEvent(minute, scrumResult.winner === hasPossession ? 'scrum_won' : 'scrum_lost', hasPossession,
          scrumResult.description, scrumResult.description, fieldPosition);
      }
    } else if (roll < 0.10) {
      // LINEOUT
      const hooker = getPlayerByPosition(attackTeam, 2);
      if (hooker) {
        const result = simulateLineout({
          throwingTeam: hasPossession,
          hooker,
          jumpers: getForwards(attackTeam).filter(p => [4, 5, 6, 7, 8].includes(p.positionNumber)),
          oppositionJumpers: getForwards(defenseTeam).filter(p => [4, 5, 6, 7, 8].includes(p.positionNumber)),
          staffBonus: atkStaff.lineoutBonus,
          oppositionStaffBonus: defStaff.lineoutBonus,
          repertoireSize: 8 + atkStaff.lineoutRepertoire,
          matchesAgainstOpponent: 0,
          referee,
        });

        if (result.outcome === 'stolen') {
          atkStats.lineouts.lost++;
          defStats.lineouts.stolen++;
          addEvent(minute, 'lineout_stolen', hasPossession === 'home' ? 'away' : 'home',
            result.description, result.description, fieldPosition, { isKey: true });
        } else {
          atkStats.lineouts.won++;
          addEvent(minute, 'lineout_won', hasPossession, result.description, result.description, fieldPosition);

          // Maul opportunity after clean lineout (30% chance if close to line)
          if (result.outcome === 'clean_catch' && fieldPosition > 75 && Math.random() < 0.3) {
            const maulResult = simulateMaul({
              attackingTeam: hasPossession,
              attackingForwards: getForwards(attackTeam),
              defendingForwards: getForwards(defenseTeam),
              attackingFatigue: atkFatigue,
              defendingFatigue: defFatigue,
              distanceFromLine: 100 - fieldPosition,
              trainingInvestment: 50,
              referee,
            });

            if (maulResult.outcome === 'try') {
              // MAUL TRY!
              const scorer = randomPick(getForwards(attackTeam).filter(p => [2, 4, 5, 8].includes(p.positionNumber)));
              if (hasPossession === 'home') { homeScore += 5; homeTries++; } else { awayScore += 5; awayTries++; }
              atkStats.mauls.tries++;
              atkStats.mauls.formed++;
              if (playerPerformance[scorer.id]) playerPerformance[scorer.id].tries++;

              addEvent(minute, 'maul_try', hasPossession, maulResult.description,
                randomPick([...COMMENTARY.maul]).replace('{team}', hasPossession === 'home' ? homeTeam.shortName : awayTeam.shortName),
                95, { player: scorer, scoreDelta: 5, isKey: true }
              );

              // Conversion
              const kicker = getPlayerByPosition(attackTeam, 10);
              if (kicker) {
                const kickAccuracy = getPlayerAttr(kicker, 'kicking') + atkStaff.kickingBonus;
                const convChance = (kickAccuracy / 100) * 0.85 + weatherEffects.kickingAccuracyModifier / 100;
                if (Math.random() < convChance) {
                  if (hasPossession === 'home') homeScore += 2; else awayScore += 2;
                  if (playerPerformance[kicker.id]) playerPerformance[kicker.id].conversions++;
                  addEvent(minute, 'conversion', hasPossession, 'Conversion successful',
                    randomPick([...COMMENTARY.conversion]).replace('{player}', playerName(kicker)),
                    95, { player: kicker, scoreDelta: 2 });
                } else {
                  addEvent(minute, 'conversion_miss', hasPossession, 'Conversion missed',
                    randomPick([...COMMENTARY.conversionMiss]).replace('{player}', playerName(kicker)),
                    95, { player: kicker });
                }
              }
            } else if (maulResult.outcome === 'collapsed_penalty_attack') {
              atkStats.mauls.penaltiesWon++;
              atkStats.mauls.formed++;
              defDiscipline.penaltyCount++;
              defDiscipline.infringementAreas.push('maul');
              addEvent(minute, 'maul_penalty', hasPossession, maulResult.description, maulResult.description, 90);
            } else {
              atkStats.mauls.formed++;
              addEvent(minute, 'maul_held', hasPossession, maulResult.description, maulResult.description, fieldPosition);
            }
          }
        }
      }
    } else if (roll < 0.16) {
      // TRY SCORING OPPORTUNITY
      const attackStrength = getTeamStrength(attackTeam, atkStaff);
      const defenseStrength = getTeamStrength(defenseTeam, defStaff);
      
      // Fatigue advantage check
      const atkAvgFatigue = Object.entries(atkFatigue)
        .filter(([pid]) => (hasPossession === 'home' ? homeOnField : awayOnField).has(pid))
        .reduce((sum, [_, f]) => sum + f, 0) / 15;
      const defAvgFatigue = Object.entries(defFatigue)
        .filter(([pid]) => (hasPossession === 'home' ? awayOnField : homeOnField).has(pid))
        .reduce((sum, [_, f]) => sum + f, 0) / 15;
      
      const fatigueAdvantage = getBombSquadAdvantage(atkAvgFatigue, defAvgFatigue);
      const tryChance = (attackStrength / (attackStrength + defenseStrength)) + fatigueAdvantage;

      if (Math.random() < tryChance) {
        // Pick scorer based on position and attributes
        const backs = getBacks(attackTeam);
        const forwards = getForwards(attackTeam);
        const potentialScorers = Math.random() < 0.7 ? backs : forwards;
        const scorer = randomPick(potentialScorers);

        // TMO check on some tries
        const tmoChance = referee.tmoUsage === 'frequent' ? 0.25 : referee.tmoUsage === 'moderate' ? 0.12 : 0.05;
        let tmoReview: TMOReview | undefined;
        let tryStands = true;

        if (Math.random() < tmoChance) {
          const reasons: ('try_check' | 'offside' | 'knock_on')[] = ['try_check', 'offside', 'knock_on'];
          const tmoReason = randomPick(reasons);
          tmoReview = simulateTMO('try', tmoReason, referee);
          tmoReview.minute = minute;

          addEvent(minute, 'tmo_review', hasPossession,
            tmoReview.description,
            randomPick([...COMMENTARY.tmoReview]).replace('{reason}', tmoReason.replace('_', ' ')),
            90, { isKey: true, tmo: tmoReview }
          );

          if (tmoReview.finalDecision === 'try_disallowed') {
            tryStands = false;
          }
        }

        if (tryStands) {
          if (hasPossession === 'home') { homeScore += 5; homeTries++; } else { awayScore += 5; awayTries++; }
          if (playerPerformance[scorer.id]) playerPerformance[scorer.id].tries++;

          addEvent(minute, 'try', hasPossession,
            `TRY! ${playerName(scorer)} scores!`,
            formatCommentary(randomPick([...COMMENTARY.try]), { player: playerName(scorer) }),
            95, { player: scorer, scoreDelta: 5, isKey: true, tmo: tmoReview }
          );

          // Conversion
          const kicker = getPlayerByPosition(attackTeam, 10);
          if (kicker) {
            const kickAccuracy = getPlayerAttr(kicker, 'kicking') + atkStaff.kickingBonus;
            const fatigueMultiplier = getFatigueMultiplier(atkFatigue[kicker.id] || 0);
            const convChance = (kickAccuracy / 100) * 0.75 * fatigueMultiplier + weatherEffects.kickingAccuracyModifier / 100;
            if (Math.random() < convChance) {
              if (hasPossession === 'home') homeScore += 2; else awayScore += 2;
              if (playerPerformance[kicker.id]) playerPerformance[kicker.id].conversions++;
              addEvent(minute, 'conversion', hasPossession, 'Conversion successful',
                randomPick([...COMMENTARY.conversion]).replace('{player}', playerName(kicker)),
                95, { player: kicker, scoreDelta: 2 });
            } else {
              addEvent(minute, 'conversion_miss', hasPossession, 'Conversion missed',
                randomPick([...COMMENTARY.conversionMiss]).replace('{player}', playerName(kicker)),
                95, { player: kicker });
            }
          }
        }
      }
    } else if (roll < 0.24) {
      // PENALTY EVENT
      const situations: ('breakdown' | 'offside' | 'high_tackle' | 'not_rolling' | 'ruck_entry')[] =
        ['breakdown', 'offside', 'high_tackle', 'not_rolling', 'ruck_entry'];
      const situation = randomPick(situations);
      const infringingTeam: 'home' | 'away' = hasPossession === 'home' ? 'away' : 'home';
      const infringingPlayers = infringingTeam === 'home' ? homeTeam.players : awayTeam.players;
      const infringer = randomPick(infringingPlayers.slice(0, 15));
      const infDiscipline = infringingTeam === 'home' ? homeDiscipline : awayDiscipline;

      const penResult = assessPenalty({
        player: infringer,
        playerDiscipline: 60, // default for now
        minute,
        situation,
        referee,
        teamDiscipline: infDiscipline,
        fatigue: (infringingTeam === 'home' ? homeFatigue : awayFatigue)[infringer.id] || 0,
        isTrailing: infringingTeam === 'home' ? homeScore < awayScore : awayScore < homeScore,
        scoreDifference: infringingTeam === 'home' ? homeScore - awayScore : awayScore - homeScore,
      });

      if (penResult.isPenalty) {
        infDiscipline.penaltyCount++;
        infDiscipline.infringementAreas.push(situation);
        if (playerPerformance[infringer.id]) playerPerformance[infringer.id].penaltiesConceded++;
        
        const penaltyToTeam = infringingTeam === 'home' ? 'away' : 'home';
        const penAtkStats = penaltyToTeam === 'home' ? homeStats : awayStats;
        const penDefStats = penaltyToTeam === 'home' ? awayStats : homeStats;
        penAtkStats.penalties.won++;
        penDefStats.penalties.conceded++;

        // Team warning check
        if (shouldIssueTeamWarning(infDiscipline, referee)) {
          infDiscipline.hasTeamWarning = true;
          infDiscipline.warningMinute = minute;
          addEvent(minute, 'team_warning', infringingTeam,
            'Team warning issued',
            randomPick([...COMMENTARY.teamWarning]).replace('{team}', infringingTeam === 'home' ? homeTeam.shortName : awayTeam.shortName),
            fieldPosition, { isKey: true }
          );
        }

        if (penResult.isRedCard) {
          if (infringingTeam === 'home') { homeRedCards++; homeStats.redCards++; } else { awayRedCards++; awayStats.redCards++; }
          addEvent(minute, 'red_card', infringingTeam,
            `RED CARD: ${playerName(infringer)}`,
            formatCommentary(randomPick([...COMMENTARY.redCard]), { player: playerName(infringer), reason: penResult.reason }),
            fieldPosition, { player: infringer, isKey: true }
          );
        } else if (penResult.isYellowCard) {
          const returnMin = minute + 10;
          if (infringingTeam === 'home') {
            homeSinBin.push({ playerId: infringer.id, returnMinute: returnMin });
            homeStats.yellowCards++;
          } else {
            awaySinBin.push({ playerId: infringer.id, returnMinute: returnMin });
            awayStats.yellowCards++;
          }
          addEvent(minute, 'yellow_card', infringingTeam,
            `YELLOW CARD: ${playerName(infringer)}`,
            formatCommentary(randomPick([...COMMENTARY.yellowCard]), { player: playerName(infringer), reason: penResult.reason }),
            fieldPosition, { player: infringer, isKey: true }
          );
        } else {
          addEvent(minute, 'penalty_conceded', infringingTeam,
            penResult.description, penResult.description,
            fieldPosition, { player: infringer }
          );
        }

        // Penalty decision: kick at goal or corner
        const penTeam = penaltyToTeam === 'home' ? homeTeam : awayTeam;
        const kicker = getPlayerByPosition(penTeam, 10);
        if (kicker) {
          const kickerAcc = getPlayerAttr(kicker, 'kicking') + (penaltyToTeam === 'home' ? homeStaffBonuses : awayStaffBonuses).kickingBonus;
          const scoreDiff = penaltyToTeam === 'home' ? homeScore - awayScore : awayScore - homeScore;

          const decision = penaltyDecision(
            fieldPosition, scoreDiff, minute,
            kickerAcc, getTeamStrength(penTeam, penaltyToTeam === 'home' ? homeStaffBonuses : awayStaffBonuses),
            50 // maul training default
          );

          if (decision === 'kick_at_goal') {
            const fatigueMultiplier = getFatigueMultiplier((penaltyToTeam === 'home' ? homeFatigue : awayFatigue)[kicker.id] || 0);
            const successChance = (kickerAcc / 100) * 0.8 * fatigueMultiplier + weatherEffects.kickingAccuracyModifier / 100;
            
            if (Math.random() < successChance) {
              if (penaltyToTeam === 'home') homeScore += 3; else awayScore += 3;
              if (playerPerformance[kicker.id]) playerPerformance[kicker.id].penaltyGoals++;
              addEvent(minute, 'penalty_goal', penaltyToTeam, 'Penalty goal!',
                formatCommentary(randomPick([...COMMENTARY.penaltyGoal]), { player: playerName(kicker) }),
                fieldPosition, { player: kicker, scoreDelta: 3, isKey: true });
            } else {
              addEvent(minute, 'penalty_miss', penaltyToTeam, 'Penalty missed',
                formatCommentary(randomPick([...COMMENTARY.penaltyMiss]), { player: playerName(kicker) }),
                fieldPosition, { player: kicker });
            }
          } else if (decision === 'kick_to_corner') {
            addEvent(minute, 'penalty_to_corner', penaltyToTeam,
              'Kick to the corner! Going for the lineout.',
              'They\'re kicking for the corner! Looking for the lineout maul!',
              fieldPosition);
          }
        }
      }
    } else if (roll < 0.28) {
      // KICKING PLAY (50:22, box kick, territorial)
      const kicker = getPlayerByPosition(attackTeam, 10) || getPlayerByPosition(attackTeam, 9) || getPlayerByPosition(attackTeam, 15);
      if (kicker) {
        const kickAbility = getPlayerAttr(kicker, 'kicking') || getPlayerAttr(kicker, 'boxKicking') || 60;
        const kickRoll = Math.random();

        if (kickRoll < 0.08 && kickAbility > 70) {
          // 50:22!
          atkStats.kicks.successful5022++;
          atkStats.kicks.fromHand++;
          addEvent(minute, 'fifty_22', hasPossession,
            `50:22 by ${playerName(kicker)}!`,
            formatCommentary(randomPick([...COMMENTARY.fifty22]), { player: playerName(kicker) }),
            75, { player: kicker, isKey: true }
          );
        } else if (kickRoll < 0.4) {
          // Box kick
          atkStats.kicks.contestable++;
          atkStats.kicks.fromHand++;
          addEvent(minute, 'box_kick' as EnhancedEventType, hasPossession,
            `Box kick from ${playerName(kicker)}`,
            `${playerName(kicker)} puts up the box kick. The chasers are up!`,
            fieldPosition, { player: kicker }
          );
        } else {
          // Territorial
          atkStats.kicks.fromHand++;
          addEvent(minute, 'territorial_kick' as EnhancedEventType, hasPossession,
            `Territorial kick by ${playerName(kicker)}`,
            `${playerName(kicker)} finds touch with a good kick. Gaining territory.`,
            fieldPosition, { player: kicker }
          );
        }
      }
    } else if (roll < 0.32) {
      // TURNOVER / JACKAL
      const jackaler = randomPick(getForwards(defenseTeam).filter(p => [6, 7, 8].includes(p.positionNumber)));
      if (jackaler) {
        const breakdownStat = getPlayerAttr(jackaler, 'breakdown') || getPlayerAttr(jackaler, 'workRate') || 60;
        if (Math.random() < breakdownStat / 150) {
          defStats.turnoversWon++;
          atkStats.turnoversConceded++;
          if (playerPerformance[jackaler.id]) playerPerformance[jackaler.id].turnoversWon++;
          addEvent(minute, 'turnover', hasPossession === 'home' ? 'away' : 'home',
            `Turnover by ${playerName(jackaler)}!`,
            formatCommentary(randomPick([...COMMENTARY.turnover]), { player: playerName(jackaler) }),
            fieldPosition, { player: jackaler, isKey: true }
          );
        }
      }
    } else if (roll < 0.36) {
      // LINE BREAK
      const potentialBreakers = [...getBacks(attackTeam), ...getForwards(attackTeam).filter(p => [6, 7, 8].includes(p.positionNumber))];
      const breaker = randomPick(potentialBreakers);
      if (breaker) {
        atkStats.linebreaks++;
        const metres = 10 + Math.floor(Math.random() * 20);
        atkStats.metresGained += metres;
        if (playerPerformance[breaker.id]) {
          playerPerformance[breaker.id].carries++;
          playerPerformance[breaker.id].metres += metres;
        }
        addEvent(minute, 'line_break', hasPossession,
          `Line break by ${playerName(breaker)}!`,
          formatCommentary(randomPick([...COMMENTARY.lineBreak]), { player: playerName(breaker) }),
          fieldPosition + 15, { player: breaker }
        );
      }
    } else if (roll < 0.40) {
      // BIG TACKLE
      const tackler = randomPick([...getForwards(defenseTeam), ...getBacks(defenseTeam)]);
      if (tackler) {
        defStats.tackles.made++;
        if (playerPerformance[tackler.id]) playerPerformance[tackler.id].tackles++;
        addEvent(minute, 'big_tackle' as EnhancedEventType, hasPossession === 'home' ? 'away' : 'home',
          `Big tackle by ${playerName(tackler)}!`,
          formatCommentary(randomPick([...COMMENTARY.bigTackle]), { player: playerName(tackler) }),
          fieldPosition, { player: tackler }
        );
      }
    } else if (roll < 0.42) {
      // DROP GOAL
      const kicker = getPlayerByPosition(attackTeam, 10);
      if (kicker && fieldPosition > 55 && fieldPosition < 75) {
        const kickAbility = getPlayerAttr(kicker, 'kicking');
        const fatigueMultiplier = getFatigueMultiplier(atkFatigue[kicker.id] || 0);
        const successChance = (kickAbility / 100) * 0.45 * fatigueMultiplier;

        if (Math.random() < successChance) {
          if (hasPossession === 'home') homeScore += 3; else awayScore += 3;
          addEvent(minute, 'drop_goal', hasPossession,
            `Drop goal by ${playerName(kicker)}!`,
            `${playerName(kicker)} drops for goal... and it's OVER! Three points!`,
            fieldPosition, { player: kicker, scoreDelta: 3, isKey: true }
          );
        }
      }
    } else {
      // PHASE PLAY (background carries, tackles, metres)
      atkStats.phaseCount++;
      const carries = 1 + Math.floor(Math.random() * 3);
      const metres = carries * (3 + Math.floor(Math.random() * 5));
      atkStats.carries += carries;
      atkStats.metresGained += metres;
      atkStats.passes += Math.floor(Math.random() * 4);
      
      const tacklesToMake = 1 + Math.floor(Math.random() * 2);
      defStats.tackles.made += tacklesToMake;
      if (Math.random() < 0.15) defStats.tackles.missed++;
      
      // Offload chance
      if (Math.random() < 0.08) atkStats.offloads++;
      
      // Ruck
      atkStats.rucks.won++;
    }
  }

  // Full time
  const ftTemplates = COMMENTARY.fullTime;
  addEvent(80, 'full_time', 'home',
    `Full Time: ${homeTeam.shortName} ${homeScore} - ${awayTeam.shortName} ${awayScore}`,
    formatCommentary(randomPick([...ftTemplates]), {
      homeTeam: homeTeam.shortName, awayTeam: awayTeam.shortName,
      homeScore: homeScore.toString(), awayScore: awayScore.toString()
    }),
    50, { isKey: true }
  );

  // Calculate final stats
  const totalPossession = homePossessionMins + awayPossessionMins || 1;
  homeStats.possession = Math.round((homePossessionMins / totalPossession) * 100);
  awayStats.possession = 100 - homeStats.possession;
  const totalTerritory = homeTerritoryMins + awayTerritoryMins || 1;
  homeStats.territory = Math.round((homeTerritoryMins / totalTerritory) * 100);
  awayStats.territory = 100 - homeStats.territory;
  homeStats.tackles.percentage = homeStats.tackles.made > 0
    ? Math.round((homeStats.tackles.made / (homeStats.tackles.made + homeStats.tackles.missed)) * 100)
    : 100;
  awayStats.tackles.percentage = awayStats.tackles.made > 0
    ? Math.round((awayStats.tackles.made / (awayStats.tackles.made + awayStats.tackles.missed)) * 100)
    : 100;

  // Calculate player ratings
  const calculateRating = (perf: typeof playerPerformance[string]): number => {
    let rating = 6;
    rating += perf.tries * 1.0;
    rating += perf.turnoversWon * 0.5;
    rating += perf.tackles * 0.02;
    rating -= perf.missedTackles * 0.15;
    rating -= perf.penaltiesConceded * 0.3;
    rating += perf.offloads * 0.1;
    rating += perf.metres * 0.005;
    rating += (perf.conversions + perf.penaltyGoals) * 0.2;
    return Math.min(10, Math.max(1, Math.round(rating * 10) / 10));
  };

  const mapPerf = (p: Player) => {
    const perf = playerPerformance[p.id] || { tackles: 0, missedTackles: 0, carries: 0, metres: 0, offloads: 0, turnoversWon: 0, penaltiesConceded: 0, tries: 0, conversions: 0, penaltyGoals: 0, minutesPlayed: 0 };
    return {
      playerId: p.id, playerName: playerName(p), positionNumber: p.positionNumber,
      minutesPlayed: perf.minutesPlayed, rating: calculateRating(perf),
      tackles: perf.tackles, missedTackles: perf.missedTackles, carries: perf.carries,
      metresGained: perf.metres, offloads: perf.offloads, turnoversWon: perf.turnoversWon,
      penaltiesConceded: perf.penaltiesConceded, triesScored: perf.tries, isMotm: false,
    };
  };

  const homePlayerRatings: PlayerMatchRating[] = homeTeam.players.slice(0, 23).map(mapPerf);
  const awayPlayerRatings: PlayerMatchRating[] = awayTeam.players.slice(0, 23).map(mapPerf);

  // MOTM
  const allRatings = [...homePlayerRatings, ...awayPlayerRatings];
  const motm = allRatings.reduce((best, cur) => cur.rating > best.rating ? cur : best, allRatings[0]);
  motm.isMotm = true;

  // Bonus points
  const homeBonus = {
    tryBonus: homeTries >= 4,
    losingBonus: homeScore < awayScore && (awayScore - homeScore) <= 7,
  };
  const awayBonus = {
    tryBonus: awayTries >= 4,
    losingBonus: awayScore < homeScore && (homeScore - awayScore) <= 7,
  };

  return {
    id: `match-${Date.now()}-${generateId()}`,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    homeScore, awayScore, homeTries, awayTries,
    homeBonus, awayBonus,
    events: events.sort((a, b) => a.minute - b.minute || a.second - b.second),
    homeStats, awayStats,
    homePlayerRatings, awayPlayerRatings,
    referee, weather,
    homeSubstitutions: homeSubsDone,
    awaySubstitutions: awaySubsDone,
    motmId: motm.playerId,
    motmName: motm.playerName,
    homeDiscipline, awayDiscipline,
  };
}

// Helper to create a default substitution plan from a team
export function createDefaultSubPlan(team: Team, benchSplit: BenchSplit = '5-3'): SubstitutionPlan {
  const startingXV = team.players.slice(0, 15).map(p => p.id);
  const bench = team.players.slice(15, 23).map(p => p.id);

  // Auto-generate sensible sub rules
  const rules: SubstitutionRule[] = [];

  // Front row subs at 50-55 mins
  const frontRowStarters = team.players.filter(p => [1, 2, 3].includes(p.positionNumber)).slice(0, 3);
  const frontRowBench = team.players.filter(p => [1, 2, 3].includes(p.positionNumber)).slice(3, 6);
  frontRowStarters.forEach((starter, i) => {
    if (frontRowBench[i]) {
      rules.push({
        id: generateId(),
        playerOffId: starter.id,
        playerOnId: frontRowBench[i].id,
        triggerMinute: 50 + Math.floor(Math.random() * 8),
        condition: 'always',
        priority: 1,
        executed: false,
      });
    }
  });

  // Back row / lock sub at 55-62
  const lockStarters = team.players.filter(p => [4, 5].includes(p.positionNumber)).slice(0, 2);
  const lockBench = team.players.filter(p => [4, 5, 6, 7, 8].includes(p.positionNumber)).slice(2);
  if (lockBench[0] && lockStarters[0]) {
    rules.push({
      id: generateId(),
      playerOffId: lockStarters[0].id,
      playerOnId: lockBench[0].id,
      triggerMinute: 55 + Math.floor(Math.random() * 7),
      condition: 'always',
      priority: 2,
      executed: false,
    });
  }

  return {
    benchSplit,
    startingXV,
    bench,
    rules,
    impactSubRatings: {},
  };
}
