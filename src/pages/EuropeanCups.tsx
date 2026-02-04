import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Star, ArrowDown, Check, X } from 'lucide-react';
import { 
  EuropeanCompetition, 
  EuroPool,
  EuroPoolTeam,
  EuropeanCompetitionState 
} from '@/types/europeanCompetition';
import { initializeEuropeanCompetitions, getPoolByTeamId } from '@/data/europeanCompetitions';
import { PoolTable } from '@/components/european/PoolTable';
import { PoolMatches } from '@/components/european/PoolMatches';
import { KnockoutBracket } from '@/components/european/KnockoutBracket';

export default function EuropeanCups() {
  const { getMyTeam, gameState } = useGame();
  const team = getMyTeam();
  
  const [euroState, setEuroState] = useState<EuropeanCompetitionState>(() => {
    const saved = localStorage.getItem('rugbyManagerEuropean');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          championsCup: null,
          challengeCup: null,
          currentSeason: gameState.currentSeason,
          initialized: false
        };
      }
    }
    return {
      championsCup: null,
      challengeCup: null,
      currentSeason: gameState.currentSeason,
      initialized: false
    };
  });

  const [activeCompetition, setActiveCompetition] = useState<'champions' | 'challenge'>('champions');
  const [activeView, setActiveView] = useState<'pools' | 'knockouts'>('pools');

  // Initialize competitions if needed
  useEffect(() => {
    if (!euroState.initialized || euroState.currentSeason !== gameState.currentSeason) {
      const { championsCup, challengeCup } = initializeEuropeanCompetitions(gameState.currentSeason);
      setEuroState({
        championsCup,
        challengeCup,
        currentSeason: gameState.currentSeason,
        initialized: true
      });
    }
  }, [gameState.currentSeason, euroState.initialized, euroState.currentSeason]);

  // Persist state
  useEffect(() => {
    if (euroState.initialized) {
      localStorage.setItem('rugbyManagerEuropean', JSON.stringify(euroState));
    }
  }, [euroState]);

  const currentCompetition = activeCompetition === 'champions' 
    ? euroState.championsCup 
    : euroState.challengeCup;

  if (!currentCompetition) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p>Loading European competitions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user's team is in competition
  const myPool = team ? getPoolByTeamId(currentCompetition, team.id) : undefined;
  const isInCompetition = !!myPool;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            European Competitions
          </h1>
          <p className="text-muted-foreground">
            Season {gameState.currentSeason} - {currentCompetition.stage === 'pool' ? 'Pool Stage' : 'Knockout Stage'}
          </p>
        </div>
        {isInCompetition && myPool && (
          <Badge variant="default" className="text-sm py-1 px-3">
            <Star className="h-4 w-4 mr-1" />
            {team?.name} in {myPool.name}
          </Badge>
        )}
      </div>

      {/* Competition Selector */}
      <Tabs value={activeCompetition} onValueChange={(v) => setActiveCompetition(v as 'champions' | 'challenge')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="champions" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Champions Cup
          </TabsTrigger>
          <TabsTrigger value="challenge" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Challenge Cup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="champions" className="mt-4">
          <CompetitionView 
            competition={euroState.championsCup!}
            activeView={activeView}
            setActiveView={setActiveView}
            myTeamId={team?.id}
          />
        </TabsContent>

        <TabsContent value="challenge" className="mt-4">
          <CompetitionView 
            competition={euroState.challengeCup!}
            activeView={activeView}
            setActiveView={setActiveView}
            myTeamId={team?.id}
          />
        </TabsContent>
      </Tabs>

      {/* Qualification Legend */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Qualification Key</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="default">1-2</Badge>
              <span>Round of 16 (Home advantage)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">3-4</Badge>
              <span>Round of 16 (Away)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">5th</Badge>
              <span>Drop to Challenge Cup R16</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">6th</Badge>
              <span>Eliminated</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CompetitionViewProps {
  competition: EuropeanCompetition;
  activeView: 'pools' | 'knockouts';
  setActiveView: (view: 'pools' | 'knockouts') => void;
  myTeamId?: string;
}

function CompetitionView({ competition, activeView, setActiveView, myTeamId }: CompetitionViewProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{competition.name}</CardTitle>
              <CardDescription>
                Round {competition.currentRound} of {competition.stage === 'pool' ? 4 : 'Knockouts'}
              </CardDescription>
            </div>
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'pools' | 'knockouts')}>
              <TabsList>
                <TabsTrigger value="pools">Pool Stage</TabsTrigger>
                <TabsTrigger value="knockouts" disabled={competition.stage === 'pool'}>
                  Knockouts
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
      </Card>

      {activeView === 'pools' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {competition.pools.map(pool => (
            <Card key={pool.id}>
              <CardHeader className="py-3">
                <CardTitle className="text-lg">{pool.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PoolTable pool={pool} myTeamId={myTeamId} />
                <PoolMatches pool={pool} myTeamId={myTeamId} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <KnockoutBracket bracket={competition.knockout} myTeamId={myTeamId} />
      )}
    </div>
  );
}
