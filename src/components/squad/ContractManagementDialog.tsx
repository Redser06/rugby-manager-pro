import { useState } from 'react';
import { Player } from '@/types/game';
import { Contract, Currency, CURRENCY_SYMBOLS } from '@/types/transfer';
import { formatSalary, getContractStatus } from '@/utils/contractGenerator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileText, UserMinus, RefreshCw, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface ContractManagementDialogProps {
  player: Player;
  contract: Contract;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRelease: (playerId: string) => void;
  onExtend: (playerId: string, newSalary: number, years: number) => void;
  teamCurrency: Currency;
  salaryCapRemaining?: number;
}

export function ContractManagementDialog({
  player,
  contract,
  open,
  onOpenChange,
  onRelease,
  onExtend,
  teamCurrency,
  salaryCapRemaining
}: ContractManagementDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [extensionYears, setExtensionYears] = useState(2);
  const [extensionSalary, setExtensionSalary] = useState(contract.salary);
  const [salaryAdjustment, setSalaryAdjustment] = useState(0);
  const [confirmRelease, setConfirmRelease] = useState(false);

  const contractStatus = getContractStatus(contract.yearsRemaining);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expiring': return 'destructive';
      case 'short': return 'secondary';
      case 'medium': return 'outline';
      case 'long': return 'default';
      default: return 'outline';
    }
  };

  const handleSalarySliderChange = (value: number[]) => {
    setSalaryAdjustment(value[0]);
    const newSalary = Math.round(contract.salary * (1 + value[0] / 100));
    setExtensionSalary(newSalary);
  };

  const handleExtendContract = () => {
    if (salaryCapRemaining !== undefined && extensionSalary > salaryCapRemaining + contract.salary) {
      toast.error('Extension would exceed salary cap');
      return;
    }
    
    onExtend(player.id, extensionSalary, extensionYears);
    toast.success(`Contract extended for ${player.firstName} ${player.lastName}`);
    onOpenChange(false);
  };

  const handleReleasePlayer = () => {
    if (!confirmRelease) {
      setConfirmRelease(true);
      return;
    }
    
    onRelease(player.id);
    toast.success(`${player.firstName} ${player.lastName} has been released`);
    onOpenChange(false);
  };

  const annualSavings = contract.salary;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) setConfirmRelease(false);
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Management
          </DialogTitle>
          <DialogDescription>
            {player.firstName} {player.lastName} • {player.position}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="extend">Extend</TabsTrigger>
            <TabsTrigger value="release">Release</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Annual Salary</p>
                <p className="text-xl font-bold">{formatSalary(contract.salary, contract.currency)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Contract Status</p>
                <Badge variant={getStatusColor(contractStatus)} className="capitalize">
                  {contractStatus === 'expiring' ? 'Expiring This Season' : `${contract.yearsRemaining} year${contract.yearsRemaining !== 1 ? 's' : ''} remaining`}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Signing Bonus</p>
                <p className="font-medium">{formatSalary(contract.signingBonus, contract.currency)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Performance Bonus</p>
                <p className="font-medium">{formatSalary(contract.performanceBonus, contract.currency)}/match</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Contract Start</p>
                <p className="font-medium">{contract.startDate.month}/{contract.startDate.year}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Contract End</p>
                <p className="font-medium">{contract.endDate.month}/{contract.endDate.year}</p>
              </div>
            </div>

            {contract.isMarquee && (
              <Badge variant="secondary" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                Marquee Player (Exempt from Salary Cap)
              </Badge>
            )}
          </TabsContent>

          <TabsContent value="extend" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Extension Length</Label>
              <Select value={extensionYears.toString()} onValueChange={(v) => setExtensionYears(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Year</SelectItem>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="4">4 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Salary Adjustment</Label>
                <span className="text-sm text-muted-foreground">
                  {salaryAdjustment > 0 ? '+' : ''}{salaryAdjustment}%
                </span>
              </div>
              <Slider
                value={[salaryAdjustment]}
                onValueChange={handleSalarySliderChange}
                min={-20}
                max={50}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-20%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Current Salary</span>
                <span className="font-medium">{formatSalary(contract.salary, contract.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">New Salary</span>
                <span className="font-bold text-primary">{formatSalary(extensionSalary, contract.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Contract Value</span>
                <span className="font-medium">{formatSalary(extensionSalary * extensionYears, contract.currency)}</span>
              </div>
            </div>

            {salaryCapRemaining !== undefined && (
              <p className="text-xs text-muted-foreground">
                Cap space remaining: {formatSalary(salaryCapRemaining, teamCurrency)}
              </p>
            )}

            <Button onClick={handleExtendContract} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Offer Extension
            </Button>
          </TabsContent>

          <TabsContent value="release" className="space-y-4 mt-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Release {player.firstName} {player.lastName}?</p>
                  <p className="text-sm text-muted-foreground">
                    This action cannot be undone. The player will become a free agent.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Financial Impact</p>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Annual Salary Saved</span>
                <span className="font-medium text-primary">+{formatSalary(annualSavings, contract.currency)}</span>
              </div>
              {contract.yearsRemaining > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Settlement Cost</span>
                  <span className="font-medium text-destructive">
                    -{formatSalary(Math.round(contract.salary * 0.25), contract.currency)}
                  </span>
                </div>
              )}
            </div>

            <Button 
              variant={confirmRelease ? 'destructive' : 'outline'}
              onClick={handleReleasePlayer}
              className="w-full"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              {confirmRelease ? 'Confirm Release' : 'Release Player'}
            </Button>

            {confirmRelease && (
              <Button 
                variant="ghost" 
                onClick={() => setConfirmRelease(false)}
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
