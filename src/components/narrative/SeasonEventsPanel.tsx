import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Newspaper, Users, Megaphone, AlertTriangle, Trophy,
  Shield, TrendingUp, TrendingDown, Gavel, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  SeasonEvent, BoardState, FanAtmosphere, MatchReferee,
  getRefereeTacticalAdvice, formatExpectation, SeasonNarrativeState,
  EventChoice
} from '@/engine/seasonNarrative';

// Re-export formatExpectation for internal use
function formatExp(exp: string): string {
  const map: Record<string, string> = {
    survival: 'Avoid Relegation',
    mid_table: 'Mid-Table Finish',
    top_half: 'Top-Half Finish',
    top_4: 'Top 4',
    title_challenge: 'Title Challenge',
    title_winners: 'Win the League',
  };
  return map[exp] || exp;
}

interface SeasonEventsPanelProps {
  narrativeState: SeasonNarrativeState;
  currentWeek: number;
  upcomingReferee?: MatchReferee;
  onEventChoice?: (eventId: string, choiceId: string) => void;
}

const severityColors: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-700 border-blue-200',
  medium: 'bg-amber-500/10 text-amber-700 border-amber-200',
  high: 'bg-orange-500/10 text-orange-700 border-orange-200',
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
};

const sourceIcons: Record<string, React.ReactNode> = {
  Media: <Newspaper className="h-4 w-4" />,
  Board: <Users className="h-4 w-4" />,
  Fans: <Megaphone className="h-4 w-4" />,
  Medical: <AlertTriangle className="h-4 w-4" />,
  Agent: <Shield className="h-4 w-4" />,
};

