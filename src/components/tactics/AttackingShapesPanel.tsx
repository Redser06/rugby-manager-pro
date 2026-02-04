import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ATTACKING_SHAPES, AttackingShape, ForwardPodConfig } from '@/types/tactics';
import { Users } from 'lucide-react';

interface AttackingShapesPanelProps {
  selectedShape: ForwardPodConfig;
  onChange: (shape: ForwardPodConfig) => void;
}

function ShapeVisualizer({ shape }: { shape: AttackingShape }) {
  // Calculate pod positions for visual representation
  const getPodPositions = () => {
    const pods = shape.pods;
    const total = pods.length;
    
    return pods.map((pod, idx) => {
      let x = 50;
      if (total === 3) {
        x = idx === 0 ? 20 : idx === 1 ? 50 : 80;
      } else if (total === 4) {
        x = [15, 38, 62, 85][idx];
      } else if (total === 2) {
        x = idx === 0 ? 35 : 65;
      }
      
      const y = pod.role === 'clear_out' || pod.position === 'ruck' ? 30 : 50;
      
      return { ...pod, x, y };
    });
  };

  const podPositions = getPodPositions();

  return (
    <div className="relative w-full h-32 bg-primary/5 rounded-lg border overflow-hidden">
      {/* Pitch markings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-px bg-border opacity-50" />
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-8 border border-border rounded-full opacity-30" />
      
      {/* Ruck position */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <div className="w-8 h-4 bg-muted-foreground/30 rounded-sm flex items-center justify-center text-[8px] text-muted-foreground">
          RUCK
        </div>
      </div>
      
      {/* Forward pods */}
      {podPositions.map((pod, idx) => (
        <div
          key={idx}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${pod.x}%`, top: `${pod.y}%` }}
        >
          <div className={`
            flex items-center justify-center gap-0.5 p-1.5 rounded-lg
            ${pod.role === 'carry' ? 'bg-primary/20 border-primary' : 
              pod.role === 'clear_out' ? 'bg-muted border-muted-foreground' :
              pod.role === 'decoy' ? 'bg-secondary/50 border-secondary' : 'bg-accent/50 border-accent'}
            border
          `}>
            {Array.from({ length: pod.playerCount }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  pod.role === 'carry' ? 'bg-primary' : 
                  pod.role === 'clear_out' ? 'bg-muted-foreground' :
                  'bg-secondary'
                }`}
              />
            ))}
          </div>
          <div className="text-[8px] text-center text-muted-foreground mt-0.5 capitalize">
            {pod.role.replace('_', ' ')}
          </div>
        </div>
      ))}
      
      {/* Backs indication */}
      <div className="absolute bottom-2 right-2 text-[9px] text-muted-foreground flex items-center gap-1">
        <span>Backs →</span>
        <div className="flex gap-0.5">
          {[9, 10, 12, 13, 11, 14, 15].map(n => (
            <div key={n} className="w-2 h-2 rounded-full bg-accent/50" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AttackingShapesPanel({ selectedShape, onChange }: AttackingShapesPanelProps) {
  const selected = ATTACKING_SHAPES.find(s => s.config === selectedShape);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Forward Attack Shape
        </CardTitle>
        <CardDescription>
          Configure how your forwards (1-8) are arranged in attack. Backs maintain their standard shape.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={selectedShape}
          onValueChange={(v) => onChange(v as ForwardPodConfig)}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {ATTACKING_SHAPES.map((shape) => (
            <div key={shape.id} className="relative">
              <RadioGroupItem
                value={shape.config}
                id={shape.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={shape.id}
                className="flex flex-col p-3 border rounded-lg cursor-pointer hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{shape.name}</span>
                  <Badge variant="outline" className="text-xs">{shape.config}</Badge>
                </div>
                <ShapeVisualizer shape={shape} />
              </Label>
            </div>
          ))}
        </RadioGroup>

        {selected && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <p className="text-sm">{selected.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-primary mb-1">Strengths</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {selected.strengths.map((s, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="text-green-500">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-destructive mb-1">Weaknesses</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {selected.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="text-red-500">✗</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
