// Types for shareable season snapshots

export interface SeasonSnapshot {
  id: string;
  createdAt: string;
  expiresAt: string;
  
  // Team info
  teamId: string;
  teamName: string;
  teamCountry: string;
  leagueName: string;
  
  // Season progress
  season: number;
  week: number;
  
  // Domestic league standing
  standing: {
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    pointsFor: number;
    pointsAgainst: number;
    bonusPoints: number;
    totalPoints: number;
  };
  
  // European competition (if qualified)
  european?: {
    competition: 'champions' | 'challenge';
    poolLetter: string;
    poolPosition: number;
    poolWins: number;
    poolLosses: number;
    knockoutStage?: 'r16' | 'qf' | 'sf' | 'final' | 'winner';
  };
  
  // Squad highlights
  squadHighlights: {
    topTryScorer?: { name: string; tries: number };
    topPointsScorer?: { name: string; points: number };
    playerOfTheSeason?: { name: string; rating: number };
    averageAge: number;
    squadSize: number;
  };
  
  // Tactical identity
  tacticalIdentity: {
    attackStyle: string;
    defenseStyle: string;
    attackingShape: string;
    defensiveShape: string;
    tempo: string;
    keyMoves: string[];
  };
}

export interface ShareLink {
  id: string;
  snapshotId: string;
  shortCode: string;
  url: string;
  views: number;
  createdAt: string;
}
