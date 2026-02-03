import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { useTransfer } from '@/contexts/TransferContext';
import { useGame } from '@/contexts/GameContext';
import { SALARY_CAP_RULES, MAX_SQUAD_SIZE, CURRENCY_SYMBOLS, Currency } from '@/types/transfer';

export function SalaryCapWidget() {
  const { getTeamSalaryCap, getTeamSquadSize } = useTransfer();
  const { getMyTeam, getMyLeague } = useGame();
  
  const myTeam = getMyTeam();
  const myLeague = getMyLeague();
  
  if (!myTeam || !myLeague) return null;
  
  const salaryCap = getTeamSalaryCap(myTeam.id);
  const squadSize = getTeamSquadSize(myTeam.id);
  const rules = SALARY_CAP_RULES[myLeague.name];
  
  const squadPercentage = (squadSize / MAX_SQUAD_SIZE) * 100;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Budget & Squad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Squad Size */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Squad Size
            </span>
            <span className="font-medium">{squadSize} / {MAX_SQUAD_SIZE}</span>
          </div>
          <Progress value={squadPercentage} className="h-2" />
          {squadSize >= MAX_SQUAD_SIZE - 3 && (
            <p className="text-xs text-warning flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Near maximum capacity
            </p>
          )}
        </div>
        
        {/* Salary Cap */}
        {salaryCap ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Salary Cap</span>
              <span className="font-medium">
                {CURRENCY_SYMBOLS[salaryCap.currency as Currency]}{salaryCap.current.toLocaleString()} / {CURRENCY_SYMBOLS[salaryCap.currency as Currency]}{salaryCap.max.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={(salaryCap.current / salaryCap.max) * 100} 
              className="h-2"
            />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Remaining:</span>
              <span className={salaryCap.remaining < 500000 ? 'text-destructive font-medium' : 'text-foreground'}>
                {CURRENCY_SYMBOLS[salaryCap.currency as Currency]}{salaryCap.remaining.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>No salary cap applies</span>
          </div>
        )}
        
        {/* League Rules */}
        {rules && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">League Rules</p>
            <div className="flex flex-wrap gap-1">
              {rules.hasCap && (
                <Badge variant="outline" className="text-xs">
                  Cap: {CURRENCY_SYMBOLS[rules.currency]}{(rules.capAmount / 1000000).toFixed(1)}m
                </Badge>
              )}
              {rules.under21Exempt && (
                <Badge variant="outline" className="text-xs">
                  U21 Exempt
                </Badge>
              )}
              {rules.marqueeSlots > 0 && (
                <Badge variant="outline" className="text-xs">
                  {rules.marqueeSlots} Marquee Slots
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
