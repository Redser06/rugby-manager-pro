import { useState, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { SeasonSnapshot, ShareLink } from '@/types/share';

// Generate a short random code for share links
function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useSeasonShare() {
  const { gameState, getMyTeam, getMyLeague } = useGame();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSnapshot, setCurrentSnapshot] = useState<SeasonSnapshot | null>(null);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);

  const generateSnapshot = useCallback((): SeasonSnapshot | null => {
    const team = getMyTeam();
    const league = getMyLeague();
    
    if (!team || !league) return null;

    // Find team's standing in league
    const standing = league.standings.find(s => s.teamId === team.id);
    const sortedStandings = [...league.standings].sort((a, b) => b.totalPoints - a.totalPoints);
    const position = sortedStandings.findIndex(s => s.teamId === team.id) + 1;

    // Calculate squad highlights
    const players = team.players;
    const averageAge = players.reduce((sum, p) => sum + p.age, 0) / players.length;
    
    // Mock top performers (in a real game, these would come from match stats)
    const topPlayer = players.reduce((best, p) => p.overall > best.overall ? p : best, players[0]);

    const snapshot: SeasonSnapshot = {
      id: `snapshot_${Date.now()}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      
      teamId: team.id,
      teamName: team.name,
      teamCountry: team.country,
      leagueName: league.name,
      
      season: gameState.currentSeason,
      week: gameState.currentWeek,
      
      standing: {
        position,
        played: standing?.played || 0,
        won: standing?.won || 0,
        drawn: standing?.drawn || 0,
        lost: standing?.lost || 0,
        pointsFor: standing?.pointsFor || 0,
        pointsAgainst: standing?.pointsAgainst || 0,
        bonusPoints: standing?.bonusPoints || 0,
        totalPoints: standing?.totalPoints || 0,
      },
      
      // European would be populated if team is in European competition
      european: undefined,
      
      squadHighlights: {
        playerOfTheSeason: {
          name: `${topPlayer.firstName} ${topPlayer.lastName}`,
          rating: topPlayer.overall,
        },
        averageAge: Math.round(averageAge * 10) / 10,
        squadSize: players.length,
      },
      
      tacticalIdentity: {
        attackStyle: team.tactics.attackStyle,
        defenseStyle: team.tactics.defenseStyle,
        attackingShape: '2-4-2', // Would come from extended tactics
        defensiveShape: 'umbrella',
        tempo: team.tactics.tempo,
        keyMoves: ['Crash Ball', 'Miss 13'], // Would come from selected backs moves
      },
    };

    return snapshot;
  }, [gameState, getMyTeam, getMyLeague]);

  const createShareLink = useCallback(async (): Promise<ShareLink | null> => {
    setIsGenerating(true);
    
    try {
      const snapshot = generateSnapshot();
      if (!snapshot) {
        setIsGenerating(false);
        return null;
      }

      setCurrentSnapshot(snapshot);

      // Store snapshot in localStorage for now (would be in Supabase in production)
      const shortCode = generateShortCode();
      const existingSnapshots = JSON.parse(localStorage.getItem('seasonSnapshots') || '{}');
      existingSnapshots[shortCode] = snapshot;
      localStorage.setItem('seasonSnapshots', JSON.stringify(existingSnapshots));

      const baseUrl = window.location.origin;
      const link: ShareLink = {
        id: `link_${Date.now()}`,
        snapshotId: snapshot.id,
        shortCode,
        url: `${baseUrl}/share/${shortCode}`,
        views: 0,
        createdAt: new Date().toISOString(),
      };

      setShareLink(link);
      setIsGenerating(false);
      return link;
    } catch (error) {
      console.error('Failed to create share link:', error);
      setIsGenerating(false);
      return null;
    }
  }, [generateSnapshot]);

  const getSnapshotByCode = useCallback((code: string): SeasonSnapshot | null => {
    try {
      const snapshots = JSON.parse(localStorage.getItem('seasonSnapshots') || '{}');
      return snapshots[code] || null;
    } catch {
      return null;
    }
  }, []);

  return {
    isGenerating,
    currentSnapshot,
    shareLink,
    generateSnapshot,
    createShareLink,
    getSnapshotByCode,
  };
}
