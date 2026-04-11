import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { GameState, Team, League, Match, Player, TeamKit, FacilityUpgradeRequest, TeamFacilities } from '@/types/game';
import { StaffMember, CoachingPhilosophy } from '@/types/staff';
import { LEAGUES, getTeamById, getLeagueByTeamId } from '@/data/leagues';
import { SeasonSchedule } from '@/types/fixture';
import { generateSeasonFixtures } from '@/utils/fixtureGenerator';
import { simulateWeek, WeekSimResult } from '@/engine/gameLoop';

interface GameContextType {
  gameState: GameState;
  schedule: SeasonSchedule | null;
  lastMatchResult: WeekSimResult['playerMatchResult'] | null;
  selectTeam: (teamId: string) => void;
  advanceWeek: () => void;
  updateTactics: (tactics: Team['tactics']) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  updateKit: (kit: TeamKit) => void;
  removePlayer: (playerId: string) => void;
  replaceSquad: (players: Player[]) => void;
  requestFacilityUpgrade: (request: Omit<FacilityUpgradeRequest, 'id' | 'requestedAt' | 'status'>) => void;
  updateStaff: (staff: StaffMember[]) => void;
  updatePhilosophy: (philosophy: CoachingPhilosophy) => void;
  getMyTeam: () => Team | null;
  getMyLeague: () => League | null;
  loadGameState: (state: GameState) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_STATE: GameState = {
  currentWeek: 1,
  currentSeason: 1,
  selectedTeam: null,
  leagues: LEAGUES,
  upcomingMatches: []
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('rugbyManagerState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [schedule, setSchedule] = useState<SeasonSchedule | null>(() => {
    if (!gameState.selectedTeam) return null;
    const league = getLeagueByTeamId(gameState.selectedTeam.id);
    if (!league) return null;
    const savedKey = `fixtures-${league.id}-${gameState.currentSeason}`;
    const saved = localStorage.getItem(savedKey);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return null;
  });

  const [lastMatchResult, setLastMatchResult] = useState<WeekSimResult['playerMatchResult'] | null>(null);

  useEffect(() => {
    localStorage.setItem('rugbyManagerState', JSON.stringify(gameState));
  }, [gameState]);

  // Ensure schedule exists when a team is selected
  useEffect(() => {
    if (!gameState.selectedTeam || schedule) return;
    const league = getLeagueByTeamId(gameState.selectedTeam.id);
    if (!league) return;
    const savedKey = `fixtures-${league.id}-${gameState.currentSeason}`;
    const saved = localStorage.getItem(savedKey);
    if (saved) {
      try {
        setSchedule(JSON.parse(saved));
        return;
      } catch { /* fall through */ }
    }
    const newSchedule = generateSeasonFixtures(league, gameState.currentSeason);
    setSchedule(newSchedule);
    localStorage.setItem(savedKey, JSON.stringify(newSchedule));
  }, [gameState.selectedTeam, gameState.currentSeason, schedule]);

  const selectTeam = (teamId: string) => {
    const team = getTeamById(teamId);
    if (team) {
      setGameState(prev => ({
        ...prev,
        selectedTeam: team
      }));
      setSchedule(null); // Reset schedule so it regenerates for the new team's league
    }
  };

  const advanceWeek = () => {
    if (!schedule) {
      // No schedule, just increment
      setGameState(prev => ({ ...prev, currentWeek: prev.currentWeek + 1 }));
      return;
    }

    const result = simulateWeek(
      gameState.currentWeek,
      schedule,
      gameState.leagues,
      gameState.selectedTeam,
    );

    // Save updated schedule
    const league = gameState.selectedTeam ? getLeagueByTeamId(gameState.selectedTeam.id) : null;
    if (league) {
      localStorage.setItem(
        `fixtures-${league.id}-${gameState.currentSeason}`,
        JSON.stringify(result.updatedSchedule)
      );
    }
    setSchedule(result.updatedSchedule);
    setLastMatchResult(result.playerMatchResult || null);

    setGameState(prev => ({
      ...prev,
      currentWeek: prev.currentWeek + 1,
      leagues: result.updatedLeagues,
      selectedTeam: result.updatedTeam,
    }));
  };

  const updateTactics = (tactics: Team['tactics']) => {
    if (!gameState.selectedTeam) return;
    
    setGameState(prev => ({
      ...prev,
      selectedTeam: prev.selectedTeam ? {
        ...prev.selectedTeam,
        tactics
      } : null,
      leagues: prev.leagues.map(league => ({
        ...league,
        teams: league.teams.map(team => 
          team.id === prev.selectedTeam?.id 
            ? { ...team, tactics }
            : team
        )
      }))
    }));
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    if (!gameState.selectedTeam) return;

    const updatePlayerInArray = (players: Player[]) =>
      players.map(p => p.id === playerId ? { ...p, ...updates } : p);

    setGameState(prev => ({
      ...prev,
      selectedTeam: prev.selectedTeam ? {
        ...prev.selectedTeam,
        players: updatePlayerInArray(prev.selectedTeam.players)
      } : null,
      leagues: prev.leagues.map(league => ({
        ...league,
        teams: league.teams.map(team =>
          team.id === prev.selectedTeam?.id
            ? { ...team, players: updatePlayerInArray(team.players) }
            : team
        )
      }))
    }));
  };

