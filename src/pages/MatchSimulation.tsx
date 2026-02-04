import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Team, Match, MatchEvent, Player } from '@/types/game';
import { ReplayMatch } from '@/types/replay';
import { LEAGUES } from '@/data/leagues';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, FastForward, RotateCcw, Trophy, Video } from 'lucide-react';
import { ReplayViewer } from '@/components/replay/ReplayViewer';
import { generateReplayEvents } from '@/utils/replayGenerator';
function simulateMatch(homeTeam: Team, awayTeam: Team): Match {
  const events: MatchEvent[] = [];
  let homeScore = 0;
  let awayScore = 0;
  let homeTries = 0;
  let awayTries = 0;

  // Calculate team strengths
  const homeStrength = homeTeam.reputation + Math.random() * 20;
  const awayStrength = awayTeam.reputation + Math.random() * 20;

  // Simulate key moments
  for (let minute = 1; minute <= 80; minute++) {
    const eventChance = Math.random();
    
    if (eventChance < 0.05) {
      // Try opportunity
      const isHomeTry = Math.random() < (homeStrength / (homeStrength + awayStrength));
      const scoringTeam = isHomeTry ? 'home' : 'away';
      const team = isHomeTry ? homeTeam : awayTeam;
      const backPlayers = team.players.filter(p => p.positionNumber >= 9);
      const scorer = backPlayers[Math.floor(Math.random() * backPlayers.length)];

      if (isHomeTry) {
        homeScore += 5;
        homeTries++;
      } else {
        awayScore += 5;
        awayTries++;
      }

      events.push({
        minute,
        type: 'try',
        team: scoringTeam,
        player: scorer,
        description: `TRY! ${scorer?.firstName} ${scorer?.lastName} scores!`
      });

      // Conversion attempt
      if (Math.random() < 0.75) {
        if (isHomeTry) homeScore += 2;
        else awayScore += 2;
        
        events.push({
          minute,
          type: 'conversion',
          team: scoringTeam,
          description: 'Conversion successful!'
        });
      }
    } else if (eventChance < 0.1) {
      // Penalty
      const isHomePenalty = Math.random() < 0.5;
      if (isHomePenalty) homeScore += 3;
      else awayScore += 3;

      events.push({
        minute,
        type: 'penalty',
        team: isHomePenalty ? 'home' : 'away',
        description: 'Penalty kick successful!'
      });
    } else if (eventChance < 0.11) {
      // Yellow card
      const isHomeCard = Math.random() < 0.5;
      const team = isHomeCard ? homeTeam : awayTeam;
      const player = team.players[Math.floor(Math.random() * team.players.length)];

      events.push({
        minute,
        type: 'yellow_card',
        team: isHomeCard ? 'home' : 'away',
        player,
        description: `Yellow card for ${player.firstName} ${player.lastName}`
      });
    }
  }

  return {
    id: `match-${Date.now()}`,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    homeTries,
    awayTries,
    played: true,
    events: events.sort((a, b) => a.minute - b.minute)
  };
}

