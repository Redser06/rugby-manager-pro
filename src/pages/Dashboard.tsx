import { useState, useEffect, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { SeasonSchedule, Fixture } from '@/types/fixture';
import { generateSeasonFixtures, getWeekFixtures, canTeamTrain } from '@/utils/fixtureGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Users, 
  Trophy, 
  TrendingUp, 
  ChevronRight, 
  MapPin, 
  Plane, 
  Home,
  AlertTriangle,
  CloudRain,
  Sun
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { gameState, getMyTeam, getMyLeague, advanceWeek } = useGame();
  const team = getMyTeam();
  const league = getMyLeague();
  
  // Load/generate fixtures schedule
  const [schedule, setSchedule] = useState<SeasonSchedule | null>(null);
  
  useEffect(() => {
    if (league && !schedule) {
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
  
  // Get this week's fixture - useMemo before early return
  const thisWeekFixture = useMemo(() => {
    if (!schedule || !team) return null;
    const fixtures = getWeekFixtures(schedule, gameState.currentWeek);
    return fixtures.find(f => f.homeTeamId === team.id || f.awayTeamId === team.id) || null;
  }, [schedule, gameState.currentWeek, team]);
  
  // Check if training is restricted this week
  const trainingRestricted = useMemo(() => {
    if (!schedule || !team) return false;
    return !canTeamTrain(schedule, team.id, gameState.currentWeek);
  }, [schedule, team, gameState.currentWeek]);

  if (!team) {
    return null;
  }

  const startingXI = team.players.slice(0, 15);
  const avgOverall = Math.round(startingXI.reduce((sum, p) => sum + p.overall, 0) / 15);
  const avgForm = (startingXI.reduce((sum, p) => sum + p.form, 0) / 15).toFixed(1);
  const injuredCount = team.players.filter(p => p.injured).length;

  // Get team's position in league
  const standing = league?.standings.find(s => s.teamId === team.id);
  const position = league?.standings.findIndex(s => s.teamId === team.id)! + 1 || 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{team.name}</h1>
          <p className="text-muted-foreground">{league?.name} • Week {gameState.currentWeek}</p>
        </div>
        <Button onClick={advanceWeek} size="lg">
          <Calendar className="mr-2 h-5 w-5" />
          Advance Week
        </Button>
      </div>

      {/* Upcoming Fixture */}
      {thisWeekFixture && (
        <Link to="/fixtures">
          <Card className={`hover:border-primary transition-colors cursor-pointer ${
            thisWeekFixture.status === 'postponed' ? 'border-destructive' : 'border-primary/50'
          }`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">This Week's Match</p>
                    <div className="flex items-center gap-2">
                      {thisWeekFixture.homeTeamId === team.id ? (
                        <Badge variant="default" className="text-xs">
                          <Home className="h-3 w-3 mr-1" />
                          Home
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Plane className="h-3 w-3 mr-1" />
                          Away
                        </Badge>
                      )}
                      <span className="font-medium">
                        {thisWeekFixture.homeTeamId === team.id 
                          ? `vs ${thisWeekFixture.awayTeamName}`
                          : `@ ${thisWeekFixture.homeTeamName}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {thisWeekFixture.venue}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {thisWeekFixture.status === 'postponed' && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Postponed
                    </Badge>
                  )}
                  {thisWeekFixture.weather && (
                    <div className="text-right text-sm">
                      {thisWeekFixture.weather.condition === 'clear' ? (
                        <Sun className="h-4 w-4 text-yellow-500 inline mr-1" />
                      ) : (
                        <CloudRain className="h-4 w-4 text-blue-500 inline mr-1" />
                      )}
                      <span className="text-muted-foreground text-xs">
                        {thisWeekFixture.weather.description}
                      </span>
                    </div>
                  )}
                  {trainingRestricted && (
                    <Badge variant="outline" className="border-destructive text-destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Travel Day - No Training
                    </Badge>
                  )}
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
      
      {!thisWeekFixture && schedule && (
        <Card className="bg-muted/50">
          <CardContent className="py-4 text-center">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">Bye Week</p>
            <p className="text-sm text-muted-foreground">No fixture this week - focus on training</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">League Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              <span className="text-4xl font-bold">{position}</span>
              <span className="text-muted-foreground">/ {league?.teams.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Squad Strength</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <span className="text-4xl font-bold">{avgOverall}</span>
              <span className="text-muted-foreground">avg overall</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Form</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <span className="text-4xl font-bold">{avgForm}</span>
              <span className="text-muted-foreground">/ 10</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Injuries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={injuredCount > 3 ? 'destructive' : 'secondary'} className="text-2xl px-3 py-1">
                {injuredCount}
              </Badge>
              <span className="text-muted-foreground">players out</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/squad">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Squad</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{team.players.length} players</p>
              <Progress value={(team.players.filter(p => !p.injured).length / team.players.length) * 100} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {team.players.filter(p => !p.injured).length} available
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/tactics">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tactics</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">{team.tactics.attackStyle}</Badge>
                <Badge variant="outline">{team.tactics.defenseStyle}</Badge>
                <Badge variant="outline">{team.tactics.tempo}</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/standings">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Standings</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{league?.name}</p>
              <p className="text-sm mt-1">
                P: {standing?.played || 0} | Pts: {standing?.totalPoints || 0}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Starting XV Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Starting XV Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-15 gap-2">
            {startingXI.map(player => (
              <div key={player.id} className="text-center p-2 bg-muted rounded-md">
                <div className="text-xs font-bold text-primary">{player.positionNumber}</div>
                <div className="text-xs truncate">{player.lastName}</div>
                <div className="text-xs text-muted-foreground">{player.overall}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
