import { EnhancedMatchEvent } from '@/types/matchEngine';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface MatchCommentaryProps {
  events: EnhancedMatchEvent[];
  currentMinute: number;
  homeTeamShort: string;
  awayTeamShort: string;
}

function getEventIcon(type: EnhancedMatchEvent['type']): string {
  switch (type) {
    case 'try': case 'maul_try': return '🏉';
    case 'conversion': return '✅';
    case 'conversion_miss': return '❌';
    case 'penalty_goal': return '🎯';
    case 'penalty_miss': return '❌';
    case 'drop_goal': return '🥾';
    case 'yellow_card': return '🟡';
    case 'red_card': return '🔴';
    case 'sin_bin_return': return '↩️';
    case 'substitution': return '🔄';
    case 'tmo_review': return '📺';
    case 'team_warning': return '⚠️';
    case 'turnover': case 'jackal': return '🔄';
    case 'line_break': return '💨';
    case 'big_tackle': return '💥';
    case 'fifty_22': return '🎯';
    case 'scrum_penalty': case 'maul_penalty': return '⚖️';
    case 'lineout_stolen': return '🤲';
    case 'half_time': case 'full_time': return '⏱️';
    case 'kickoff': return '🏈';
    case 'captain_referee': return '🗣️';
    case 'sideline_instruction': return '📋';
    default: return '•';
  }
}

function getEventVariant(type: EnhancedMatchEvent['type']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (type) {
    case 'try': case 'maul_try': case 'conversion': case 'penalty_goal': case 'drop_goal':
      return 'default';
    case 'yellow_card': case 'red_card': case 'team_warning':
      return 'destructive';
    case 'half_time': case 'full_time': case 'tmo_review':
      return 'outline';
    default:
      return 'secondary';
  }
}

export function MatchCommentary({ events, currentMinute, homeTeamShort, awayTeamShort }: MatchCommentaryProps) {
  const visibleEvents = events.filter(e => e.minute <= currentMinute);
  const reversed = [...visibleEvents].reverse();

  return (
    <ScrollArea className="h-80">
      <div className="space-y-2 pr-4">
        {reversed.map(event => (
          <div
            key={event.id}
            className={`p-3 rounded-lg border transition-all ${
              event.isKeyMoment ? 'border-primary bg-primary/5' : 'border-border/50 bg-card'
            } ${event.type === 'half_time' || event.type === 'full_time' ? 'text-center bg-muted' : ''}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{getEventIcon(event.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="outline" className="text-xs">{event.minute}'</Badge>
                  <Badge variant={getEventVariant(event.type)} className="text-xs">
                    {event.type.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {event.team === 'home' ? homeTeamShort : awayTeamShort}
                  </Badge>
                  {event.scoreDelta && (
                    <span className="text-xs font-bold text-primary">+{event.scoreDelta}</span>
                  )}
                </div>
                <p className="text-sm text-foreground">{event.commentary}</p>
                {event.player && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    #{event.player.number} {event.player.name}
                    {event.player2 && ` → #${event.player2.number} ${event.player2.name}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {reversed.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Match events will appear here...</p>
        )}
      </div>
    </ScrollArea>
  );
}
