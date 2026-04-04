import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Star,
  Send,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  Phone,
  Heart,
  GraduationCap
} from 'lucide-react';
import { useTransfer } from '@/contexts/TransferContext';
import { useGame } from '@/contexts/GameContext';
import { PlayerCard } from '@/components/transfers/PlayerCard';
import { ShortlistPanel } from '@/components/transfers/ShortlistPanel';
import { OffersPanel } from '@/components/transfers/OffersPanel';
import { OfferDialog } from '@/components/transfers/OfferDialog';
import { SalaryCapWidget } from '@/components/transfers/SalaryCapWidget';
import { AgentDemandsPanel } from '@/components/transfers/AgentDemandsPanel';
import { TeamChemistryPanel } from '@/components/transfers/TeamChemistryPanel';
import { AcademyPoachingPanel } from '@/components/transfers/AcademyPoachingPanel';
import { PlayerWithContract } from '@/types/transfer';
import { Position } from '@/types/game';
import { LEAGUES } from '@/data/leagues';

const POSITION_GROUPS = {
  'All': null,
  'Props': ['Loosehead Prop', 'Tighthead Prop'],
  'Hooker': ['Hooker'],
  'Locks': ['Lock'],
  'Back Row': ['Blindside Flanker', 'Openside Flanker', 'Number 8'],
  'Half Backs': ['Scrum-half', 'Fly-half'],
  'Centres': ['Inside Centre', 'Outside Centre'],
  'Back Three': ['Left Wing', 'Right Wing', 'Fullback']
};

export default function Transfers() {
  const { 
    getAllAvailablePlayers, 
    getExpiringContracts, 
    transferState,
    isTransferWindowOpen,
    getTransferWindowDates
  } = useTransfer();
  const { getMyTeam } = useGame();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<keyof typeof POSITION_GROUPS>('All');
  const [leagueFilter, setLeagueFilter] = useState<string>('All');
  const [contractFilter, setContractFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'overall' | 'age' | 'salary'>('overall');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithContract | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  
  const myTeam = getMyTeam();
  const windowOpen = isTransferWindowOpen();
  const windowDates = getTransferWindowDates();
  
  const allPlayers = useMemo(() => getAllAvailablePlayers(), []);
  const expiringPlayers = useMemo(() => getExpiringContracts(), []);
  
  const filteredPlayers = useMemo(() => {
    let result = [...allPlayers];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.currentTeamName.toLowerCase().includes(query)
      );
    }
    
    // Position filter
    if (positionFilter !== 'All') {
      const positions = POSITION_GROUPS[positionFilter];
      if (positions) {
        result = result.filter(p => positions.includes(p.position));
      }
    }
    
    // League filter
    if (leagueFilter !== 'All') {
      result = result.filter(p => p.currentLeague === leagueFilter);
    }
    
    // Contract filter
    if (contractFilter === 'Expiring') {
      result = result.filter(p => p.contract.yearsRemaining === 0);
    } else if (contractFilter === 'Short') {
      result = result.filter(p => p.contract.yearsRemaining <= 1);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'overall': return b.overall - a.overall;
        case 'age': return a.age - b.age;
        case 'salary': return b.contract.salary - a.contract.salary;
        default: return 0;
      }
    });
    
    return result;
  }, [allPlayers, searchQuery, positionFilter, leagueFilter, contractFilter, sortBy]);
  
  const handleMakeOffer = (player: PlayerWithContract) => {
    setSelectedPlayer(player);
    setOfferDialogOpen(true);
  };
  
  if (!myTeam) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please select a team first.</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Transfer Market</h1>
          <p className="text-muted-foreground">
            Scout players, manage shortlists, and negotiate contracts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {windowOpen ? (
            <Badge className="bg-green-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              Window Open
            </Badge>
          ) : (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              Window: {windowDates.start} - {windowDates.end}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Transfer Window Warning */}
      {!windowOpen && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium">Transfer Window Closed</p>
              <p className="text-sm text-muted-foreground">
                The transfer window opens {windowDates.start}. You can still scout and shortlist players.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <SalaryCapWidget />
          
          {/* Quick Stats */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Shortlisted
                </span>
                <Badge variant="secondary">{transferState.shortlist.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Send className="h-4 w-4" />
                  Active Offers
                </span>
                <Badge variant="secondary">
                  {transferState.outgoingOffers.filter(o => o.status === 'pending').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Expiring Contracts
                </span>
                <Badge variant="secondary">{expiringPlayers.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="market">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="market" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Market
              </TabsTrigger>
              <TabsTrigger value="shortlist" className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                Shortlist ({transferState.shortlist.length})
              </TabsTrigger>
              <TabsTrigger value="offers" className="flex items-center gap-1">
                <Send className="h-4 w-4" />
                Offers
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="market" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search players or teams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    <Select value={positionFilter} onValueChange={(v) => setPositionFilter(v as keyof typeof POSITION_GROUPS)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Position" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(POSITION_GROUPS).map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={leagueFilter} onValueChange={setLeagueFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="League" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Leagues</SelectItem>
                        {LEAGUES.map(league => (
                          <SelectItem key={league.id} value={league.name}>
                            {league.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={contractFilter} onValueChange={setContractFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Contract" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Contracts</SelectItem>
                        <SelectItem value="Expiring">Expiring</SelectItem>
                        <SelectItem value="Short">≤1 Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {filteredPlayers.length} players found
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Sort by:</span>
                      <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="overall">Overall</SelectItem>
                          <SelectItem value="age">Age</SelectItem>
                          <SelectItem value="salary">Salary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Player Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredPlayers.slice(0, 30).map(player => (
                  <PlayerCard 
                    key={player.id} 
                    player={player}
                    onMakeOffer={handleMakeOffer}
                  />
                ))}
              </div>
              
              {filteredPlayers.length > 30 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Showing 30 of {filteredPlayers.length} players. Refine your search for more specific results.
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="shortlist">
              <ShortlistPanel 
                players={allPlayers} 
                onMakeOffer={handleMakeOffer}
              />
            </TabsContent>
            
            <TabsContent value="offers">
              <OffersPanel players={allPlayers} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Offer Dialog */}
      <OfferDialog
        player={selectedPlayer}
        open={offerDialogOpen}
        onClose={() => {
          setOfferDialogOpen(false);
          setSelectedPlayer(null);
        }}
      />
    </div>
  );
}
