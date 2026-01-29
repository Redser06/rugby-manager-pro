import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayPhase } from '@/types/game';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhaseEditorProps {
  phases: PlayPhase[];
  currentPhase: number;
  onCurrentPhaseChange: (phase: number) => void;
  onPhasesChange: (phases: PlayPhase[]) => void;
}

const ATTACK_STYLES: { value: PlayPhase['attackStyle']; label: string; icon: string }[] = [
  { value: 'wide', label: 'Go Wide', icon: '↔️' },
  { value: 'narrow', label: 'Attack Narrow', icon: '⬇️' },
  { value: 'tip_on', label: 'Tip-on Pass', icon: '👆' },
  { value: 'wrap', label: 'Wrap Around', icon: '🔄' },
  { value: 'switch', label: 'Switch Play', icon: '↩️' },
  { value: 'crash_ball', label: 'Crash Ball', icon: '💥' },
];

export function PhaseEditor({ phases, currentPhase, onCurrentPhaseChange, onPhasesChange }: PhaseEditorProps) {
  const addPhase = () => {
    const newPhase: PlayPhase = {
      number: phases.length + 1,
      description: `Phase ${phases.length + 1}`,
      attackStyle: 'wide'
    };
    onPhasesChange([...phases, newPhase]);
    onCurrentPhaseChange(newPhase.number);
  };

  const removePhase = (phaseNumber: number) => {
    if (phases.length <= 1) return;
    const newPhases = phases
      .filter(p => p.number !== phaseNumber)
      .map((p, i) => ({ ...p, number: i + 1 }));
    onPhasesChange(newPhases);
    if (currentPhase > newPhases.length) {
      onCurrentPhaseChange(newPhases.length);
    }
  };

  const updatePhase = (phaseNumber: number, updates: Partial<PlayPhase>) => {
    onPhasesChange(phases.map(p => 
      p.number === phaseNumber ? { ...p, ...updates } : p
    ));
  };

  const currentPhaseData = phases.find(p => p.number === currentPhase);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Phases</CardTitle>
          <Button variant="outline" size="sm" onClick={addPhase} className="h-7 gap-1">
            <Plus className="h-3 w-3" />
            Add Phase
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Phase navigation */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPhase <= 1}
            onClick={() => onCurrentPhaseChange(currentPhase - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex gap-1">
            {phases.map(phase => (
              <Button
                key={phase.number}
                variant={phase.number === currentPhase ? 'default' : 'outline'}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => onCurrentPhaseChange(phase.number)}
              >
                {phase.number}
              </Button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPhase >= phases.length}
            onClick={() => onCurrentPhaseChange(currentPhase + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Current phase details */}
        {currentPhaseData && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Badge>Phase {currentPhase}</Badge>
              {phases.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-destructive hover:text-destructive"
                  onClick={() => removePhase(currentPhase)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <Input
              placeholder="Phase description..."
              value={currentPhaseData.description}
              onChange={(e) => updatePhase(currentPhase, { description: e.target.value })}
              className="text-sm"
            />
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Attack Style</p>
              <Select
                value={currentPhaseData.attackStyle}
                onValueChange={(value) => updatePhase(currentPhase, { attackStyle: value as PlayPhase['attackStyle'] })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTACK_STYLES.map(style => (
                    <SelectItem key={style.value} value={style.value}>
                      <span className="flex items-center gap-2">
                        <span>{style.icon}</span>
                        <span>{style.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
