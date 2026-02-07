import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useGame } from '@/contexts/GameContext';
import {
  SixNationsState,
  SixNationsNation,
  SixNationsCallUp,
  SixNationsFixture,
  NationalTeam,
  SIX_NATIONS_START_WEEK,
  SIX_NATIONS_END_WEEK,
} from '@/types/sixNations';
import {
  generateSixNationsFixtures,
  createInitialStandings,
  createNationalTeams,
  generateCallUps,
  simulateSixNationsMatch,
  generatePostTournamentOutcomes,
  updateStandings,
  getEligiblePlayers,
  autoSelectNationalSquad,
} from '@/data/sixNationsData';
import { Player } from '@/types/game';
import { TeamTactics } from '@/types/game';

interface SixNationsContextType {
  sixNationsState: SixNationsState | null;
  initTournament: (userNation: SixNationsNation | null) => void;
  isSixNationsWindow: () => boolean;
  isPlayerCalledUp: (playerId: string) => boolean;
  getCallUpsForClub: (teamId: string) => SixNationsCallUp[];
  selectPlayerForNation: (playerId: string, nation: SixNationsNation) => void;
  removePlayerFromNation: (playerId: string, nation: SixNationsNation) => void;
  updateNationalTactics: (nation: SixNationsNation, tactics: TeamTactics) => void;
  simulateRound: (round: number) => void;
  completeTournament: () => void;
  getEligiblePlayersForNation: (nation: SixNationsNation) => Array<Player & { clubTeamId: string; clubTeamName: string }>;
}

const SixNationsContext = createContext<SixNationsContextType | undefined>(undefined);

