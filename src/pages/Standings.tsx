import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { LEAGUES } from '@/data/leagues';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Standings() {
  const { getMyTeam, getMyLeague } = useGame();
  const team = getMyTeam();
  const myLeague = getMyLeague();
  const [activeLeague, setActiveLeague] = useState(myLeague?.id || LEAGUES[0].id);

  const league = LEAGUES.find(l => l.id === activeLeague);
  if (!league) return null;

  // Create standings with random results for demo
  const standings = league.teams
    .map(t => {
      const played = Math.floor(Math.random() * 10);
      const won = Math.floor(Math.random() * (played + 1));
      const drawn = Math.floor(Math.random() * (played - won + 1));
      const lost = played - won - drawn;
      const pointsFor = won * 25 + drawn * 15 + Math.floor(Math.random() * 50);
      const pointsAgainst = lost * 20 + Math.floor(Math.random() * 40);
      const bonusPoints = Math.floor(Math.random() * played);
      const totalPoints = won * 4 + drawn * 2 + bonusPoints;

      return {
        team: t,
        played,
        won,
        drawn,
        lost,
        pointsFor,
        pointsAgainst,
        pointsDiff: pointsFor - pointsAgainst,
        bonusPoints,
        totalPoints
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || b.pointsDiff - a.pointsDiff);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">League Standings</h1>
        <p className="text-muted-foreground">View tables across all competitions</p>
      </div>

      <Tabs value={activeLeague} onValueChange={setActiveLeague}>
        <TabsList className="flex flex-wrap h-auto gap-2">
          {LEAGUES.map(l => (
            <TabsTrigger 
              key={l.id} 
              value={l.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {l.name}
              {l.id === myLeague?.id && <Badge variant="outline" className="ml-2 text-xs">Your League</Badge>}
            </TabsTrigger>
          ))}
        </TabsList>

        {LEAGUES.map(l => (
          <TabsContent key={l.id} value={l.id}>
            <Card>
              <CardHeader>
                <CardTitle>{l.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Pos</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-center">P</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">D</TableHead>
                        <TableHead className="text-center">L</TableHead>
                        <TableHead className="text-center hidden md:table-cell">PF</TableHead>
                        <TableHead className="text-center hidden md:table-cell">PA</TableHead>
                        <TableHead className="text-center hidden md:table-cell">PD</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">BP</TableHead>
                        <TableHead className="text-center font-bold">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((row, index) => {
                        const isMyTeam = row.team.id === team?.id;
                        return (
                          <TableRow 
                            key={row.team.id}
                            className={isMyTeam ? 'bg-primary/10 font-medium' : ''}
                          >
                            <TableCell>
                              <Badge 
                                variant={index < 4 ? 'default' : index >= standings.length - 2 ? 'destructive' : 'secondary'}
                              >
                                {index + 1}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={isMyTeam ? 'text-primary font-bold' : ''}>{row.team.name}</span>
                                {isMyTeam && <Badge>You</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{row.played}</TableCell>
                            <TableCell className="text-center text-primary">{row.won}</TableCell>
                            <TableCell className="text-center">{row.drawn}</TableCell>
                            <TableCell className="text-center text-destructive">{row.lost}</TableCell>
                            <TableCell className="text-center hidden md:table-cell">{row.pointsFor}</TableCell>
                            <TableCell className="text-center hidden md:table-cell">{row.pointsAgainst}</TableCell>
                            <TableCell className="text-center hidden md:table-cell">
                              <span className={row.pointsDiff > 0 ? 'text-primary' : row.pointsDiff < 0 ? 'text-destructive' : ''}>
                                {row.pointsDiff > 0 ? '+' : ''}{row.pointsDiff}
                              </span>
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">{row.bonusPoints}</TableCell>
                            <TableCell className="text-center font-bold text-lg">{row.totalPoints}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
