import { useState } from 'react';
import { useSixNations } from '@/contexts/SixNationsContext';
import { SixNationsNation } from '@/types/sixNations';
import { TeamTactics } from '@/types/game';
import { ExtendedTactics } from '@/types/tactics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Swords, Shield, Timer, Target, AlertTriangle, Zap, Users, Sparkles, Goal, Layers } from 'lucide-react';
import { AttackingShapesPanel } from '@/components/tactics/AttackingShapesPanel';
import { BacksPatternsPanel } from '@/components/tactics/BacksPatternsPanel';
import { KickingStrategiesPanel } from '@/components/tactics/KickingStrategiesPanel';
import { DefensiveShapesPanel } from '@/components/tactics/DefensiveShapesPanel';
import { AttackPatternBuilder } from '@/components/tactics/AttackPatternBuilder';

type TacticOption<T extends keyof TeamTactics> = {
  value: TeamTactics[T];
  label: string;
  description: string;
};

const ATTACK_STYLES: TacticOption<'attackStyle'>[] = [
  { value: 'expansive', label: 'Expansive', description: 'Wide attacking play, using the full width of the pitch' },
  { value: 'structured', label: 'Structured', description: 'Methodical phase play with set patterns' },
  { value: 'direct', label: 'Direct', description: 'Powerful, straight running through the middle' },
  { value: 'kicking', label: 'Kicking', description: 'Tactical kicking to gain territory and apply pressure' }
];

const DEFENSE_STYLES: TacticOption<'defenseStyle'>[] = [
  { value: 'rush', label: 'Rush', description: 'Aggressive line speed to pressure the opposition' },
  { value: 'drift', label: 'Drift', description: 'Sliding defense pushing attackers wide' },
  { value: 'blitz', label: 'Blitz', description: 'Target the first receiver with intense pressure' },
  { value: 'umbrella', label: 'Umbrella', description: 'Deep defensive shape to cover kicks' }
];

const SCRUM_FOCUS: TacticOption<'scrumFocus'>[] = [
  { value: 'power', label: 'Power', description: 'Maximum force to dominate and win penalties' },
  { value: 'speed', label: 'Speed', description: 'Quick ball to launch attacks immediately' },
  { value: 'balanced', label: 'Balanced', description: 'Solid platform without overcommitting' }
];

const LINEOUT_PRIMARY: TacticOption<'lineoutPrimary'>[] = [
  { value: 'front', label: 'Front', description: 'Quick throws to the front for driving mauls' },
  { value: 'middle', label: 'Middle', description: 'Reliable throws to your main jumper' },
  { value: 'back', label: 'Back', description: 'Long throws to create space for backs' }
];

const TEMPO: TacticOption<'tempo'>[] = [
  { value: 'fast', label: 'Fast', description: 'High tempo, quick ball, tire the opposition' },
  { value: 'controlled', label: 'Controlled', description: 'Measured approach, pick your moments' },
  { value: 'slow', label: 'Slow', description: 'Slow the game down, conserve energy' }
];

const RISK_LEVEL: TacticOption<'riskLevel'>[] = [
  { value: 'high', label: 'High Risk', description: 'Offloads, ambitious plays, go for tries' },
  { value: 'medium', label: 'Medium Risk', description: 'Balanced approach, sensible decisions' },
  { value: 'low', label: 'Low Risk', description: 'Conservative, keep possession, avoid errors' }
];

