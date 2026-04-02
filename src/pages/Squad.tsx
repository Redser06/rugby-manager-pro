import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useTransfer } from '@/contexts/TransferContext';
import { Player, PositionNumber } from '@/types/game';
import { Contract, LEAGUE_CURRENCY, Currency } from '@/types/transfer';
import { formatSalary, getContractStatus } from '@/utils/contractGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, User, Activity, Heart, AlertTriangle, Pencil, Save, X, FileText, DollarSign, BarChart3, Users, Brain } from 'lucide-react';
import { ContractManagementDialog } from '@/components/squad/ContractManagementDialog';
import { SalaryCapWidget } from '@/components/transfers/SalaryCapWidget';
import { SquadImportDialog } from '@/components/squad/SquadImportDialog';
import ClubSquadDepth from '@/components/squad/ClubSquadDepth';
import PlayerPsychologyPanel from '@/components/player/PlayerPsychologyPanel';
import { PlayerExtended, generatePlayerExtended } from '@/types/playerExtended';
import { useToast } from '@/hooks/use-toast';

const POSITION_GROUPS = {
  'Front Row': [1, 2, 3],
  'Second Row': [4, 5],
  'Back Row': [6, 7, 8],
  'Half Backs': [9, 10],
  'Centres': [12, 13],
  'Back Three': [11, 14, 15]
};

interface PlayerDetailDialogProps {
  player: Player;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave: (playerId: string, updates: Partial<Player>) => void;
}

