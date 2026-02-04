import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BACKS_MOVES, BacksMove } from '@/types/tactics';
import { Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';

interface BacksPatternsPanelProps {
  selectedMoves: string[];
  onChange: (moves: string[]) => void;
  maxMoves?: number;
}

function MoveVisualizer({ move }: { move: BacksMove }) {
  return (
    <div className="relative w-full h-24 bg-primary/5 rounded border overflow-hidden">
      {/* Simple pitch background */}
      <div className="absolute inset-0">
        {/* Gain line */}
        <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-muted-foreground/30" />
      </div>
      
      {/* Player positions */}
      {move.movements.map((point, idx) => {
        // Map position numbers to x coordinates
        const positionX: Record<number, number> = {
          9: 25, 10: 35, 12: 50, 13: 60, 11: 15, 14: 80, 15: 70
        };
        
        return (
          <div
            key={idx}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${positionX[point.position] || point.x}%`, 
              top: `${30 + idx * 18}%` 
            }}
          >
            <div className={`
              w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold
              ${point.action === 'pass' ? 'bg-blue-500 text-white' :
                point.action === 'run' ? 'bg-primary text-primary-foreground' :
                point.action === 'loop' ? 'bg-purple-500 text-white' :
                point.action === 'dummy' ? 'bg-muted text-muted-foreground border-2 border-dashed' :
                'bg-accent text-accent-foreground'}
            `}>
              {point.position}
            </div>
          </div>
        );
      })}
      
      {/* Action legend */}
      <div className="absolute bottom-1 right-1 flex gap-1">
        <div className="text-[8px] px-1 bg-blue-500/20 text-blue-600 rounded">pass</div>
        <div className="text-[8px] px-1 bg-primary/20 text-primary rounded">run</div>
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: BacksMove['riskLevel'] }) {
  if (level === 'low') {
    return (
      <Badge variant="secondary" className="text-xs flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Low Risk
      </Badge>
    );
  }
  if (level === 'medium') {
    return (
      <Badge variant="outline" className="text-xs flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        Medium
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="text-xs flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" />
      High Risk
    </Badge>
  );
}

export function BacksPatternsPanel({ selectedMoves, onChange, maxMoves = 4 }: BacksPatternsPanelProps) {
  const toggleMove = (moveId: string) => {
    if (selectedMoves.includes(moveId)) {
      onChange(selectedMoves.filter(id => id !== moveId));
    } else if (selectedMoves.length < maxMoves) {
      onChange([...selectedMoves, moveId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Back Line Patterns
        </CardTitle>
        <CardDescription>
          Select up to {maxMoves} moves for your backline to execute. These patterns dictate how your backs attack.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <Badge variant={selectedMoves.length >= maxMoves ? "destructive" : "secondary"}>
            {selectedMoves.length}/{maxMoves} moves selected
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BACKS_MOVES.map((move) => {
            const isSelected = selectedMoves.includes(move.id);
            const isDisabled = !isSelected && selectedMoves.length >= maxMoves;
            
            return (
              <div
                key={move.id}
                className={`
                  relative p-3 border rounded-lg transition-all cursor-pointer
                  ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !isDisabled && toggleMove(move.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleMove(move.id)}
                      disabled={isDisabled}
                    />
                    <Label className="font-medium text-sm cursor-pointer">{move.name}</Label>
                  </div>
                  <RiskBadge level={move.riskLevel} />
                </div>
                
                <MoveVisualizer move={move} />
                
                <p className="text-xs text-muted-foreground mt-2">{move.description}</p>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px]">
                    Target: {move.targetGap.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Start: {move.startPosition.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