export function SeasonEventsPanel({ narrativeState, currentWeek, upcomingReferee, onEventChoice }: SeasonEventsPanelProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const { events, board, fanAtmosphere } = narrativeState;

  const recentEvents = events.filter(e => e.week >= currentWeek - 4).reverse();
  const unresolvedEvents = events.filter(e => !e.resolved && e.choices && !e.chosenOption);

  return (
    <Tabs defaultValue="events" className="space-y-4">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="events">
          <Newspaper className="h-4 w-4 mr-1" />
          Events
          {unresolvedEvents.length > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs px-1">{unresolvedEvents.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="board">
          <Users className="h-4 w-4 mr-1" />
          Board
        </TabsTrigger>
        <TabsTrigger value="fans">
          <Megaphone className="h-4 w-4 mr-1" />
          Fans
        </TabsTrigger>
        <TabsTrigger value="referee">
          <Gavel className="h-4 w-4 mr-1" />
          Referee
        </TabsTrigger>
      </TabsList>

      {/* Events Feed */}
      <TabsContent value="events">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Season Events</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {recentEvents.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No events yet. Advance through the season to generate narratives.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map(event => (
                    <div
                      key={event.id}
                      className={`border rounded-lg p-3 ${severityColors[event.severity]} cursor-pointer transition-all`}
                      onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          {sourceIcons[event.source] || <Info className="h-4 w-4" />}
                          <div>
                            <p className="font-semibold text-sm">{event.headline}</p>
                            <p className="text-xs opacity-70">Week {event.week} • {event.source}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">{event.severity}</Badge>
                          {expandedEvent === event.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </div>
                      </div>
                      
                      {expandedEvent === event.id && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm">{event.description}</p>
                          {event.effects.map((eff, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {eff.modifier > 0 ? <TrendingUp className="h-3 w-3 text-green-600" /> : <TrendingDown className="h-3 w-3 text-red-600" />}
                              <span>{eff.description} ({eff.modifier > 0 ? '+' : ''}{eff.modifier}% for {eff.duration} weeks)</span>
                            </div>
                          ))}
                          {event.choices && !event.chosenOption && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-semibold">Choose your response:</p>
                              {event.choices.map(choice => (
                                <Button
                                  key={choice.id}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-left h-auto py-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEventChoice?.(event.id, choice.id);
                                  }}
                                >
                                  <div>
                                    <p className="font-medium text-xs">{choice.label}</p>
                                    <p className="text-xs opacity-70">{choice.description}</p>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          )}
                          {event.chosenOption && (
                            <Badge variant="secondary" className="text-xs">
                              Decision made: {event.choices?.find(c => c.id === event.chosenOption)?.label}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Board */}
      <TabsContent value="board">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Board Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Season Expectation</p>
                <p className="font-semibold">{formatExp(board.preSeasonTarget)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Expectation</p>
                <p className="font-semibold">{formatExp(board.currentExpectation)}</p>
                {board.currentExpectation !== board.preSeasonTarget && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {['title_challenge', 'title_winners', 'top_4'].indexOf(board.currentExpectation) >
                     ['title_challenge', 'title_winners', 'top_4'].indexOf(board.preSeasonTarget)
                      ? '↑ Raised' : '↓ Lowered'}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Board Confidence</span>
                <span>{board.confidence}%</span>
              </div>
              <Progress value={board.confidence} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Board Patience</span>
                <span>{board.patience}%</span>
              </div>
              <Progress value={board.patience} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Home Record</p>
                <p className="font-bold text-lg">
                  {board.homeRecord.wins}W {board.homeRecord.draws}D {board.homeRecord.losses}L
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Away Record</p>
                <p className="font-bold text-lg">
                  {board.awayRecord.wins}W {board.awayRecord.draws}D {board.awayRecord.losses}L
                </p>
              </div>
            </div>

            {board.recentResults.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Recent Form</p>
                <div className="flex gap-1">
                  {board.recentResults.map((r, i) => {
                    const result = typeof r === 'string' ? r : r.result;
                    return (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        result === 'W' ? 'bg-green-500/20 text-green-700' :
                        result === 'L' ? 'bg-red-500/20 text-red-700' :
                        'bg-amber-500/20 text-amber-700'
                      }`}
                    >
                      {result}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Fans */}
      <TabsContent value="fans">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fan & Atmosphere</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <Megaphone className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold capitalize">{fanAtmosphere.crowdMood}</p>
              <p className="text-xs text-muted-foreground">Current Crowd Mood</p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Home Support</span>
                  <span>{fanAtmosphere.homeSupport}%</span>
                </div>
                <Progress value={fanAtmosphere.homeSupport} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Away Travel Support</span>
                  <span>{fanAtmosphere.awaySupportTravel}%</span>
                </div>
                <Progress value={fanAtmosphere.awaySupportTravel} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Atmosphere Rating</span>
                  <span>{fanAtmosphere.atmosphereRating}%</span>
                </div>
                <Progress value={fanAtmosphere.atmosphereRating} className="h-2" />
              </div>
            </div>

            {fanAtmosphere.recentHomeResults.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Recent Home Results</p>
                <div className="flex gap-1">
                  {fanAtmosphere.recentHomeResults.map((r, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        r === 'W' ? 'bg-green-500/20 text-green-700' :
                        r === 'L' ? 'bg-red-500/20 text-red-700' :
                        'bg-amber-500/20 text-amber-700'
                      }`}
                    >
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Referee */}
      <TabsContent value="referee">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Match Officials</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingReferee ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                  <Gavel className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-lg font-bold">{upcomingReferee.name}</p>
                    <p className="text-sm text-muted-foreground">{upcomingReferee.nationality} • {upcomingReferee.experience} years experience</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Breakdown</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-full rounded ${
                            i < upcomingReferee.tendencies.breakdownStrictness
                              ? 'bg-primary'
                              : 'bg-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs mt-1">{upcomingReferee.tendencies.breakdownStrictness >= 7 ? 'Strict' : upcomingReferee.tendencies.breakdownStrictness <= 4 ? 'Lenient' : 'Balanced'}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Offside</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-full rounded ${
                            i < upcomingReferee.tendencies.offsideStrictness
                              ? 'bg-primary'
                              : 'bg-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs mt-1">{upcomingReferee.tendencies.offsideStrictness >= 7 ? 'Strict' : 'Balanced'}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Card Threshold</p>
                    <p className="font-semibold capitalize">{upcomingReferee.tendencies.cardThreshold}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">TMO Usage</p>
                    <p className="font-semibold capitalize">{upcomingReferee.tendencies.tmoUsage}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Avg Penalties/Match</p>
                    <p className="font-semibold">{upcomingReferee.tendencies.penaltyCountAverage}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Advantage Duration</p>
                    <p className="font-semibold capitalize">{upcomingReferee.tendencies.advantageDuration}</p>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-sm mb-2">Tactical Advice</p>
                  <div className="space-y-2">
                    {getRefereeTacticalAdvice(upcomingReferee).map((advice, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm p-2 rounded bg-muted">
                        <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>{advice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Gavel className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Referee will be assigned when a fixture is upcoming.</p>
                <p className="text-xs mt-1">Check back on match week for official assignment and tactical advice.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
