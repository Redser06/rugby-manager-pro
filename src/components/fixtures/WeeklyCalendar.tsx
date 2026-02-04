import { useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { SeasonSchedule } from '@/types/fixture';
import { getWeekFixtures } from '@/utils/fixtureGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Home,
  Plane,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeeklyCalendarProps {
  schedule: SeasonSchedule;
  teamId: string;
  currentWeek: number;
  onWeekChange?: (week: number) => void;
}

export function WeeklyCalendar({ schedule, teamId, currentWeek, onWeekChange }: WeeklyCalendarProps) {
  const weeks = useMemo(() => {
    const allWeeks: number[] = [];
    const maxWeek = Math.max(...schedule.fixtures.map(f => f.week));
    for (let i = 1; i <= maxWeek; i++) {
      allWeeks.push(i);
    }
    return allWeeks;
  }, [schedule]);
  
  const getWeekStatus = (week: number) => {
    const fixtures = getWeekFixtures(schedule, week);
    const teamFixture = fixtures.find(f => 
      f.homeTeamId === teamId || f.awayTeamId === teamId
    );
    
    if (!teamFixture) return { type: 'bye' as const };
    
    const isHome = teamFixture.homeTeamId === teamId;
    
    return {
      type: teamFixture.status === 'postponed' ? 'postponed' as const : 
            teamFixture.status === 'completed' ? 'completed' as const : 'fixture' as const,
      fixture: teamFixture,
      isHome,
      opponent: isHome ? teamFixture.awayTeamName : teamFixture.homeTeamName,
      hasTrainingRestriction: !isHome && teamFixture.travel?.trainingRestriction,
    };
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Season Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => onWeekChange?.(Math.max(1, currentWeek - 1))}
              disabled={currentWeek <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-20 text-center">
              Week {currentWeek}
            </span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => onWeekChange?.(currentWeek + 1)}
              disabled={currentWeek >= schedule.totalWeeks}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex gap-1 pb-2" style={{ minWidth: weeks.length * 60 }}>
            {weeks.map(week => {
              const status = getWeekStatus(week);
              const isCurrent = week === currentWeek;
              const isPast = week < currentWeek;
              
              return (
                <button
                  key={week}
                  onClick={() => onWeekChange?.(week)}
                  className={`
                    flex-shrink-0 w-14 p-2 rounded-lg text-center transition-all
                    ${isCurrent ? 'ring-2 ring-primary bg-primary/10' : ''}
                    ${isPast ? 'opacity-60' : ''}
                    ${status.type === 'bye' ? 'bg-muted' : ''}
                    ${status.type === 'postponed' ? 'bg-destructive/10' : ''}
                    ${status.type === 'completed' ? 'bg-secondary' : ''}
                    ${status.type === 'fixture' && !isCurrent ? 'bg-card border hover:border-primary' : ''}
                    cursor-pointer
                  `}
                >
                  <div className="text-xs text-muted-foreground mb-1">W{week}</div>
                  
                  {status.type === 'bye' && (
                    <div className="text-xs text-muted-foreground">BYE</div>
                  )}
                  
                  {status.type === 'postponed' && (
                    <AlertTriangle className="h-4 w-4 mx-auto text-destructive" />
                  )}
                  
                  {(status.type === 'fixture' || status.type === 'completed') && status.isHome !== undefined && (
                    <>
                      {status.isHome ? (
                        <Home className="h-4 w-4 mx-auto text-primary" />
                      ) : (
                        <Plane className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                      {status.hasTrainingRestriction && (
                        <div className="w-2 h-2 rounded-full bg-destructive mx-auto mt-1" />
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Home className="h-3 w-3 text-primary" />
            <span>Home</span>
          </div>
          <div className="flex items-center gap-1">
            <Plane className="h-3 w-3" />
            <span>Away</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted" />
            <span>Bye Week</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            <span>Postponed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span>Training Restricted</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
