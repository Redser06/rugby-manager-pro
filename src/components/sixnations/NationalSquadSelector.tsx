import { useState } from 'react';
import { useSixNations } from '@/contexts/SixNationsContext';
import { SixNationsNation } from '@/types/sixNations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { UserPlus, UserMinus, Search } from 'lucide-react';

interface NationalSquadSelectorProps {
  nation: SixNationsNation;
}

export function NationalSquadSelector({ nation }: NationalSquadSelectorProps) {
  const { sixNationsState, getEligiblePlayersForNation, selectPlayerForNation, removePlayerFromNation } = useSixNations();
  const [searchQuery, setSearchQuery] = useState('');
  const [showEligible, setShowEligible] = useState(false);

  if (!sixNationsState) return null;

  const nationalTeam = sixNationsState.nationalTeams.find(nt => nt.nation === nation);
  if (!nationalTeam) return null;

  const currentSquad = nationalTeam.squad;
  const eligiblePlayers = getEligiblePlayersForNation(nation);

  // Filter out already selected players
  const availablePlayers = eligiblePlayers.filter(
    ep => !currentSquad.some(sp => sp.id === ep.id)
  );

  // Apply search filter
  const filteredAvailable = availablePlayers.filter(p =>
    `${p.firstName} ${p.lastName} ${p.position} ${p.clubTeamName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Current Squad */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{nation} Squad ({currentSquad.length})</CardTitle>
            <Button
              variant={showEligible ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowEligible(!showEligible)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {showEligible ? 'Hide Pool' : 'Add Players'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead className="text-center">OVR</TableHead>
                  <TableHead className="text-center">Form</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSquad
                  .sort((a, b) => a.positionNumber - b.positionNumber)
                  .map(player => {
                    const callUp = sixNationsState.callUps.find(c => c.playerId === player.id);
                    return (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.positionNumber}</TableCell>
                        <TableCell>{player.firstName} {player.lastName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{player.position}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {callUp?.clubTeamName || '—'}
                        </TableCell>
                        <TableCell className="text-center font-bold">{player.overall}</TableCell>
                        <TableCell className="text-center">{player.form}/10</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removePlayerFromNation(player.id, nation)}
                          >
                            <UserMinus className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Eligible Player Pool */}
      {showEligible && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Eligible Players ({availablePlayers.length})</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players, positions, clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead className="text-center">OVR</TableHead>
                    <TableHead className="text-center">Age</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAvailable.slice(0, 50).map(player => (
                    <TableRow key={player.id}>
                      <TableCell>{player.firstName} {player.lastName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{player.position}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{player.clubTeamName}</TableCell>
                      <TableCell className="text-center font-bold">{player.overall}</TableCell>
                      <TableCell className="text-center">{player.age}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => selectPlayerForNation(player.id, nation)}
                        >
                          <UserPlus className="h-4 w-4 text-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
