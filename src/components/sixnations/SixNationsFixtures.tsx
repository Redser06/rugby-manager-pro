import { useSixNations } from '@/contexts/SixNationsContext';
import { SixNationsNation, SixNationsFixture } from '@/types/sixNations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Check } from 'lucide-react';

const FLAG_EMOJI: Record<SixNationsNation, string> = {
  'Ireland': '🇮🇪',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
};

interface SixNationsFixturesProps {
  isNationalCoach: boolean;
}

export function SixNationsFixtures({ isNationalCoach }: SixNationsFixturesProps) {
  const { sixNationsState, simulateRound } = useSixNations();

  if (!sixNationsState) return null;

  const rounds = [1, 2, 3, 4, 5];

  const renderFixture = (fixture: SixNationsFixture) => {
    const isUserMatch = sixNationsState.userNation &&
      (fixture.homeNation === sixNationsState.userNation || fixture.awayNation === sixNationsState.userNation);

    return (
      <div
        key={fixture.id}
        className={`p-3 rounded-lg border ${isUserMatch ? 'border-primary bg-primary/5' : 'border-border'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">{FLAG_EMOJI[fixture.homeNation]}</span>
            <span className={`font-medium ${isUserMatch && fixture.homeNation === sixNationsState.userNation ? 'text-primary' : ''}`}>
              {fixture.homeNation}
            </span>
          </div>

          <div className="px-4 text-center min-w-[80px]">
            {fixture.played ? (
              <span className="text-xl font-bold">
                {fixture.homeScore} - {fixture.awayScore}
              </span>
            ) : (
              <Badge variant="outline">vs</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className={`font-medium ${isUserMatch && fixture.awayNation === sixNationsState.userNation ? 'text-primary' : ''}`}>
              {fixture.awayNation}
            </span>
            <span className="text-lg">{FLAG_EMOJI[fixture.awayNation]}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center mt-1">
          {fixture.venue}
        </div>

        {/* Show match events for expanded view (national coach) */}
        {fixture.played && fixture.events && isNationalCoach && isUserMatch && (
          <ScrollArea className="mt-3 max-h-32">
            <div className="space-y-1">
              {fixture.events.map((event, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px] px-1">{event.minute}'</Badge>
                  <Badge
                    variant={
                      event.type === 'try' ? 'default' :
                      event.type === 'yellow_card' || event.type === 'red_card' ? 'destructive' :
                      'secondary'
                    }
                    className="text-[10px]"
                  >
                    {event.type.replace('_', ' ')}
                  </Badge>
                  <span className="truncate">{event.description}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {rounds.map(round => {
        const roundFixtures = sixNationsState.fixtures.filter(f => f.round === round);
        const allPlayed = roundFixtures.every(f => f.played);
        const canSimulate = !allPlayed && round === sixNationsState.currentRound;
        const prevRoundPlayed = round === 1 || sixNationsState.fixtures
          .filter(f => f.round === round - 1)
          .every(f => f.played);

        return (
          <Card key={round}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Round {round}</CardTitle>
                <div className="flex items-center gap-2">
                  {allPlayed && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      Complete
                    </Badge>
                  )}
                  {canSimulate && prevRoundPlayed && (
                    <Button size="sm" onClick={() => simulateRound(round)}>
                      <Play className="h-3 w-3 mr-1" />
                      {isNationalCoach ? 'Play Round' : 'Simulate Round'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roundFixtures.map(renderFixture)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
