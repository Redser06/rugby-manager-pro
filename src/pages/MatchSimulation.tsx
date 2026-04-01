import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Team } from '@/types/game';
import { EnhancedMatch } from '@/types/matchEngine';
import { LEAGUES } from '@/data/leagues';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, RotateCcw, Trophy, BarChart3, MessageSquare, Users, Cloud, Wind, Thermometer } from 'lucide-react';
import { simulateFullMatch, createDefaultSubPlan } from '@/engine/matchSimulator';
import { calculateStaffBonuses } from '@/types/staff';
import { MatchStatsPanel } from '@/components/match/MatchStatsPanel';
import { PlayerRatingsPanel } from '@/components/match/PlayerRatingsPanel';
import { MatchCommentary } from '@/components/match/MatchCommentary';

export default function MatchSimulation() {
  const { getMyTeam, getMyLeague } = useGame();
  const team = getMyTeam();
  const league = getMyLeague();

  const [match, setMatch] = useState<EnhancedMatch | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);

  const opponent = useMemo(() => {
    if (!league || !team) return null;
    const opponents = league.teams.filter(t => t.id !== team.id);
    return opponents[Math.floor(Math.random() * opponents.length)];
  }, [league, team]);

  const startMatch = () => {
    if (!team || !opponent) return;
    setIsSimulating(true);
    setCurrentMinute(0);

    const emptyBonuses = calculateStaffBonuses([]);
    const result = simulateFullMatch({
      homeTeam: team,
      awayTeam: opponent,
      homeSubPlan: createDefaultSubPlan(team),
      awaySubPlan: createDefaultSubPlan(opponent),
      homeStaffBonuses: emptyBonuses,
      awayStaffBonuses: emptyBonuses,
    });
    setMatch(result);

    let minute = 0;
    const interval = setInterval(() => {
      minute += 1;
      setCurrentMinute(minute);
      if (minute >= 80) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 150);
  };

  const resetMatch = () => {
    setMatch(null);
    setCurrentMinute(0);
    setIsSimulating(false);
  };

  if (!team || !opponent) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please select a team first</p>
      </div>
    );
  }

  const visibleEvents = match?.events.filter(e => e.minute <= currentMinute) || [];
  const currentHomeScore = visibleEvents.reduce((sum, e) => e.team === 'home' && e.scoreDelta ? sum + e.scoreDelta : sum, 0);
  const currentAwayScore = visibleEvents.reduce((sum, e) => e.team === 'away' && e.scoreDelta ? sum + e.scoreDelta : sum, 0);

  const weatherIcon = match?.weather ? (
    match.weather.condition === 'heavy_rain' || match.weather.condition === 'storm' ? '🌧️' :
    match.weather.condition === 'light_rain' ? '🌦️' :
    match.weather.condition === 'wind' ? '💨' :
    match.weather.condition === 'overcast' ? '☁️' : '☀️'
  ) : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Match Day</h1>
        <p className="text-muted-foreground">Full match simulation with live stats & analytics</p>
      </div>

      {/* Match Info Bar */}
      {match && (
        <div className="flex items-center gap-4 flex-wrap">
          <Badge variant="outline" className="gap-1">
            🏟️ Referee: {match.referee.name}
          </Badge>
          {weatherIcon && (
            <Badge variant="outline" className="gap-1">
              {weatherIcon} {match.weather.condition.replace('_', ' ')} · {match.weather.temperature}°C
            </Badge>
          )}
          {match.weather.windSpeed > 15 && (
            <Badge variant="outline" className="gap-1">
              💨 Wind: {match.weather.windSpeed}km/h
            </Badge>
          )}
          <Badge variant="outline">
            Pitch: {match.weather.pitchCondition}
          </Badge>
        </div>
      )}

      {/* Scoreboard */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <h2 className="text-xl font-bold">{team.name}</h2>
              <p className="text-sm text-muted-foreground">{team.homeGround}</p>
              <p className="text-6xl font-bold mt-4 text-primary">{currentHomeScore}</p>
            </div>
            <div className="text-center px-8">
              {match ? (
                <div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {currentMinute < 80 ? `${currentMinute}'` : 'FT'}
                  </Badge>
                  <Progress value={(currentMinute / 80) * 100} className="mt-4 w-32" />
                </div>
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">VS</span>
              )}
            </div>
            <div className="flex-1 text-center">
              <h2 className="text-xl font-bold">{opponent.name}</h2>
              <p className="text-sm text-muted-foreground">Away</p>
              <p className="text-6xl font-bold mt-4">{currentAwayScore}</p>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-8">
            {!match && (
              <Button onClick={startMatch} size="lg">
                <Play className="mr-2 h-5 w-5" />
                Kick Off
              </Button>
            )}
            {match && currentMinute >= 80 && (
              <Button onClick={resetMatch} variant="outline" size="lg">
                <RotateCcw className="mr-2 h-5 w-5" />
                New Match
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Match Content Tabs */}
      {match && (
        <Tabs defaultValue="commentary">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="commentary" className="gap-1">
              <MessageSquare className="h-4 w-4" /> Commentary
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1">
              <BarChart3 className="h-4 w-4" /> Stats
            </TabsTrigger>
            <TabsTrigger value="ratings" className="gap-1" disabled={currentMinute < 80}>
              <Users className="h-4 w-4" /> Ratings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commentary">
            <Card>
              <CardHeader><CardTitle>Live Commentary</CardTitle></CardHeader>
              <CardContent>
                <MatchCommentary
                  events={match.events}
                  currentMinute={currentMinute}
                  homeTeamShort={team.shortName}
                  awayTeamShort={opponent.shortName}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <MatchStatsPanel
              homeStats={match.homeStats}
              awayStats={match.awayStats}
              homeTeamName={team.shortName}
              awayTeamName={opponent.shortName}
            />
          </TabsContent>

          <TabsContent value="ratings">
            {currentMinute >= 80 && (
              <>
                {/* MOTM */}
                <Card className="mb-4 border-primary">
                  <CardContent className="pt-6 text-center">
                    <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                    <h3 className="text-lg font-bold">Man of the Match</h3>
                    <p className="text-primary text-xl font-bold">{match.motmName}</p>
                  </CardContent>
                </Card>
                <PlayerRatingsPanel
                  homeRatings={match.homePlayerRatings}
                  awayRatings={match.awayPlayerRatings}
                  homeTeamName={team.name}
                  awayTeamName={opponent.name}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Final Result */}
      {match && currentMinute >= 80 && (
        <Card className="border-primary">
          <CardContent className="pt-6 text-center">
            <Trophy className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="text-2xl font-bold">
              {match.homeScore > match.awayScore
                ? `${team.name} Wins!`
                : match.homeScore < match.awayScore
                ? `${opponent.name} Wins!`
                : 'Match Drawn!'}
            </h3>
            <p className="text-muted-foreground mt-2">
              Final Score: {match.homeScore} - {match.awayScore}
            </p>
            <div className="flex justify-center gap-8 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Tries</p>
                <p className="text-2xl font-bold">{match.homeTries} - {match.awayTries}</p>
              </div>
              {(match.homeBonus.tryBonus || match.awayBonus.tryBonus) && (
                <div>
                  <p className="text-sm text-muted-foreground">Try Bonus</p>
                  <p className="text-lg">{match.homeBonus.tryBonus ? '✅' : '❌'} - {match.awayBonus.tryBonus ? '✅' : '❌'}</p>
                </div>
              )}
              {(match.homeBonus.losingBonus || match.awayBonus.losingBonus) && (
                <div>
                  <p className="text-sm text-muted-foreground">Losing Bonus</p>
                  <p className="text-lg">{match.homeBonus.losingBonus ? '✅' : '❌'} - {match.awayBonus.losingBonus ? '✅' : '❌'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
