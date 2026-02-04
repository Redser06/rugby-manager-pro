import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { TeamTactics } from '@/types/game';
import { ForwardPodConfig, DefensiveBackThreeShape, ExtendedTactics, AttackPattern } from '@/types/tactics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
  title, 
  description, 
  icon: Icon,
  options, 
  value, 
  onChange 
}: { 
  title: string;
  description: string;
  icon: React.ElementType;
  options: TacticOption<T>[];
  value: TeamTactics[T];
  onChange: (value: TeamTactics[T]) => void;
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
              <RadioGroupItem
                value={option.value}
                id={`${title}-${option.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`${title}-${option.value}`}
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

// Default extended tactics
const DEFAULT_EXTENDED_TACTICS: ExtendedTactics = {
  attackingShape: '2-4-2',
  selectedBacksMoves: ['move_crash', 'move_miss_13'],
  primaryKickingStrategies: ['kick_box', 'kick_territorial'],
  defensiveShape: 'umbrella',
  attackPatterns: []
};

export default function Tactics() {
  const { getMyTeam, updateTactics } = useGame();
  const team = getMyTeam();
  
  // Extended tactics state (would be persisted in a real implementation)
  const [extendedTactics, setExtendedTactics] = useState<ExtendedTactics>(DEFAULT_EXTENDED_TACTICS);

  if (!team) return null;

  const handleTacticChange = <T extends keyof TeamTactics>(key: T, value: TeamTactics[T]) => {
    updateTactics({
      ...team.tactics,
      [key]: value
    });
    toast.success('Tactics updated', {
      description: `${key.replace(/([A-Z])/g, ' $1').trim()} set to ${value}`
    });
  };

  const handleExtendedTacticsChange = <T extends keyof ExtendedTactics>(key: T, value: ExtendedTactics[T]) => {
    setExtendedTactics(prev => ({ ...prev, [key]: value }));
    toast.success('Tactical shape updated', {
      description: `${key.replace(/([A-Z])/g, ' $1').trim()} configured`
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tactics</h1>
          <p className="text-muted-foreground">Configure your team's game plan and tactical shapes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{team.tactics.attackStyle}</Badge>
          <Badge variant="outline">{team.tactics.defenseStyle}</Badge>
          <Badge variant="outline">{team.tactics.tempo}</Badge>
          <Badge variant="secondary">{extendedTactics.attackingShape}</Badge>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="attack" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Attack Shapes</span>
          </TabsTrigger>
          <TabsTrigger value="backs" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Backs Moves</span>
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
            <TacticSelector
              title="Attack Style"
              description="How your team attacks when in possession"
              icon={Swords}
              options={ATTACK_STYLES}
              value={team.tactics.attackStyle}
              onChange={(v) => handleTacticChange('attackStyle', v)}
            />

            <TacticSelector
              title="Defense Style"
              description="Your defensive system and line speed"
              icon={Shield}
              options={DEFENSE_STYLES}
              value={team.tactics.defenseStyle}
              onChange={(v) => handleTacticChange('defenseStyle', v)}
            />

            <TacticSelector
              title="Scrum Focus"
              description="Your priority at the set piece scrum"
              icon={Target}
              options={SCRUM_FOCUS}
              value={team.tactics.scrumFocus}
              onChange={(v) => handleTacticChange('scrumFocus', v)}
            />

            <TacticSelector
              title="Lineout Primary"
              description="Where to target your lineout throws"
              icon={Zap}
              options={LINEOUT_PRIMARY}
              value={team.tactics.lineoutPrimary}
              onChange={(v) => handleTacticChange('lineoutPrimary', v)}
            />

            <TacticSelector
              title="Game Tempo"
              description="The pace at which you want to play"
              icon={Timer}
              options={TEMPO}
              value={team.tactics.tempo}
              onChange={(v) => handleTacticChange('tempo', v)}
            />

            <TacticSelector
              title="Risk Level"
              description="How much risk to take in your play"
              icon={AlertTriangle}
              options={RISK_LEVEL}
              value={team.tactics.riskLevel}
              onChange={(v) => handleTacticChange('riskLevel', v)}
            />
          </div>
        </TabsContent>

        <TabsContent value="attack">
          <AttackingShapesPanel
            selectedShape={extendedTactics.attackingShape}
            onChange={(shape) => handleExtendedTacticsChange('attackingShape', shape)}
          />
        </TabsContent>

        <TabsContent value="backs">
          <BacksPatternsPanel
            selectedMoves={extendedTactics.selectedBacksMoves}
            onChange={(moves) => handleExtendedTacticsChange('selectedBacksMoves', moves)}
            maxMoves={4}
          />
        </TabsContent>

        <TabsContent value="kicking">
          <KickingStrategiesPanel
            selectedStrategies={extendedTactics.primaryKickingStrategies}
            onChange={(strategies) => handleExtendedTacticsChange('primaryKickingStrategies', strategies)}
            maxStrategies={3}
          />
        </TabsContent>

        <TabsContent value="patterns">
          <AttackPatternBuilder
            patterns={extendedTactics.attackPatterns}
            onChange={(patterns) => handleExtendedTacticsChange('attackPatterns', patterns)}
          />
        </TabsContent>

        <TabsContent value="defense">
          <DefensiveShapesPanel
            selectedShape={extendedTactics.defensiveShape}
            onChange={(shape) => handleExtendedTacticsChange('defensiveShape', shape)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
