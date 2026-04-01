import { PlayerMatchRating } from '@/types/matchEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Award } from 'lucide-react';

interface PlayerRatingsPanelProps {
  homeRatings: PlayerMatchRating[];
  awayRatings: PlayerMatchRating[];
  homeTeamName: string;
  awayTeamName: string;
}

function RatingBadge({ rating }: { rating: number }) {
  const color = rating >= 8 ? 'bg-green-600' : rating >= 7 ? 'bg-green-500' : rating >= 6 ? 'bg-yellow-500' : rating >= 5 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <span className={`${color} text-white text-xs font-bold px-2 py-0.5 rounded`}>
      {rating.toFixed(1)}
    </span>
  );
}

function TeamRatings({ ratings, teamName }: { ratings: PlayerMatchRating[]; teamName: string }) {
  const sorted = [...ratings].filter(r => r.minutesPlayed > 0).sort((a, b) => b.rating - a.rating);
  return (
    <div className="space-y-1">
      <h4 className="font-semibold text-sm mb-2">{teamName}</h4>
      {sorted.map(r => (
        <div key={r.playerId} className="flex items-center gap-2 text-sm py-1 border-b border-border/50">
          <Badge variant="outline" className="w-7 text-center text-xs">{r.positionNumber}</Badge>
          <span className="flex-1 truncate">
            {r.playerName}
            {r.isMotm && <Award className="inline h-3 w-3 ml-1 text-yellow-500" />}
          </span>
          {r.triesScored > 0 && <span className="text-xs text-muted-foreground">🏉×{r.triesScored}</span>}
          {r.turnoversWon > 0 && <span className="text-xs text-muted-foreground">🔄{r.turnoversWon}</span>}
          <span className="text-xs text-muted-foreground">{r.minutesPlayed}'</span>
          <RatingBadge rating={r.rating} />
        </div>
      ))}
    </div>
  );
}

export function PlayerRatingsPanel({ homeRatings, awayRatings, homeTeamName, awayTeamName }: PlayerRatingsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5" />
          Player Ratings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TeamRatings ratings={homeRatings} teamName={homeTeamName} />
          <TeamRatings ratings={awayRatings} teamName={awayTeamName} />
        </div>
      </CardContent>
    </Card>
  );
}
