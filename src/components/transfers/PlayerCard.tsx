import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  StarOff, 
  FileText, 
  TrendingUp, 
  Clock,
  User
} from 'lucide-react';
import { PlayerWithContract } from '@/types/transfer';
import { formatSalary, getContractStatus } from '@/utils/contractGenerator';
import { useTransfer } from '@/contexts/TransferContext';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: PlayerWithContract;
  onMakeOffer: (player: PlayerWithContract) => void;
  compact?: boolean;
}

export function PlayerCard({ player, onMakeOffer, compact = false }: PlayerCardProps) {
  const { isOnShortlist, addToShortlist, removeFromShortlist } = useTransfer();
  const shortlisted = isOnShortlist(player.id);
  const contractStatus = getContractStatus(player.contract.yearsRemaining);
  
  const getStatusColor = () => {
    switch (contractStatus) {
      case 'expiring': return 'bg-destructive text-destructive-foreground';
      case 'short': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-muted text-muted-foreground';
      case 'long': return 'bg-muted text-muted-foreground';
    }
  };
  
  const getOverallColor = () => {
    if (player.overall >= 85) return 'text-primary';
    if (player.overall >= 75) return 'text-accent-foreground';
    if (player.overall >= 65) return 'text-secondary-foreground';
    return 'text-muted-foreground';
  };
  
  const toggleShortlist = () => {
    if (shortlisted) {
      removeFromShortlist(player.id);
    } else {
      addToShortlist(player.id, player.currentTeamId);
    }
  };
  
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={cn("text-lg font-bold", getOverallColor())}>
            {player.overall}
          </div>
          <div>
            <div className="font-medium">{player.firstName} {player.lastName}</div>
            <div className="text-xs text-muted-foreground">
              {player.position} • {player.age}y • {player.currentTeamName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusColor()}>
            {player.contract.yearsRemaining}y
          </Badge>
          <span className="text-sm font-medium">
            {formatSalary(player.contract.salary, player.contract.currency)}
          </span>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleShortlist}
          >
            {shortlisted ? (
              <Star className="h-4 w-4 fill-primary text-primary" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{player.firstName} {player.lastName}</h3>
              <p className="text-sm text-muted-foreground">{player.position}</p>
            </div>
          </div>
          <div className={cn("text-2xl font-bold", getOverallColor())}>
            {player.overall}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Age: {player.age}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>Form: {player.form}/10</span>
          </div>
        </div>
        
        <div className="p-2 bg-muted/50 rounded-lg mb-3">
          <div className="text-xs text-muted-foreground mb-1">Current Club</div>
          <div className="font-medium text-sm">{player.currentTeamName}</div>
          <div className="text-xs text-muted-foreground">{player.currentLeague}</div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-muted-foreground">Salary</div>
            <div className="font-semibold">
              {formatSalary(player.contract.salary, player.contract.currency)}/yr
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Contract</div>
            <Badge variant="outline" className={getStatusColor()}>
              <Clock className="h-3 w-3 mr-1" />
              {player.contract.yearsRemaining === 0 
                ? 'Expiring' 
                : `${player.contract.yearsRemaining} year${player.contract.yearsRemaining > 1 ? 's' : ''}`}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={toggleShortlist}
          >
            {shortlisted ? (
              <>
                <Star className="h-4 w-4 mr-1 fill-primary text-primary" />
                Shortlisted
              </>
            ) : (
              <>
                <StarOff className="h-4 w-4 mr-1" />
                Shortlist
              </>
            )}
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
}
