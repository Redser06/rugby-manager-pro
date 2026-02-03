import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  TrendingUp
} from 'lucide-react';
import { useTransfer } from '@/contexts/TransferContext';
import { formatSalary } from '@/utils/contractGenerator';
import { TransferOffer, PlayerWithContract } from '@/types/transfer';
import { cn } from '@/lib/utils';

interface OffersPanelProps {
  players: PlayerWithContract[];
}

export function OffersPanel({ players }: OffersPanelProps) {
  const { transferState, withdrawOffer } = useTransfer();
  
  const getStatusIcon = (status: TransferOffer['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'accepted': return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'negotiating': return <AlertCircle className="h-4 w-4 text-accent-foreground" />;
      case 'withdrawn': return <XCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getStatusBadge = (status: TransferOffer['status']) => {
    const variants: Record<typeof status, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      accepted: 'default',
      rejected: 'destructive',
      negotiating: 'outline',
      withdrawn: 'outline'
    };
    return variants[status];
  };
  
  const getInterestColor = (interest: number) => {
    if (interest >= 70) return 'text-primary';
    if (interest >= 40) return 'text-warning';
    return 'text-destructive';
  };
  
  const activeOffers = transferState.outgoingOffers.filter(o => 
    o.status === 'pending' || o.status === 'negotiating'
  );
  
  const pastOffers = transferState.outgoingOffers.filter(o => 
    o.status !== 'pending' && o.status !== 'negotiating'
  );
  
  const findPlayer = (playerId: string) => players.find(p => p.id === playerId);
  
  if (transferState.outgoingOffers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Active Offers</h3>
          <p className="text-sm text-muted-foreground">
            Browse the transfer market and make offers to players you're interested in.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Active Offers */}
      {activeOffers.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Active Offers ({activeOffers.length})</h3>
          <div className="space-y-3">
            {activeOffers.map(offer => {
              const player = findPlayer(offer.playerId);
              if (!player) return null;
              
              return (
                <Card key={offer.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {player.firstName} {player.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {player.position} • {player.currentTeamName}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadge(offer.status)}>
                        {getStatusIcon(offer.status)}
                        <span className="ml-1 capitalize">{offer.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Offered Salary</div>
                        <div className="font-medium">
                          {formatSalary(offer.offeredSalary, offer.offeredCurrency)}/yr
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Contract</div>
                        <div className="font-medium">{offer.contractYears} years</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Player Interest</div>
                        <div className={cn("font-medium flex items-center gap-1", getInterestColor(offer.playerInterest))}>
                          <TrendingUp className="h-3 w-3" />
                          {offer.playerInterest}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 text-xs text-muted-foreground mb-3">
                      <Badge variant="outline">{offer.playingTimePromise}</Badge>
                      {offer.isMarquee && <Badge variant="outline">Marquee</Badge>}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => withdrawOffer(offer.id)}
                    >
                      Withdraw Offer
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Past Offers */}
      {pastOffers.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-muted-foreground">Past Offers</h3>
          <div className="space-y-2">
            {pastOffers.slice(0, 5).map(offer => {
              const player = findPlayer(offer.playerId);
              if (!player) return null;
              
              return (
                <div 
                  key={offer.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(offer.status)}
                    <div>
                      <div className="font-medium text-sm">
                        {player.firstName} {player.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatSalary(offer.offeredSalary, offer.offeredCurrency)}/yr • {offer.contractYears}y
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusBadge(offer.status)} className="capitalize">
                    {offer.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
