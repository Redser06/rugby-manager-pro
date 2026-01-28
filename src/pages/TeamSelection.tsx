import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { LEAGUES } from '@/data/leagues';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Users, Trophy, Star } from 'lucide-react';

export default function TeamSelection() {
  const { selectTeam } = useGame();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  const filteredTeams = selectedLeague 
    ? LEAGUES.find(l => l.id === selectedLeague)?.teams || []
    : LEAGUES.flatMap(l => l.teams);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Select Your Team</h1>
          <p className="text-muted-foreground">Choose a team to manage and lead to glory</p>
        </div>

        {/* League Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <Button
            variant={selectedLeague === null ? 'default' : 'outline'}
            onClick={() => setSelectedLeague(null)}
          >
            All Leagues
          </Button>
          {LEAGUES.map(league => (
            <Button
              key={league.id}
              variant={selectedLeague === league.id ? 'default' : 'outline'}
              onClick={() => setSelectedLeague(league.id)}
            >
              {league.name}
            </Button>
          ))}
        </div>

        {/* Teams Grid */}
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTeams.map(team => (
              <Card 
                key={team.id} 
                className="cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
                onClick={() => selectTeam(team.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {team.name}
                    </CardTitle>
                    <Badge variant="outline">{team.shortName}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {team.homeGround}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        Squad Size
                      </span>
                      <span className="font-medium">{team.players.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Trophy className="w-4 h-4" />
                        League
                      </span>
                      <span className="font-medium">{team.league}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Star className="w-4 h-4" />
                        Reputation
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${team.reputation}%` }}
                          />
                        </div>
                        <span className="font-medium text-xs">{team.reputation}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
