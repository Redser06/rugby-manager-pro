import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  PlayerWithContract, 
  LIFESTYLE_FACTORS, 
  PLAY_STYLES,
  Currency,
  CURRENCY_SYMBOLS
} from '@/types/transfer';
import { formatSalary } from '@/utils/contractGenerator';
import { useTransfer } from '@/contexts/TransferContext';
import { useGame } from '@/contexts/GameContext';
import { toast } from 'sonner';

interface OfferDialogProps {
  player: PlayerWithContract | null;
  open: boolean;
  onClose: () => void;
}

export function OfferDialog({ player, open, onClose }: OfferDialogProps) {
  const { createOffer, canSignPlayer, getTeamSalaryCap } = useTransfer();
  const { getMyTeam, getMyLeague } = useGame();
  const myTeam = getMyTeam();
  const myLeague = getMyLeague();
  
  const [salary, setSalary] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [contractYears, setContractYears] = useState(2);
  const [playingTime, setPlayingTime] = useState<'starter' | 'rotation' | 'backup' | 'development'>('rotation');
  const [styleOfPlay, setStyleOfPlay] = useState(PLAY_STYLES[0]);
  const [selectedLifestyle, setSelectedLifestyle] = useState<string[]>([]);
  const [projectDescription, setProjectDescription] = useState('');
  const [isMarquee, setIsMarquee] = useState(false);
  
  // Reset form when player changes
  useState(() => {
    if (player) {
      setSalary(Math.round(player.contract.salary * 1.1)); // Offer 10% more by default
      setBonus(player.contract.signingBonus);
    }
  });
  
  if (!player || !myTeam) return null;
  
  const currency = player.contract.currency;
  const salaryCap = getTeamSalaryCap(myTeam.id);
  const { canSign, reason } = canSignPlayer(player.id, salary);
  
  const handleSubmit = () => {
    if (!canSign) {
      toast.error(reason);
      return;
    }
    
    createOffer({
      playerId: player.id,
      fromTeamId: player.currentTeamId,
      toTeamId: myTeam.id,
      offeredSalary: salary,
      offeredCurrency: currency,
      offeredBonus: bonus,
      contractYears,
      isMarquee,
      playingTimePromise: playingTime,
      styleOfPlay,
      lifestyleFactors: selectedLifestyle,
      projectDescription
    });
    
    toast.success(`Offer sent to ${player.firstName} ${player.lastName}`);
    onClose();
  };
  
  const toggleLifestyle = (factor: string) => {
    setSelectedLifestyle(prev => 
      prev.includes(factor) 
        ? prev.filter(f => f !== factor)
        : [...prev, factor]
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Make Offer to {player.firstName} {player.lastName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Player Summary */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="font-semibold">{player.position}</div>
              <div className="text-sm text-muted-foreground">
                {player.currentTeamName} • {player.age} years old
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{player.overall}</div>
              <div className="text-sm text-muted-foreground">
                Current: {formatSalary(player.contract.salary, currency)}/yr
              </div>
            </div>
          </div>
          
          {/* Salary Cap Warning */}
          {salaryCap && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex justify-between">
                <span>Salary Cap Remaining:</span>
                <span className={salaryCap.remaining < salary ? 'text-destructive' : 'text-foreground'}>
                  {CURRENCY_SYMBOLS[salaryCap.currency as Currency]}{salaryCap.remaining.toLocaleString()}
                </span>
              </div>
            </div>
          )}
          
          {/* Financial Terms */}
          <div className="space-y-4">
            <h4 className="font-semibold">Financial Terms</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Annual Salary ({CURRENCY_SYMBOLS[currency]})</Label>
                <Input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  step={10000}
                />
                <p className="text-xs text-muted-foreground">
                  {formatSalary(salary, currency)}/year
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Signing Bonus ({CURRENCY_SYMBOLS[currency]})</Label>
                <Input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(Number(e.target.value))}
                  step={5000}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Contract Length: {contractYears} years</Label>
              <Slider
                value={[contractYears]}
                onValueChange={([v]) => setContractYears(v)}
                min={1}
                max={5}
                step={1}
              />
            </div>
            
            {myLeague?.name === 'Gallagher Premiership' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marquee"
                  checked={isMarquee}
                  onCheckedChange={(checked) => setIsMarquee(checked as boolean)}
                />
                <Label htmlFor="marquee" className="text-sm">
                  Marquee Player (exempt from salary cap)
                </Label>
              </div>
            )}
          </div>
          
          {/* Playing Role */}
          <div className="space-y-4">
            <h4 className="font-semibold">Playing Role</h4>
            
            <div className="space-y-2">
              <Label>Playing Time Promise</Label>
              <Select value={playingTime} onValueChange={(v) => setPlayingTime(v as typeof playingTime)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Guaranteed Starter</SelectItem>
                  <SelectItem value="rotation">Rotation Player</SelectItem>
                  <SelectItem value="backup">Squad Depth / Backup</SelectItem>
                  <SelectItem value="development">Development Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Style of Play</Label>
              <Select value={styleOfPlay} onValueChange={setStyleOfPlay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAY_STYLES.map(style => (
                    <SelectItem key={style} value={style}>{style}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Lifestyle Factors */}
          <div className="space-y-4">
            <h4 className="font-semibold">Lifestyle Selling Points</h4>
            <div className="flex flex-wrap gap-2">
              {LIFESTYLE_FACTORS.map(factor => (
                <Badge
                  key={factor}
                  variant={selectedLifestyle.includes(factor) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleLifestyle(factor)}
                >
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Project Description */}
          <div className="space-y-2">
            <Label>Sell the Project</Label>
            <Textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Describe your vision for the club and how this player fits in..."
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSign}>
            {canSign ? 'Send Offer' : reason}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
