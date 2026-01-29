import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AttackPattern, KickingOption } from '@/types/game';
import { Plus, X } from 'lucide-react';

interface AttackPatternPanelProps {
  pattern: AttackPattern;
  onChange: (pattern: AttackPattern) => void;
}

const KICKING_OPTIONS: { type: KickingOption['type']; label: string; icon: string }[] = [
  { type: 'crossfield', label: 'Cross-field', icon: '↗️' },
  { type: 'grubber', label: 'Grubber', icon: '⚽' },
  { type: 'box_kick', label: 'Box Kick', icon: '📦' },
  { type: 'chip', label: 'Chip & Chase', icon: '🎾' },
  { type: 'up_and_under', label: 'Up & Under', icon: '⬆️' },
];

const TARGET_ZONES: KickingOption['targetZone'][] = ['left_corner', 'right_corner', 'behind_defence', 'contestable'];

export function AttackPatternPanel({ pattern, onChange }: AttackPatternPanelProps) {
  const toggleOption = (key: keyof Pick<AttackPattern, 'wideChannels' | 'narrowPods' | 'tipOnPasses' | 'crashBalls'>) => {
    onChange({ ...pattern, [key]: !pattern[key] });
  };

  const addKickingOption = (type: KickingOption['type']) => {
    if (pattern.kickingOptions.some(k => k.type === type)) return;
    onChange({
      ...pattern,
      kickingOptions: [...pattern.kickingOptions, { type, targetZone: 'contestable' }]
    });
  };

  const removeKickingOption = (type: KickingOption['type']) => {
    onChange({
      ...pattern,
      kickingOptions: pattern.kickingOptions.filter(k => k.type !== type)
    });
  };

  const updateKickingTarget = (type: KickingOption['type'], targetZone: KickingOption['targetZone']) => {
    onChange({
      ...pattern,
      kickingOptions: pattern.kickingOptions.map(k => 
        k.type === type ? { ...k, targetZone } : k
      )
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Attack Patterns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Running options */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Ball Movement</p>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="wide" className="text-sm flex items-center gap-2">
              <span>🌊</span> Wide Channels
            </Label>
            <Switch 
              id="wide" 
              checked={pattern.wideChannels}
              onCheckedChange={() => toggleOption('wideChannels')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="narrow" className="text-sm flex items-center gap-2">
              <span>🎯</span> Narrow Pods
            </Label>
            <Switch 
              id="narrow" 
              checked={pattern.narrowPods}
              onCheckedChange={() => toggleOption('narrowPods')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="tipon" className="text-sm flex items-center gap-2">
              <span>👆</span> Tip-on Passes
            </Label>
            <Switch 
              id="tipon" 
              checked={pattern.tipOnPasses}
              onCheckedChange={() => toggleOption('tipOnPasses')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="crash" className="text-sm flex items-center gap-2">
              <span>💥</span> Crash Balls
            </Label>
            <Switch 
              id="crash" 
              checked={pattern.crashBalls}
              onCheckedChange={() => toggleOption('crashBalls')}
            />
          </div>
        </div>

        {/* Kicking options */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Kicking Options</p>
          
          <div className="flex flex-wrap gap-1">
            {KICKING_OPTIONS.map(opt => {
              const isActive = pattern.kickingOptions.some(k => k.type === opt.type);
              return (
                <Button
                  key={opt.type}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => isActive ? removeKickingOption(opt.type) : addKickingOption(opt.type)}
                >
                  {opt.icon} {opt.label}
                </Button>
              );
            })}
          </div>

          {pattern.kickingOptions.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">Target Zones</p>
              {pattern.kickingOptions.map(kick => (
                <div key={kick.type} className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {KICKING_OPTIONS.find(o => o.type === kick.type)?.label}
                  </Badge>
                  <select
                    className="flex-1 text-xs p-1 rounded border bg-background"
                    value={kick.targetZone}
                    onChange={(e) => updateKickingTarget(kick.type, e.target.value as KickingOption['targetZone'])}
                  >
                    {TARGET_ZONES.map(zone => (
                      <option key={zone} value={zone}>
                        {zone.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
