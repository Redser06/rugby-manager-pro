import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EuroPool, EuroPoolMatch } from '@/types/europeanCompetition';
import { getAllTeams } from '@/data/leagues';
import { Check, Clock, Calendar } from 'lucide-react';

interface PoolMatchesProps {
  pool: EuroPool;
  myTeamId?: string;
}

export function PoolMatches({ pool, myTeamId }: PoolMatchesProps) {
  const allTeams = getAllTeams();
  
  const getTeamName = (teamId: string) => {
    const poolTeam = pool.teams.find(t => t.teamId === teamId);
    if (poolTeam) return poolTeam.teamName;
    const team = allTeams.find(t => t.id === teamId);
    return team?.name || 'TBD';
  };

  const matchesByRound = pool.matches.reduce((acc, match) => {
    const round = match.round;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, EuroPoolMatch[]>);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Fixtures
      </h4>
      <ScrollArea className="h-48">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(round => {
            const matches = matchesByRound[round] || [];
            if (matches.length === 0) return null;
            
            return (
              <div key={round} className="space-y-2">
                <Badge variant="outline" className="text-xs">Round {round}</Badge>
                <div className="space-y-1">
                  {matches.map(match => {
                    const isMyMatch = match.homeTeamId === myTeamId || match.awayTeamId === myTeamId;
                    const homeName = getTeamName(match.homeTeamId);
                    const awayName = getTeamName(match.awayTeamId);
                    
                    return (
                      <div 
                        key={match.id}
                        className={`flex items-center justify-between p-2 rounded-md text-sm ${
                          isMyMatch ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`text-right flex-1 truncate ${
                            match.homeTeamId === myTeamId ? 'font-bold text-primary' : ''
                          }`}>
                            {homeName}
                          </span>
                          
                          {match.played ? (
                            <Badge variant="secondary" className="font-mono min-w-[60px] justify-center">
                              {match.homeScore} - {match.awayScore}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="min-w-[60px] justify-center">
                              <Clock className="h-3 w-3" />
                            </Badge>
                          )}
                          
                          <span className={`text-left flex-1 truncate ${
                            match.awayTeamId === myTeamId ? 'font-bold text-primary' : ''
                          }`}>
                            {awayName}
                          </span>
                        </div>
                        
                        {match.played && (
                          <Check className="h-4 w-4 text-primary ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
