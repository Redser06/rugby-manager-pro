import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useSixNations } from '@/contexts/SixNationsContext';
import { SixNationsNation, SIX_NATIONS_LIST, SIX_NATIONS_START_WEEK } from '@/types/sixNations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SixNationsStandings } from '@/components/sixnations/SixNationsStandings';
import { SixNationsFixtures } from '@/components/sixnations/SixNationsFixtures';
import { NationalSquadSelector } from '@/components/sixnations/NationalSquadSelector';
import { CallUpPanel } from '@/components/sixnations/CallUpPanel';
import { Trophy, Shield, Users, Calendar, Play, AlertTriangle, Flag } from 'lucide-react';

const FLAG_EMOJI: Record<SixNationsNation, string> = {
  'Ireland': '🇮🇪',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
};

export default function SixNations() {
  const { gameState } = useGame();
  const { sixNationsState, initTournament, completeTournament, isSixNationsWindow } = useSixNations();
  const [selectedNation, setSelectedNation] = useState<SixNationsNation | ''>('');
  const [mode, setMode] = useState<'national' | 'club' | null>(null);

  const isWindow = isSixNationsWindow();
  const weeksTillStart = SIX_NATIONS_START_WEEK - gameState.currentWeek;

  // Not yet initialized — show setup
  if (!sixNationsState) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Six Nations Championship
          </h1>
          <p className="text-muted-foreground mt-1">
            {isWindow
              ? 'The Six Nations window is open! Set up the tournament.'
              : weeksTillStart > 0
              ? `The Six Nations begins in ${weeksTillStart} weeks (Week ${SIX_NATIONS_START_WEEK}).`
              : 'The Six Nations window has passed this season.'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choose Your Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">Select how you want to experience the Six Nations:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* National Coach Option */}
              <Card
                className={`cursor-pointer transition-all ${mode === 'national' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                onClick={() => setMode('national')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Flag className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">National Team Coach</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Take charge of a national team. Select players from any club, set tactics,
                    manage a condensed training block, and compete for the Six Nations trophy.
                    Full match simulation for your games.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    <Badge variant="outline">Squad Selection</Badge>
                    <Badge variant="outline">Full Match Sim</Badge>
                    <Badge variant="outline">Tactics</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Club Impact Option */}
              <Card
                className={`cursor-pointer transition-all ${mode === 'club' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                onClick={() => setMode('club')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Club Coach (Impact Mode)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Continue as your club coach. Your international-quality players get called up
                    and are unavailable. Watch results come in with ~25% risk of players
                    returning injured or suspended.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    <Badge variant="outline">Player Unavailability</Badge>
                    <Badge variant="outline">Injury Risk</Badge>
                    <Badge variant="outline">Condensed Results</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Nation Selector (for national coach mode) */}
            {mode === 'national' && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6 space-y-3">
                  <label className="text-sm font-semibold">Which nation will you coach?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SIX_NATIONS_LIST.map(nation => (
                      <Button
                        key={nation}
                        variant={selectedNation === nation ? 'default' : 'outline'}
                        className="h-auto py-3 flex flex-col items-center gap-1"
                        onClick={() => setSelectedNation(nation)}
                      >
                        <span className="text-xl">{FLAG_EMOJI[nation]}</span>
                        <span className="text-sm font-medium">{nation}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              size="lg"
              className="w-full"
              disabled={!mode || (mode === 'national' && !selectedNation)}
              onClick={() => {
                if (mode === 'national' && selectedNation) {
                  initTournament(selectedNation as SixNationsNation);
                } else if (mode === 'club') {
                  initTournament(null);
                }
              }}
            >
              <Play className="h-5 w-5 mr-2" />
              {mode === 'national' && selectedNation
                ? `Start as ${FLAG_EMOJI[selectedNation]} ${selectedNation} Coach`
                : mode === 'club'
                ? 'Start Six Nations (Club Impact Mode)'
                : 'Select a mode above to begin'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tournament active or completed
  const isNationalCoach = !!sixNationsState.userNation;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Six Nations Championship
          </h1>
          <p className="text-muted-foreground">
            {sixNationsState.completed
              ? 'Tournament Complete'
              : `Round ${sixNationsState.currentRound} of 5`}
            {isNationalCoach && (
              <span className="ml-2">
                • Managing {FLAG_EMOJI[sixNationsState.userNation!]} {sixNationsState.userNation}
              </span>
            )}
          </p>
        </div>

        {sixNationsState.active && sixNationsState.completed && (
          <Button onClick={completeTournament} variant="default">
            <AlertTriangle className="h-4 w-4 mr-2" />
            End Tournament & Return Players
          </Button>
        )}

        {!sixNationsState.active && sixNationsState.completed && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            Tournament Concluded — Players Returned
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="standings">
        <TabsList>
          <TabsTrigger value="standings" className="gap-1">
            <Trophy className="h-4 w-4" />
            Standings
          </TabsTrigger>
          <TabsTrigger value="fixtures" className="gap-1">
            <Calendar className="h-4 w-4" />
            Fixtures
          </TabsTrigger>
          {isNationalCoach && (
            <TabsTrigger value="squad" className="gap-1">
              <Users className="h-4 w-4" />
              Squad
            </TabsTrigger>
          )}
          {!isNationalCoach && (
            <TabsTrigger value="callups" className="gap-1">
              <Shield className="h-4 w-4" />
              Call-Ups
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="standings">
          <SixNationsStandings />
        </TabsContent>

        <TabsContent value="fixtures">
          <SixNationsFixtures isNationalCoach={isNationalCoach} />
        </TabsContent>

        {isNationalCoach && (
          <TabsContent value="squad">
            <NationalSquadSelector nation={sixNationsState.userNation!} />
          </TabsContent>
        )}

        {!isNationalCoach && (
          <TabsContent value="callups">
            <CallUpPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
