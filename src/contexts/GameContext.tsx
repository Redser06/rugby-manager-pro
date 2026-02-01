import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameState, Team, League, Match, Player } from '@/types/game';
import { LEAGUES, getTeamById, getLeagueByTeamId } from '@/data/leagues';

interface GameContextType {
  gameState: GameState;
  selectTeam: (teamId: string) => void;
  advanceWeek: () => void;
  updateTactics: (tactics: Team['tactics']) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  getMyTeam: () => Team | null;
  getMyLeague: () => League | null;
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

  useEffect(() => {
    localStorage.setItem('rugbyManagerState', JSON.stringify(gameState));
  }, [gameState]);

  const selectTeam = (teamId: string) => {
    const team = getTeamById(teamId);
    if (team) {
      setGameState(prev => ({
        ...prev,
        selectedTeam: team
      }));
    }
  };

  const advanceWeek = () => {
    setGameState(prev => ({
      ...prev,
      currentWeek: prev.currentWeek + 1
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

  const getMyTeam = (): Team | null => {
    return gameState.selectedTeam;
  };

  const getMyLeague = (): League | null => {
    if (!gameState.selectedTeam) return null;
    return getLeagueByTeamId(gameState.selectedTeam.id) || null;
  };

  return (
    <GameContext.Provider value={{
      gameState,
      selectTeam,
      advanceWeek,
      updateTactics,
      updatePlayer,
      getMyTeam,
      getMyLeague
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
