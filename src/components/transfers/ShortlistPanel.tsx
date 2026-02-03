import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, 
  Trash2, 
  FileText,
  Clock,
  User
} from 'lucide-react';
import { useTransfer } from '@/contexts/TransferContext';
import { formatSalary, getContractStatus } from '@/utils/contractGenerator';
import { PlayerWithContract } from '@/types/transfer';
import { cn } from '@/lib/utils';

interface ShortlistPanelProps {
  players: PlayerWithContract[];
  onMakeOffer: (player: PlayerWithContract) => void;
}

export function ShortlistPanel({ players, onMakeOffer }: ShortlistPanelProps) {
  const { 
    transferState, 
    removeFromShortlist, 
    updateShortlistNotes,
    updateShortlistPriority 
  } = useTransfer();
  
  const shortlistedPlayers = transferState.shortlist
    .map(s => {
      const player = players.find(p => p.id === s.playerId);
      return player ? { ...s, player } : null;
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
    }
  };
  
  if (shortlistedPlayers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Players Shortlisted</h3>
          <p className="text-sm text-muted-foreground">
            Browse the transfer market and add players to your shortlist to track them.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {shortlistedPlayers.map(({ player, notes, priority, playerId }) => {
        const contractStatus = getContractStatus(player.contract.yearsRemaining);
        
        return (
          <Card key={playerId} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {player.firstName} {player.lastName}
                      </h3>
                      <Badge className={getPriorityColor(priority)} variant="secondary">
                        {priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {player.position} • {player.age}y • {player.currentTeamName}
                    </p>
                  </div>
                </div>
                <div className="text-xl font-bold">{player.overall}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Salary</div>
                  <div className="font-medium">
                    {formatSalary(player.contract.salary, player.contract.currency)}/yr
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Contract</div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className={contractStatus === 'expiring' ? 'text-destructive font-medium' : ''}>
                      {player.contract.yearsRemaining === 0 
                        ? 'Expiring' 
                        : `${player.contract.yearsRemaining}y left`}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">League</div>
                  <div className="font-medium truncate">{player.currentLeague}</div>
                </div>
              </div>
              
              <div className="flex gap-2 mb-3">
                <Select 
                  value={priority} 
                  onValueChange={(v) => updateShortlistPriority(playerId, v as 'high' | 'medium' | 'low')}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  value={notes}
                  onChange={(e) => updateShortlistNotes(playerId, e.target.value)}
                  placeholder="Add notes..."
                  className="flex-1"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => removeFromShortlist(playerId)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
                <Button 
                  size="sm"
                  className="flex-1"
                  onClick={() => onMakeOffer(player)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Make Offer
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
