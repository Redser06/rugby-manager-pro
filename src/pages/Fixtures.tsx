import { useState, useEffect, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { SeasonSchedule } from '@/types/fixture';
import { generateSeasonFixtures, getTeamFixtures, getWeekFixtures, findRescheduleWeek } from '@/utils/fixtureGenerator';
import { FixturesList } from '@/components/fixtures/FixturesList';
import { WeeklyCalendar } from '@/components/fixtures/WeeklyCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  AlertTriangle, 
  MapPin,
  Clock,
  Home,
  Plane,
  RefreshCw
} from 'lucide-react';

export default function Fixtures() {
  const { gameState, getMyTeam, getMyLeague } = useGame();
  const team = getMyTeam();
  const league = getMyLeague();
  
  // Generate/load schedule
  const [schedule, setSchedule] = useState<SeasonSchedule | null>(null);
  
  useEffect(() => {
    if (league && !schedule) {
      // Check localStorage for existing schedule
      const savedKey = `fixtures-${league.id}-${gameState.currentSeason}`;
      const saved = localStorage.getItem(savedKey);
      
      if (saved) {
        try {
          setSchedule(JSON.parse(saved));
        } catch {
          const newSchedule = generateSeasonFixtures(league, gameState.currentSeason);
          setSchedule(newSchedule);
          localStorage.setItem(savedKey, JSON.stringify(newSchedule));
        }
      } else {
        const newSchedule = generateSeasonFixtures(league, gameState.currentSeason);
        setSchedule(newSchedule);
        localStorage.setItem(savedKey, JSON.stringify(newSchedule));
      }
    }
  }, [league, gameState.currentSeason, schedule]);
  
  // Update schedule when week changes (sync current week)
  useEffect(() => {
    if (schedule && schedule.currentWeek !== gameState.currentWeek) {
      const updatedSchedule = { ...schedule, currentWeek: gameState.currentWeek };
      setSchedule(updatedSchedule);
      if (league) {
        localStorage.setItem(
          `fixtures-${league.id}-${gameState.currentSeason}`,
          JSON.stringify(updatedSchedule)
        );
      }
    }
  }, [gameState.currentWeek, schedule, league]);
  
  const regenerateFixtures = () => {
    if (!league) return;
    const newSchedule = generateSeasonFixtures(league, gameState.currentSeason);
    setSchedule(newSchedule);
    localStorage.setItem(
      `fixtures-${league.id}-${gameState.currentSeason}`,
      JSON.stringify(newSchedule)
    );
  };
  
  if (!team || !league) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please select a team first</p>
      </div>
    );
  }
  
  if (!schedule) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading fixtures...</p>
      </div>
    );
  }
  
  // Get this week's fixture for the team
  const thisWeekFixtures = getWeekFixtures(schedule, gameState.currentWeek);
  const myFixture = thisWeekFixtures.find(f => 
    f.homeTeamId === team.id || f.awayTeamId === team.id
  );
  
  // Get upcoming fixtures with travel restrictions
  const travelRestrictedWeeks = schedule.fixtures
    .filter(f => 
      f.awayTeamId === team.id && 
      f.travel?.trainingRestriction &&
      f.week >= gameState.currentWeek
    )
    .slice(0, 3);
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fixtures</h1>
          <p className="text-muted-foreground">
            {league.name} • Season {gameState.currentSeason} • Week {gameState.currentWeek}
          </p>
        </div>
        <Button variant="outline" onClick={regenerateFixtures}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerate Schedule
        </Button>
      </div>
      
      {/* This Week's Match */}
      {myFixture && (
        <Card className={myFixture.status === 'postponed' ? 'border-destructive' : 'border-primary'}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              This Week's Match
              {myFixture.status === 'postponed' && (
                <Badge variant="destructive">Postponed</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 text-lg">
                  <span className={myFixture.homeTeamId === team.id ? 'font-bold' : ''}>
                    {myFixture.homeTeamName}
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <span className={myFixture.awayTeamId === team.id ? 'font-bold' : ''}>
                    {myFixture.awayTeamName}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {myFixture.venue}
                  </div>
                  {myFixture.awayTeamId === team.id && myFixture.travel && (
                    <div className="flex items-center gap-1">
                      <Plane className="h-4 w-4" />
                      {myFixture.travel.distance} km • {myFixture.travel.travelTime}h
                    </div>
                  )}
                </div>
                
                {myFixture.status === 'postponed' && myFixture.postponementReason && (
                  <div className="flex items-center gap-2 mt-3 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    {myFixture.postponementReason}
                  </div>
                )}
              </div>
              
              <div className="text-right">
                {myFixture.homeTeamId === team.id ? (
                  <Badge className="bg-primary">
                    <Home className="h-3 w-3 mr-1" />
                    Home
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Plane className="h-3 w-3 mr-1" />
                    Away
                  </Badge>
                )}
                {myFixture.weather && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {myFixture.weather.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!myFixture && (
        <Card>
          <CardContent className="py-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Bye Week</h3>
            <p className="text-muted-foreground">No fixture scheduled for this week</p>
          </CardContent>
        </Card>
      )}
      
      {/* Training Alerts */}
      {travelRestrictedWeeks.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Travel Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              The following away fixtures require overnight travel. Training will be restricted the day before:
            </p>
            <div className="flex flex-wrap gap-2">
              {travelRestrictedWeeks.map(f => (
                <Badge key={f.id} variant="outline" className="bg-yellow-500/10">
                  Week {f.week}: @ {f.homeTeamName} ({f.travel?.distance} km)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Calendar View */}
      <WeeklyCalendar 
        schedule={schedule}
        teamId={team.id}
        currentWeek={gameState.currentWeek}
      />
      
      {/* Full Fixtures List */}
      <FixturesList
        schedule={schedule}
        teamId={team.id}
        currentWeek={gameState.currentWeek}
      />
    </div>
  );
}