function PlayerDetailDialog({ player, open, onOpenChange, onSave }: PlayerDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(player.firstName);
  const [lastName, setLastName] = useState(player.lastName);
  const [age, setAge] = useState(player.age);
  const [nationality, setNationality] = useState(player.nationality);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const attributes = Object.entries(player.attributes);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'Required';
    if (firstName.length > 50) newErrors.firstName = 'Max 50 characters';
    if (!lastName.trim()) newErrors.lastName = 'Required';
    if (lastName.length > 50) newErrors.lastName = 'Max 50 characters';
    if (age < 17 || age > 45) newErrors.age = 'Must be 17-45';
    if (!nationality.trim()) newErrors.nationality = 'Required';
    if (nationality.length > 50) newErrors.nationality = 'Max 50 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(player.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age,
      nationality: nationality.trim()
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFirstName(player.firstName);
    setLastName(player.lastName);
    setAge(player.age);
    setNationality(player.nationality);
    setErrors({});
    setIsEditing(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel();
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>
            {isEditing ? 'Edit Player' : `${player.firstName} ${player.lastName}`}
          </DialogTitle>
          {!isEditing && (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </DialogHeader>
        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={50}
                  />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={50}
                  />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min={17}
                    max={45}
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 17)}
                  />
                  {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    maxLength={50}
                  />
                  {errors.nationality && <p className="text-xs text-destructive">{errors.nationality}</p>}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Squad() {
  const { getMyTeam, getMyLeague, updatePlayer, removePlayer, replaceSquad } = useGame();
  const { getPlayerContract, getTeamSalaryCap, releasePlayer, extendContract } = useTransfer();
  const { toast } = useToast();
  const team = getMyTeam();
  const league = getMyLeague();
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [contractPlayer, setContractPlayer] = useState<Player | null>(null);

  // Player psychology extended data
  const [playerExtendedData, setPlayerExtendedData] = useState<Record<string, PlayerExtended>>(() => {
    const saved = localStorage.getItem('playerExtendedData');
    if (saved) try { return JSON.parse(saved); } catch { /* ignore */ }
    // Generate defaults for all players
    const data: Record<string, PlayerExtended> = {};
    if (team) {
      team.players.forEach(p => {
        data[p.id] = generatePlayerExtended(p.age, p.overall, p.nationality) as PlayerExtended;
      });
    }
    return data;
  });

  // Persist extended data
  useEffect(() => {
    localStorage.setItem('playerExtendedData', JSON.stringify(playerExtendedData));
  }, [playerExtendedData]);

  // Ensure new players get extended data
  useEffect(() => {
    if (!team) return;
    const updated = { ...playerExtendedData };
    let changed = false;
    team.players.forEach(p => {
      if (!updated[p.id]) {
        updated[p.id] = generatePlayerExtended(p.age, p.overall, p.nationality) as PlayerExtended;
        changed = true;
      }
    });
    if (changed) setPlayerExtendedData(updated);
  }, [team?.players]);

  const handleUpdateExtended = (playerId: string, updates: Partial<PlayerExtended>) => {
    setPlayerExtendedData(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], ...updates }
    }));
  };

  const handleSetMentor = (menteeId: string, mentorId: string) => {
    handleUpdateExtended(menteeId, { mentorId });
    toast({ title: 'Mentor Assigned', description: 'The mentoring relationship has been established.' });
  };

  if (!team || !league) return null;

  const teamCurrency: Currency = LEAGUE_CURRENCY[league.name] || 'EUR';
  const salaryCap = getTeamSalaryCap(team.id);

  const filteredPlayers = team.players.filter(player => {
    const matchesSearch = `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === 'all' || 
      Object.entries(POSITION_GROUPS).some(([group, positions]) => 
        group === positionFilter && positions.includes(player.positionNumber)
      );
    return matchesSearch && matchesPosition;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => a.positionNumber - b.positionNumber);

  const getContractBadge = (contract: Contract | null) => {
    if (!contract) return <Badge variant="outline">No Contract</Badge>;
    
    const status = getContractStatus(contract.yearsRemaining);
    switch (status) {
      case 'expiring':
        return <Badge variant="destructive">Expiring</Badge>;
      case 'short':
        return <Badge variant="secondary">1yr</Badge>;
      case 'medium':
        return <Badge variant="outline">{contract.yearsRemaining}yrs</Badge>;
      case 'long':
        return <Badge variant="default">{contract.yearsRemaining}yrs</Badge>;
      default:
        return <Badge variant="outline">{contract.yearsRemaining}yrs</Badge>;
    }
  };

  const handleReleasePlayer = (playerId: string) => {
    releasePlayer(playerId);
    removePlayer(playerId);
    setContractPlayer(null);
  };

  const handleExtendContract = (playerId: string, newSalary: number, years: number) => {
    extendContract(playerId, newSalary, years);
    setContractPlayer(null);
  };

  // Calculate total wage bill
  const totalWages = team.players.reduce((total, player) => {
    const contract = getPlayerContract(player.id);
    return total + (contract?.salary || 0);
  }, 0);

  const expiringCount = team.players.filter(player => {
    const contract = getPlayerContract(player.id);
    return contract && contract.yearsRemaining === 0;
  }).length;

  const handleSquadImport = (players: Player[]) => {
    replaceSquad(players);
    toast({
      title: 'Squad Imported!',
      description: `Successfully imported ${players.length} players.`
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Squad</h1>
          <p className="text-muted-foreground">{team.players.length} players • {expiringCount} contracts expiring</p>
        </div>
        <div className="flex items-center gap-2">
          <SquadImportDialog 
            onImport={handleSquadImport} 
            currentSquadSize={team.players.length}
            currentPlayers={team.players}
          />
        </div>
      </div>

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster" className="gap-1">
            <Users className="h-4 w-4" />
            Roster
          </TabsTrigger>
          <TabsTrigger value="depth" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            Depth Analysis
          </TabsTrigger>
          <TabsTrigger value="psychology" className="gap-1">
            <Brain className="h-4 w-4" />
            Psychology
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-6 mt-4">

      {/* Salary Cap & Wage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Wage Bill</p>
                <p className="text-xl font-bold">{formatSalary(totalWages, teamCurrency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiring Contracts</p>
                <p className="text-xl font-bold">{expiringCount} players</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {salaryCap && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Salary Cap</span>
                  <span className="font-medium">
                    {formatSalary(salaryCap.current, teamCurrency as Currency)} / {formatSalary(salaryCap.max, teamCurrency as Currency)}
                  </span>
                </div>
                <Progress value={(salaryCap.current / salaryCap.max) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {formatSalary(salaryCap.remaining, teamCurrency as Currency)} remaining
                </p>
              </div>
            </CardContent>
          </Card>
        )}
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
          <ScrollArea className="h-[calc(100vh-500px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-center">Age</TableHead>
                  <TableHead className="text-center">OVR</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                  <TableHead className="text-center">Contract</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlayers.map(player => {
                  const contract = getPlayerContract(player.id);
                  return (
                    <TableRow 
                      key={player.id} 
                      className={`cursor-pointer hover:bg-muted/50 ${player.injured ? 'opacity-60' : ''}`}
                    >
                      <TableCell className="font-bold text-primary">{player.positionNumber}</TableCell>
                      <TableCell onClick={() => setSelectedPlayer(player)}>
                        <div>
                          <p className="font-medium">{player.firstName} {player.lastName}</p>
                          <p className="text-xs text-muted-foreground">{player.nationality}</p>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => setSelectedPlayer(player)}>{player.position}</TableCell>
                      <TableCell className="text-center" onClick={() => setSelectedPlayer(player)}>{player.age}</TableCell>
                      <TableCell className="text-center" onClick={() => setSelectedPlayer(player)}>
                        <Badge variant={player.overall >= 80 ? 'default' : player.overall >= 70 ? 'secondary' : 'outline'}>
                          {player.overall}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium" onClick={() => setSelectedPlayer(player)}>
                        {contract ? formatSalary(contract.salary, contract.currency) : '-'}
                      </TableCell>
                      <TableCell className="text-center" onClick={() => setSelectedPlayer(player)}>
                        {getContractBadge(contract)}
                      </TableCell>
                      <TableCell className="text-center" onClick={() => setSelectedPlayer(player)}>
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
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContractPlayer(player);
                          }}
                        >
                          <FileText className="h-4 w-4" />
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

        </TabsContent>

        <TabsContent value="depth" className="mt-4">
          <ClubSquadDepth players={team.players} teamName={team.name} />
        </TabsContent>
      </Tabs>

      {selectedPlayer && (
        <PlayerDetailDialog 
          player={selectedPlayer} 
          open={!!selectedPlayer} 
          onOpenChange={(open) => !open && setSelectedPlayer(null)}
          onSave={updatePlayer}
        />
      )}

      {contractPlayer && getPlayerContract(contractPlayer.id) && (
        <ContractManagementDialog
          player={contractPlayer}
          contract={getPlayerContract(contractPlayer.id)!}
          open={!!contractPlayer}
          onOpenChange={(open) => !open && setContractPlayer(null)}
          onRelease={handleReleasePlayer}
          onExtend={handleExtendContract}
          teamCurrency={teamCurrency}
          salaryCapRemaining={salaryCap?.remaining}
        />
      )}
    </div>
  );
}
