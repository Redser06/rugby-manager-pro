import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { KICKING_STRATEGIES, KickingStrategy } from '@/types/tactics';
import { Goal, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface KickingStrategiesPanelProps {
  selectedStrategies: string[];
  onChange: (strategies: string[]) => void;
  maxStrategies?: number;
}

function TerritorialBadge({ gain }: { gain: KickingStrategy['territorialGain'] }) {
  if (gain === 'high') {
    return (
      <div className="flex items-center gap-0.5 text-green-600">
        <ArrowUp className="h-3 w-3" />
        <span className="text-[10px]">High</span>
      </div>
    );
  }
  if (gain === 'medium') {
    return (
      <div className="flex items-center gap-0.5 text-amber-600">
        <Minus className="h-3 w-3" />
        <span className="text-[10px]">Med</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5 text-red-600">
      <ArrowDown className="h-3 w-3" />
      <span className="text-[10px]">Low</span>
    </div>
  );
}

function KickVisualizer({ strategy }: { strategy: KickingStrategy }) {
  // Simplified pitch showing kick trajectory
  const getKickPath = () => {
    switch (strategy.id) {
      case 'kick_box':
        return { start: { x: 30, y: 70 }, end: { x: 70, y: 35 }, arc: true };
      case 'kick_contest':
        return { start: { x: 50, y: 50 }, end: { x: 55, y: 30 }, arc: true };
      case 'kick_territorial':
        return { start: { x: 35, y: 75 }, end: { x: 80, y: 25 }, arc: false };
      case 'kick_5022':
        return { start: { x: 50, y: 60 }, end: { x: 90, y: 20 }, arc: false };
      case 'kick_grubber':
        return { start: { x: 50, y: 30 }, end: { x: 75, y: 15 }, arc: false };
      case 'kick_crossfield':
        return { start: { x: 40, y: 40 }, end: { x: 85, y: 35 }, arc: true };
      case 'kick_chip':
        return { start: { x: 50, y: 50 }, end: { x: 60, y: 40 }, arc: true };
      default:
        return { start: { x: 50, y: 50 }, end: { x: 70, y: 30 }, arc: false };
    }
  };

  const path = getKickPath();

  return (
    <div className="relative w-full h-20 bg-green-900/20 rounded border overflow-hidden">
      {/* Pitch lines */}
      <div className="absolute top-1/4 left-0 right-0 h-px bg-white/20" /> {/* 22 */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" /> {/* Halfway */}
      <div className="absolute top-3/4 left-0 right-0 h-px bg-white/20" /> {/* Opp 22 */}
      
      {/* Try lines */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/40" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/40" />
      
      {/* Kick origin */}
      <div
        className="absolute w-3 h-3 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${path.start.x}%`, top: `${path.start.y}%` }}
      />
      
      {/* Kick destination */}
      <div
        className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 ${
          strategy.contestable ? 'border-amber-500 bg-amber-500/30' : 'border-blue-500 bg-blue-500/30'
        }`}
        style={{ left: `${path.end.x}%`, top: `${path.end.y}%` }}
      />
      
      {/* Kick trajectory line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {path.arc ? (
          <path
            d={`M ${path.start.x}% ${path.start.y}% Q ${(path.start.x + path.end.x) / 2}% ${Math.min(path.start.y, path.end.y) - 20}% ${path.end.x}% ${path.end.y}%`}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 2"
            fill="none"
            className="text-primary/60"
          />
        ) : (
          <line
            x1={`${path.start.x}%`}
            y1={`${path.start.y}%`}
            x2={`${path.end.x}%`}
            y2={`${path.end.y}%`}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 2"
            className="text-primary/60"
          />
        )}
      </svg>
      
      {/* Icon */}
      <div className="absolute top-1 left-1 text-lg">{strategy.icon}</div>
    </div>
  );
}

export function KickingStrategiesPanel({ selectedStrategies, onChange, maxStrategies = 3 }: KickingStrategiesPanelProps) {
  const toggleStrategy = (strategyId: string) => {
    if (selectedStrategies.includes(strategyId)) {
      onChange(selectedStrategies.filter(id => id !== strategyId));
    } else if (selectedStrategies.length < maxStrategies) {
      onChange([...selectedStrategies, strategyId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Goal className="h-5 w-5 text-primary" />
          Kicking Strategies
        </CardTitle>
        <CardDescription>
          Select up to {maxStrategies} primary kicking options. These influence when and how your team kicks tactically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-3">
          <Badge variant={selectedStrategies.length >= maxStrategies ? "destructive" : "secondary"}>
            {selectedStrategies.length}/{maxStrategies} selected
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-500/30" />
              Contestable
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-500/30" />
              Territory
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {KICKING_STRATEGIES.map((strategy) => {
            const isSelected = selectedStrategies.includes(strategy.id);
            const isDisabled = !isSelected && selectedStrategies.length >= maxStrategies;
            
            return (
              <div
                key={strategy.id}
                className={`
                  relative p-3 border rounded-lg transition-all cursor-pointer
                  ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !isDisabled && toggleStrategy(strategy.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleStrategy(strategy.id)}
                      disabled={isDisabled}
                    />
                    <Label className="font-medium text-sm cursor-pointer">{strategy.name}</Label>
                  </div>
                </div>
                
                <KickVisualizer strategy={strategy} />
                
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{strategy.description}</p>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[9px] px-1">
                      {strategy.fieldPosition.replace('_', ' ')}
                    </Badge>
                    {strategy.contestable && (
                      <Badge variant="secondary" className="text-[9px] px-1">
                        Contest
                      </Badge>
                    )}
                  </div>
                  <TerritorialBadge gain={strategy.territorialGain} />
                </div>
                
                <div className="mt-2 space-y-0.5">
                  {strategy.primaryUse.slice(0, 2).map((use, i) => (
                    <div key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className="text-primary">•</span> {use}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