export default function MatchSimulation() {
  const { getMyTeam, getMyLeague } = useGame();
  const team = getMyTeam();
  const league = getMyLeague();

  const [match, setMatch] = useState<Match | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [showReplay, setShowReplay] = useState(false);

  // Get opponent from same league
  const opponent = useMemo(() => {
    if (!league || !team) return null;
    const opponents = league.teams.filter(t => t.id !== team.id);
    return opponents[Math.floor(Math.random() * opponents.length)];
  }, [league, team]);

  const startMatch = () => {
    if (!team || !opponent) return;
    
    setIsSimulating(true);
    setCurrentMinute(0);
    
    const result = simulateMatch(team, opponent);
    setMatch(result);

    // Animate through minutes
    let minute = 0;
    const interval = setInterval(() => {
      minute += 1;
      setCurrentMinute(minute);
      if (minute >= 80) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 100);
  };

  const resetMatch = () => {
    setMatch(null);
    setCurrentMinute(0);
    setIsSimulating(false);
    setShowReplay(false);
  };

  // Generate replay match data from completed match
  const replayMatch: ReplayMatch | null = useMemo(() => {
    if (!match || !team || !opponent) return null;
    
    const replayEvents = generateReplayEvents(team, opponent, match.events);
    
    return {
      id: match.id,
      homeTeam: {
        name: team.name,
        shortName: team.shortName,
        primaryColor: team.kit?.primary || '#1e40af',
        secondaryColor: team.kit?.secondary || '#ffffff',
      },
      awayTeam: {
        name: opponent.name,
        shortName: opponent.shortName,
        primaryColor: opponent.kit?.primary || '#dc2626',
        secondaryColor: opponent.kit?.secondary || '#ffffff',
      },
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      events: replayEvents,
    };
  }, [match, team, opponent]);

  if (!team || !opponent) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please select a team first</p>
      </div>
    );
  }

  const visibleEvents = match?.events.filter(e => e.minute <= currentMinute) || [];
  const currentHomeScore = visibleEvents.reduce((sum, e) => {
    if (e.team !== 'home') return sum;
    if (e.type === 'try') return sum + 5;
    if (e.type === 'conversion') return sum + 2;
    if (e.type === 'penalty' || e.type === 'drop_goal') return sum + 3;
    return sum;
  }, 0);
  const currentAwayScore = visibleEvents.reduce((sum, e) => {
    if (e.team !== 'away') return sum;
    if (e.type === 'try') return sum + 5;
    if (e.type === 'conversion') return sum + 2;
    if (e.type === 'penalty' || e.type === 'drop_goal') return sum + 3;
    return sum;
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Match Day</h1>
        <p className="text-muted-foreground">Simulate your next match</p>
      </div>

      {/* Match Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            {/* Home Team */}
            <div className="flex-1 text-center">
              <h2 className="text-xl font-bold">{team.name}</h2>
              <p className="text-sm text-muted-foreground">{team.homeGround}</p>
              <p className="text-6xl font-bold mt-4 text-primary">{currentHomeScore}</p>
            </div>

            {/* VS / Timer */}
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

            {/* Away Team */}
            <div className="flex-1 text-center">
              <h2 className="text-xl font-bold">{opponent.name}</h2>
              <p className="text-sm text-muted-foreground">Away</p>
              <p className="text-6xl font-bold mt-4">{currentAwayScore}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mt-8">
            {!match && (
              <Button onClick={startMatch} size="lg">
                <Play className="mr-2 h-5 w-5" />
                Start Match
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

      {/* Match Events */}
      {match && visibleEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Match Events</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {visibleEvents.map((event, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      event.team === 'home' ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    <Badge variant="outline">{event.minute}'</Badge>
                    <Badge 
                      variant={
                        event.type === 'try' ? 'default' :
                        event.type === 'yellow_card' || event.type === 'red_card' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {event.type.replace('_', ' ')}
                    </Badge>
                    <span className="flex-1">{event.description}</span>
                    <Badge variant="outline">{event.team === 'home' ? team.shortName : opponent.shortName}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Final Result */}
      {match && currentMinute >= 80 && !showReplay && (
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
                <p className="text-sm text-muted-foreground">Home Tries</p>
                <p className="text-2xl font-bold">{match.homeTries}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Away Tries</p>
                <p className="text-2xl font-bold">{match.awayTries}</p>
              </div>
            </div>
            
            {/* Watch Replay Button */}
            <Button 
              onClick={() => setShowReplay(true)} 
              className="mt-6"
              size="lg"
            >
              <Video className="mr-2 h-5 w-5" />
              Watch 3D Replay
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 3D Replay Viewer */}
      {showReplay && replayMatch && (
        <ReplayViewer 
          match={replayMatch} 
          onClose={() => setShowReplay(false)} 
        />
      )}
    </div>
  );
}
