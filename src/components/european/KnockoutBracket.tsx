import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EuroKnockoutBracket, EuroKnockoutMatch } from '@/types/europeanCompetition';
import { getAllTeams } from '@/data/leagues';
import { Trophy, ArrowRight } from 'lucide-react';

interface KnockoutBracketProps {
  bracket: EuroKnockoutBracket;
  myTeamId?: string;
}

export function KnockoutBracket({ bracket, myTeamId }: KnockoutBracketProps) {
  const allTeams = getAllTeams();
  
  const getTeamName = (teamId: string | null) => {
    if (!teamId) return 'TBD';
    const team = allTeams.find(t => t.id === teamId);
    return team?.shortName || team?.name || 'TBD';
  };

  return (
    <div className="space-y-6">
      {/* Round of 16 */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Badge variant="outline">Round of 16</Badge>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {bracket.roundOf16.map(match => (
            <KnockoutMatchCard key={match.id} match={match} myTeamId={myTeamId} getTeamName={getTeamName} />
          ))}
        </div>
      </div>

      {/* Quarter Finals */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Badge variant="outline">Quarter Finals</Badge>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {bracket.quarterFinals.map(match => (
            <KnockoutMatchCard key={match.id} match={match} myTeamId={myTeamId} getTeamName={getTeamName} />
          ))}
        </div>
      </div>

      {/* Semi Finals */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Badge variant="outline">Semi Finals</Badge>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
          {bracket.semiFinals.map(match => (
            <KnockoutMatchCard key={match.id} match={match} myTeamId={myTeamId} getTeamName={getTeamName} />
          ))}
        </div>
      </div>

      {/* Final */}
      {bracket.final && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2 justify-center">
            <Trophy className="h-5 w-5 text-primary" />
            <Badge variant="default">Final</Badge>
            <Trophy className="h-5 w-5 text-primary" />
          </h3>
          <div className="max-w-md mx-auto">
            <KnockoutMatchCard 
              match={bracket.final} 
              myTeamId={myTeamId} 
              getTeamName={getTeamName}
              isFinal 
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface KnockoutMatchCardProps {
  match: EuroKnockoutMatch;
  myTeamId?: string;
  getTeamName: (teamId: string | null) => string;
  isFinal?: boolean;
}

function KnockoutMatchCard({ match, myTeamId, getTeamName, isFinal }: KnockoutMatchCardProps) {
  const isMyMatch = match.homeTeamId === myTeamId || match.awayTeamId === myTeamId;
  const homeName = getTeamName(match.homeTeamId);
  const awayName = getTeamName(match.awayTeamId);
  const homeIsWinner = match.played && match.homeScore !== undefined && match.awayScore !== undefined && match.homeScore > match.awayScore;
  const awayIsWinner = match.played && match.homeScore !== undefined && match.awayScore !== undefined && match.awayScore > match.homeScore;

  return (
    <Card className={`${isMyMatch ? 'border-primary' : ''} ${isFinal ? 'border-2 border-primary' : ''}`}>
      <CardContent className="p-3 space-y-2">
        {/* Home Team */}
        <div className={`flex items-center justify-between p-2 rounded ${
          homeIsWinner ? 'bg-primary/10' : 'bg-muted/50'
        }`}>
          <div className="flex items-center gap-2">
            {match.homeHasAdvantage && (
              <Badge variant="outline" className="text-[10px] px-1">H</Badge>
            )}
            <span className={`text-sm ${
              match.homeTeamId === myTeamId ? 'font-bold text-primary' : ''
            } ${homeIsWinner ? 'font-semibold' : ''}`}>
              {homeName}
            </span>
          </div>
          {match.played && (
            <span className={`font-mono font-bold ${homeIsWinner ? 'text-primary' : ''}`}>
              {match.homeScore}
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className={`flex items-center justify-between p-2 rounded ${
          awayIsWinner ? 'bg-primary/10' : 'bg-muted/50'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${
              match.awayTeamId === myTeamId ? 'font-bold text-primary' : ''
            } ${awayIsWinner ? 'font-semibold' : ''}`}>
              {awayName}
            </span>
          </div>
          {match.played && (
            <span className={`font-mono font-bold ${awayIsWinner ? 'text-primary' : ''}`}>
              {match.awayScore}
            </span>
          )}
        </div>

        {/* Venue for final */}
        {isFinal && match.venue && (
          <div className="text-center text-xs text-muted-foreground pt-1">
            {match.venue}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