function TacticSelector<T extends keyof TeamTactics>({ 
  title, description, icon: Icon, options, value, onChange 
}: { 
  title: string; description: string; icon: React.ElementType;
  options: TacticOption<T>[]; value: TeamTactics[T]; onChange: (value: TeamTactics[T]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={value} 
          onValueChange={(v) => onChange(v as TeamTactics[T])}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {options.map((option) => (
            <div key={option.value} className="relative">
              <RadioGroupItem value={option.value} id={`nat-${title}-${option.value}`} className="peer sr-only" />
              <Label
                htmlFor={`nat-${title}-${option.value}`}
                className="flex flex-col p-4 border rounded-lg cursor-pointer hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground mt-1">{option.description}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

const DEFAULT_EXTENDED: ExtendedTactics = {
  attackingShape: '2-4-2',
  selectedBacksMoves: ['move_crash', 'move_miss_13'],
  primaryKickingStrategies: ['kick_box', 'kick_territorial'],
  defensiveShape: 'umbrella',
  attackPatterns: []
};

interface NationalTacticsPanelProps {
  nation: SixNationsNation;
}

export function NationalTacticsPanel({ nation }: NationalTacticsPanelProps) {
  const { sixNationsState, updateNationalTactics } = useSixNations();
  const [extendedTactics, setExtendedTactics] = useState<ExtendedTactics>(DEFAULT_EXTENDED);

  if (!sixNationsState) return null;

  const nationalTeam = sixNationsState.nationalTeams.find(nt => nt.nation === nation);
  if (!nationalTeam) return null;

  const tactics = nationalTeam.tactics;

  const handleTacticChange = <T extends keyof TeamTactics>(key: T, value: TeamTactics[T]) => {
    updateNationalTactics(nation, { ...tactics, [key]: value });
    toast.success('National tactics updated', {
      description: `${key.replace(/([A-Z])/g, ' $1').trim()} set to ${value}`
    });
  };

  const handleExtendedChange = <T extends keyof ExtendedTactics>(key: T, value: ExtendedTactics[T]) => {
    setExtendedTactics(prev => ({ ...prev, [key]: value }));
    toast.success('Tactical shape updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">National Team Tactics</h2>
          <p className="text-sm text-muted-foreground">Configure {nation}'s game plan for the Six Nations</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{tactics.attackStyle}</Badge>
          <Badge variant="outline">{tactics.defenseStyle}</Badge>
          <Badge variant="outline">{tactics.tempo}</Badge>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="attack" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Attack</span>
          </TabsTrigger>
          <TabsTrigger value="backs" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Backs</span>
          </TabsTrigger>
          <TabsTrigger value="kicking" className="gap-2">
            <Goal className="h-4 w-4" />
            <span className="hidden sm:inline">Kicking</span>
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Patterns</span>
          </TabsTrigger>
          <TabsTrigger value="defense" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Defence</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TacticSelector title="Attack Style" description="How your team attacks" icon={Swords}
              options={ATTACK_STYLES} value={tactics.attackStyle} onChange={(v) => handleTacticChange('attackStyle', v)} />
            <TacticSelector title="Defense Style" description="Your defensive system" icon={Shield}
              options={DEFENSE_STYLES} value={tactics.defenseStyle} onChange={(v) => handleTacticChange('defenseStyle', v)} />
            <TacticSelector title="Scrum Focus" description="Your set piece priority" icon={Target}
              options={SCRUM_FOCUS} value={tactics.scrumFocus} onChange={(v) => handleTacticChange('scrumFocus', v)} />
            <TacticSelector title="Lineout Primary" description="Lineout throw targets" icon={Zap}
              options={LINEOUT_PRIMARY} value={tactics.lineoutPrimary} onChange={(v) => handleTacticChange('lineoutPrimary', v)} />
            <TacticSelector title="Game Tempo" description="The pace of play" icon={Timer}
              options={TEMPO} value={tactics.tempo} onChange={(v) => handleTacticChange('tempo', v)} />
            <TacticSelector title="Risk Level" description="How much risk to take" icon={AlertTriangle}
              options={RISK_LEVEL} value={tactics.riskLevel} onChange={(v) => handleTacticChange('riskLevel', v)} />
          </div>
        </TabsContent>

        <TabsContent value="attack">
          <AttackingShapesPanel selectedShape={extendedTactics.attackingShape}
            onChange={(shape) => handleExtendedChange('attackingShape', shape)} />
        </TabsContent>

        <TabsContent value="backs">
          <BacksPatternsPanel selectedMoves={extendedTactics.selectedBacksMoves}
            onChange={(moves) => handleExtendedChange('selectedBacksMoves', moves)} maxMoves={4} />
        </TabsContent>

        <TabsContent value="kicking">
          <KickingStrategiesPanel selectedStrategies={extendedTactics.primaryKickingStrategies}
            onChange={(strategies) => handleExtendedChange('primaryKickingStrategies', strategies)} maxStrategies={3} />
        </TabsContent>

        <TabsContent value="patterns">
          <AttackPatternBuilder patterns={extendedTactics.attackPatterns}
            onChange={(patterns) => handleExtendedChange('attackPatterns', patterns)} />
        </TabsContent>

        <TabsContent value="defense">
          <DefensiveShapesPanel selectedShape={extendedTactics.defensiveShape}
            onChange={(shape) => handleExtendedChange('defensiveShape', shape)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