export function SixNationsProvider({ children }: { children: ReactNode }) {
  const { gameState, updatePlayer } = useGame();
  const [sixNationsState, setSixNationsState] = useState<SixNationsState | null>(() => {
    const saved = localStorage.getItem('sixNationsState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Persist state
  const updateState = useCallback((newState: SixNationsState | null) => {
    setSixNationsState(newState);
    if (newState) {
      localStorage.setItem('sixNationsState', JSON.stringify(newState));
    } else {
      localStorage.removeItem('sixNationsState');
    }
  }, []);

  const isSixNationsWindow = useCallback(() => {
    return gameState.currentWeek >= SIX_NATIONS_START_WEEK &&
           gameState.currentWeek <= SIX_NATIONS_END_WEEK;
  }, [gameState.currentWeek]);

  const initTournament = useCallback((userNation: SixNationsNation | null) => {
    const fixtures = generateSixNationsFixtures(SIX_NATIONS_START_WEEK);
    const nationalTeams = createNationalTeams(gameState.leagues);
    const callUps = generateCallUps(nationalTeams, gameState.leagues);
    const standings = createInitialStandings();

    const state: SixNationsState = {
      active: true,
      currentRound: 1,
      startWeek: SIX_NATIONS_START_WEEK,
      endWeek: SIX_NATIONS_END_WEEK,
      nationalTeams,
      fixtures,
      standings,
      callUps,
      completed: false,
      userNation,
    };

    updateState(state);
  }, [gameState.leagues, updateState]);

  const isPlayerCalledUp = useCallback((playerId: string) => {
    if (!sixNationsState?.active) return false;
    return sixNationsState.callUps.some(c => c.playerId === playerId);
  }, [sixNationsState]);

  const getCallUpsForClub = useCallback((teamId: string) => {
    if (!sixNationsState?.active) return [];
    return sixNationsState.callUps.filter(c => c.clubTeamId === teamId);
  }, [sixNationsState]);

  const getEligiblePlayersForNation = useCallback((nation: SixNationsNation) => {
    return getEligiblePlayers(nation, gameState.leagues);
  }, [gameState.leagues]);

  const selectPlayerForNation = useCallback((playerId: string, nation: SixNationsNation) => {
    if (!sixNationsState) return;

    // Find the player from leagues
    let foundPlayer: Player | null = null;
    let clubTeamId = '';
    let clubTeamName = '';
    for (const league of gameState.leagues) {
      for (const team of league.teams) {
        const p = team.players.find(pl => pl.id === playerId);
        if (p) {
          foundPlayer = p;
          clubTeamId = team.id;
          clubTeamName = team.name;
          break;
        }
      }
      if (foundPlayer) break;
    }
    if (!foundPlayer) return;

    const updatedTeams = sixNationsState.nationalTeams.map(nt => {
      if (nt.nation !== nation) return nt;
      if (nt.squad.some(p => p.id === playerId)) return nt; // Already in squad
      return { ...nt, squad: [...nt.squad, foundPlayer!] };
    });

    const newCallUp: SixNationsCallUp = {
      playerId,
      playerName: `${foundPlayer.firstName} ${foundPlayer.lastName}`,
      nation,
      clubTeamId,
      clubTeamName,
      position: foundPlayer.position,
      overall: foundPlayer.overall,
      injured: false,
      injuryWeeks: 0,
      suspended: false,
      suspensionWeeks: 0,
    };

    updateState({
      ...sixNationsState,
      nationalTeams: updatedTeams,
      callUps: [...sixNationsState.callUps.filter(c => c.playerId !== playerId), newCallUp],
    });
  }, [sixNationsState, gameState.leagues, updateState]);

  const removePlayerFromNation = useCallback((playerId: string, nation: SixNationsNation) => {
    if (!sixNationsState) return;

    const updatedTeams = sixNationsState.nationalTeams.map(nt => {
      if (nt.nation !== nation) return nt;
      return { ...nt, squad: nt.squad.filter(p => p.id !== playerId) };
    });

    updateState({
      ...sixNationsState,
      nationalTeams: updatedTeams,
      callUps: sixNationsState.callUps.filter(c => c.playerId !== playerId),
    });
  }, [sixNationsState, updateState]);

  const updateNationalTactics = useCallback((nation: SixNationsNation, tactics: TeamTactics) => {
    if (!sixNationsState) return;

    const updatedTeams = sixNationsState.nationalTeams.map(nt => {
      if (nt.nation !== nation) return nt;
      return { ...nt, tactics };
    });

    updateState({ ...sixNationsState, nationalTeams: updatedTeams });
  }, [sixNationsState, updateState]);

  const simulateRound = useCallback((round: number) => {
    if (!sixNationsState) return;

    const roundFixtures = sixNationsState.fixtures.filter(f => f.round === round && !f.played);
    let updatedFixtures = [...sixNationsState.fixtures];
    let updatedStandings = [...sixNationsState.standings];

    for (const fixture of roundFixtures) {
      const homeTeam = sixNationsState.nationalTeams.find(nt => nt.nation === fixture.homeNation);
      const awayTeam = sixNationsState.nationalTeams.find(nt => nt.nation === fixture.awayNation);
      if (!homeTeam || !awayTeam) continue;

      const result = simulateSixNationsMatch(homeTeam, awayTeam);

      const updatedFixture: SixNationsFixture = {
        ...fixture,
        played: true,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        homeTries: result.homeTries,
        awayTries: result.awayTries,
        events: result.events,
      };

      updatedFixtures = updatedFixtures.map(f =>
        f.id === fixture.id ? updatedFixture : f
      );

      updatedStandings = updateStandings(updatedStandings, updatedFixture);
    }

    // Sort standings
    updatedStandings.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
      return b.triesFor - a.triesFor;
    });

    const nextRound = round + 1;
    const isCompleted = nextRound > 5;

    updateState({
      ...sixNationsState,
      fixtures: updatedFixtures,
      standings: updatedStandings,
      currentRound: isCompleted ? 5 : nextRound,
      completed: isCompleted,
    });
  }, [sixNationsState, updateState]);

  const completeTournament = useCallback(() => {
    if (!sixNationsState) return;

    // Generate injury/suspension outcomes
    const updatedCallUps = generatePostTournamentOutcomes(sixNationsState.callUps);

    // Apply injuries/suspensions to actual players in game state
    for (const callUp of updatedCallUps) {
      if (callUp.injured) {
        updatePlayer(callUp.playerId, {
          injured: true,
          injuryWeeks: callUp.injuryWeeks,
          fitness: Math.max(30, 80 - callUp.injuryWeeks * 10),
        });
      }
      if (callUp.suspended) {
        // Reduce form for suspended players
        updatePlayer(callUp.playerId, {
          form: Math.max(1, 5 - callUp.suspensionWeeks),
        });
      }
    }

    updateState({
      ...sixNationsState,
      callUps: updatedCallUps,
      active: false,
      completed: true,
    });
  }, [sixNationsState, updatePlayer, updateState]);

  return (
    <SixNationsContext.Provider value={{
      sixNationsState,
      initTournament,
      isSixNationsWindow,
      isPlayerCalledUp,
      getCallUpsForClub,
      selectPlayerForNation,
      removePlayerFromNation,
      updateNationalTactics,
      simulateRound,
      completeTournament,
      getEligiblePlayersForNation,
    }}>
      {children}
    </SixNationsContext.Provider>
  );
}

export function useSixNations() {
  const context = useContext(SixNationsContext);
  if (!context) {
    throw new Error('useSixNations must be used within a SixNationsProvider');
  }
  return context;
}
