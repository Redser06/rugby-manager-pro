import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DEFENSIVE_SHAPES, DefensiveShape, DefensiveBackThreeShape } from '@/types/tactics';
import { Shield } from 'lucide-react';

interface DefensiveShapesPanelProps {
  selectedShape: DefensiveBackThreeShape;
  onChange: (shape: DefensiveBackThreeShape) => void;
}

function DefenseVisualizer({ shape }: { shape: DefensiveShape }) {
  // Calculate player positions based on shape
  const getPlayerPositions = () => {
    const baseY = 30; // Base defensive line
    
    // Forward line (1-8)
    const forwards = Array.from({ length: 8 }, (_, i) => ({
      x: 20 + i * 8,
      y: baseY,
      label: ''
    }));
    
    // Inside backs (9, 10, 12, 13) - always in line
    const insideBacks = [
      { x: 35, y: baseY + 5, label: '9' },
      { x: 45, y: baseY, label: '10' },
      { x: 55, y: baseY, label: '12' },
      { x: 65, y: baseY, label: '13' }
    ];
    
    // Back three based on defensive shape
    let backThree: { x: number; y: number; label: string }[] = [];
    
    switch (shape.shape) {
      case 'umbrella':
        backThree = [
          { x: 15, y: baseY + 35, label: '11' }, // Winger deep
          { x: 50, y: baseY + 40, label: '15' }, // Fullback deep
          { x: 85, y: baseY + 35, label: '14' }  // Winger deep
        ];
        break;
      case 'flat_line':
        backThree = [
          { x: 10, y: baseY, label: '11' },     // Winger in line
          { x: 50, y: baseY + 25, label: '15' }, // Fullback sweeper
          { x: 90, y: baseY, label: '14' }       // Winger in line
        ];
        break;
      case 'sweeper':
        backThree = [
          { x: 10, y: baseY, label: '11' },      // One winger in line
          { x: 50, y: baseY + 35, label: '15' }, // Fullback deep
          { x: 85, y: baseY + 20, label: '14' }  // One winger dropped
        ];
        break;
      case 'aggressive':
        backThree = [
          { x: 10, y: baseY - 5, label: '11' },  // Winger up
          { x: 50, y: baseY + 5, label: '15' },  // Fullback flat
          { x: 90, y: baseY - 5, label: '14' }   // Winger up
        ];
        break;
    }
    
    return { forwards, insideBacks, backThree };
  };

  const positions = getPlayerPositions();

  return (
    <div className="relative w-full h-28 bg-primary/5 rounded-lg border overflow-hidden">
      {/* Pitch markings */}
      <div className="absolute top-6 left-0 right-0 h-px border-t border-dashed border-muted-foreground/30" />
      
      {/* Attack direction indicator */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground flex items-center gap-1">
        ⬇️ Attack direction
      </div>
      
      {/* Forward line (simplified) */}
      <div className="absolute" style={{ left: '25%', top: '25%' }}>
        <div className="flex gap-0.5">
          {positions.forwards.slice(0, 4).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          ))}
        </div>
      </div>
      <div className="absolute" style={{ left: '55%', top: '25%' }}>
        <div className="flex gap-0.5">
          {positions.forwards.slice(4).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          ))}
        </div>
      </div>
      
      {/* Inside backs */}
      {positions.insideBacks.map((player, idx) => (
        <div
          key={`ib-${idx}`}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${player.x}%`, top: `${player.y + 10}%` }}
        >
          <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold text-secondary-foreground">
            {player.label}
          </div>
        </div>
      ))}
      
      {/* Back three - highlighted */}
      {positions.backThree.map((player, idx) => (
        <div
          key={`b3-${idx}`}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${player.x}%`, top: `${player.y + 10}%` }}
        >
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground shadow-md">
            {player.label}
          </div>
        </div>
      ))}
      
      {/* Coverage area for umbrella */}
      {shape.shape === 'umbrella' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <ellipse
            cx="50%"
            cy="75%"
            rx="35%"
            ry="20%"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
            className="text-primary/30"
          />
        </svg>
      )}
    </div>
  );
}

export function DefensiveShapesPanel({ selectedShape, onChange }: DefensiveShapesPanelProps) {
  const selected = DEFENSIVE_SHAPES.find(s => s.shape === selectedShape);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Defensive Shape
        </CardTitle>
        <CardDescription>
          Configure your back three positioning. This dictates how wingers and fullback defend against kicks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={selectedShape}
          onValueChange={(v) => onChange(v as DefensiveBackThreeShape)}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {DEFENSIVE_SHAPES.map((shape) => (
            <div key={shape.id} className="relative">
              <RadioGroupItem
                value={shape.shape}
                id={shape.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={shape.id}
                className="flex flex-col p-3 border rounded-lg cursor-pointer hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{shape.name}</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      W: {shape.wingerDepth.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      FB: {shape.fullbackDepth}
                    </Badge>
                  </div>
                </div>
                <DefenseVisualizer shape={shape} />
              </Label>
            </div>
          ))}
        </RadioGroup>

        {selected && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <p className="text-sm">{selected.description}</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-primary mb-1">Strengths</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {selected.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">✓</span> 
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-destructive mb-1">Weaknesses</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {selected.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-red-500 mt-0.5">✗</span> 
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Best Against</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {selected.bestAgainst.map((b, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-blue-500 mt-0.5">→</span> 
                      <span>{b}</span>
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