  const updateKit = (kit: TeamKit) => {
    if (!gameState.selectedTeam) return;

    setGameState(prev => ({
      ...prev,
      selectedTeam: prev.selectedTeam ? {
        ...prev.selectedTeam,
        kit
      } : null,
      leagues: prev.leagues.map(league => ({
        ...league,
        teams: league.teams.map(team =>
          team.id === prev.selectedTeam?.id
            ? { ...team, kit }
            : team
        )
      }))
    }));
  };

  const removePlayer = (playerId: string) => {
    if (!gameState.selectedTeam) return;

    const filterPlayer = (players: Player[]) =>
      players.filter(p => p.id !== playerId);

    setGameState(prev => ({
      ...prev,
      selectedTeam: prev.selectedTeam ? {
        ...prev.selectedTeam,
        players: filterPlayer(prev.selectedTeam.players)
      } : null,
      leagues: prev.leagues.map(league => ({
        ...league,
        teams: league.teams.map(team =>
          team.id === prev.selectedTeam?.id
            ? { ...team, players: filterPlayer(team.players) }
            : team
        )
      }))
    }));
  };

  const requestFacilityUpgrade = (request: Omit<FacilityUpgradeRequest, 'id' | 'requestedAt' | 'status'>) => {
    if (!gameState.selectedTeam) return;

    const newRequest: FacilityUpgradeRequest = {
      ...request,
      id: Math.random().toString(36).substring(2, 9),
      requestedAt: new Date(),
      status: 'pending'
    };

    // Simulate board response (in a real game this would be more complex)
    const approved = Math.random() > 0.3; // 70% approval rate
    setTimeout(() => {
      setGameState(prev => {
        if (!prev.selectedTeam) return prev;
        
        const updatedRequests = prev.selectedTeam.facilities.upgradeRequests.map(r => 
          r.id === newRequest.id 
            ? { 
                ...r, 
                status: approved ? 'approved' as const : 'rejected' as const,
                boardResponse: approved 
                  ? 'The board has approved your request. Work will begin immediately.'
                  : 'The board has declined your request due to current financial constraints.'
              }
            : r
        );

        const updatedFacilities = {
          ...prev.selectedTeam.facilities,
          upgradeRequests: updatedRequests
        };

        return {
          ...prev,
          selectedTeam: { ...prev.selectedTeam, facilities: updatedFacilities },
          leagues: prev.leagues.map(league => ({
            ...league,
            teams: league.teams.map(team =>
              team.id === prev.selectedTeam?.id
                ? { ...team, facilities: updatedFacilities }
                : team
            )
          }))
        };
      });
    }, 3000); // Simulate 3 second delay for board decision

    // Add the request immediately as pending
    setGameState(prev => {
      if (!prev.selectedTeam) return prev;

      const updatedFacilities = {
        ...prev.selectedTeam.facilities,
        upgradeRequests: [...prev.selectedTeam.facilities.upgradeRequests, newRequest]
      };

      return {
        ...prev,
        selectedTeam: { ...prev.selectedTeam, facilities: updatedFacilities },
        leagues: prev.leagues.map(league => ({
          ...league,
          teams: league.teams.map(team =>
            team.id === prev.selectedTeam?.id
              ? { ...team, facilities: updatedFacilities }
              : team
          )
        }))
      };
    });
  };

  const getMyTeam = (): Team | null => {
    return gameState.selectedTeam;
  };

  const getMyLeague = (): League | null => {
    if (!gameState.selectedTeam) return null;
    return getLeagueByTeamId(gameState.selectedTeam.id) || null;
  };

  const loadGameState = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const resetGame = useCallback(() => {
    setGameState(INITIAL_STATE);
    localStorage.removeItem('rugbyManagerState');
  }, []);

  const replaceSquad = useCallback((players: Player[]) => {
    if (!gameState.selectedTeam) return;

    setGameState(prev => ({
      ...prev,
      selectedTeam: prev.selectedTeam ? {
        ...prev.selectedTeam,
        players
      } : null,
      leagues: prev.leagues.map(league => ({
        ...league,
        teams: league.teams.map(team =>
          team.id === prev.selectedTeam?.id
            ? { ...team, players }
            : team
        )
      }))
    }));
  }, [gameState.selectedTeam]);

  const updateStaff = useCallback((staff: StaffMember[]) => {
    if (!gameState.selectedTeam) return;
    setGameState(prev => ({
      ...prev,
      selectedTeam: prev.selectedTeam ? { ...prev.selectedTeam, staff } : null,
      leagues: prev.leagues.map(league => ({
        ...league,
        teams: league.teams.map(team =>
          team.id === prev.selectedTeam?.id ? { ...team, staff } : team
        )
      }))
    }));
  }, [gameState.selectedTeam]);

  const updatePhilosophy = useCallback((coachingPhilosophy: CoachingPhilosophy) => {
    if (!gameState.selectedTeam) return;
    setGameState(prev => ({
      ...prev,
      selectedTeam: prev.selectedTeam ? { ...prev.selectedTeam, coachingPhilosophy } : null,
      leagues: prev.leagues.map(league => ({
        ...league,
        teams: league.teams.map(team =>
          team.id === prev.selectedTeam?.id ? { ...team, coachingPhilosophy } : team
        )
      }))
    }));
  }, [gameState.selectedTeam]);

  return (
    <GameContext.Provider value={{
      gameState,
      selectTeam,
      advanceWeek,
      updateTactics,
      updatePlayer,
      updateKit,
      removePlayer,
      replaceSquad,
      requestFacilityUpgrade,
      updateStaff,
      updatePhilosophy,
      getMyTeam,
      getMyLeague,
      loadGameState,
      resetGame
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
