import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Player, PositionNumber } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, User, Activity, Heart, AlertTriangle } from 'lucide-react';

const POSITION_GROUPS = {
  'Front Row': [1, 2, 3],
  'Second Row': [4, 5],
  'Back Row': [6, 7, 8],
  'Half Backs': [9, 10],
  'Centres': [12, 13],
  'Back Three': [11, 14, 15]
};

function PlayerDetailDialog({ player, open, onOpenChange }: { player: Player; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const attributes = Object.entries(player.attributes);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{player.firstName} {player.lastName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{player.position}</p>
              <p className="text-sm text-muted-foreground">{player.nationality} • Age {player.age}</p>
              <Badge variant={player.injured ? 'destructive' : 'secondary'}>
                {player.injured ? 'Injured' : 'Available'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted rounded-md">
              <p className="text-2xl font-bold text-primary">{player.overall}</p>
              <p className="text-xs text-muted-foreground">Overall</p>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <p className="text-2xl font-bold">{player.form}</p>
              <p className="text-xs text-muted-foreground">Form</p>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <p className="text-2xl font-bold">{player.fitness}%</p>
              <p className="text-xs text-muted-foreground">Fitness</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Attributes</h4>
            <ScrollArea className="h-48">
              {attributes.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={value} className="w-24 h-2" />
                    <span className="text-sm font-medium w-8">{value}</span>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Squad() {
  const { getMyTeam } = useGame();
  const team = getMyTeam();
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  if (!team) return null;

  const filteredPlayers = team.players.filter(player => {
    const matchesSearch = `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === 'all' || 
      Object.entries(POSITION_GROUPS).some(([group, positions]) => 
        group === positionFilter && positions.includes(player.positionNumber)
      );
    return matchesSearch && matchesPosition;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => a.positionNumber - b.positionNumber);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Squad</h1>
          <p className="text-muted-foreground">{team.players.length} players</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Position group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {Object.keys(POSITION_GROUPS).map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Squad Table */}
      <Card>
        <CardHeader>
          <CardTitle>Players ({sortedPlayers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-400px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-center">Age</TableHead>
                  <TableHead className="text-center">OVR</TableHead>
                  <TableHead className="text-center">Form</TableHead>
                  <TableHead className="text-center">Fitness</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlayers.map(player => (
                  <TableRow key={player.id} className={player.injured ? 'opacity-60' : ''}>
                    <TableCell className="font-bold text-primary">{player.positionNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{player.firstName} {player.lastName}</p>
                        <p className="text-xs text-muted-foreground">{player.nationality}</p>
                      </div>
                    </TableCell>
                    <TableCell>{player.position}</TableCell>
                    <TableCell className="text-center">{player.age}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={player.overall >= 80 ? 'default' : player.overall >= 70 ? 'secondary' : 'outline'}>
                        {player.overall}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Activity className="h-3 w-3" />
                        {player.form}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Heart className="h-3 w-3" />
                        {player.fitness}%
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {player.injured ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Injured
                        </Badge>
                      ) : (
                        <Badge variant="outline">Available</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <PlayerDetailDialog player={player} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
