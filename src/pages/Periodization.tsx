import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useGame } from '@/contexts/GameContext';
import { 
  MACRO_PHASES, 
  MacroPhase, 
  MacroCycle, 
  WeeklyPlan,
  TRAINING_SESSION_TYPES,
  TrainingSessionType
} from '@/types/training';
import { PRESET_SC_PROGRAMS, PRESET_TRAINING_SESSIONS } from '@/data/trainingData';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Settings,
  Layers,
  Target,
  Zap,
  Clock
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Sample macro cycles
const SAMPLE_MACRO_CYCLES: MacroCycle[] = [
  {
    id: 'mc1',
    name: 'Pre-Season 2024',
    phase: 'pre_season_foundation',
    startWeek: 1,
    endWeek: 4,
    scProgram: PRESET_SC_PROGRAMS[0],
    weeklyPlans: [],
    goals: ['Build aerobic base', 'Establish strength foundation', 'Address injury areas']
  },
  {
    id: 'mc2',
    name: 'Pre-Season Build',
    phase: 'pre_season_build',
    startWeek: 5,
    endWeek: 7,
    scProgram: PRESET_SC_PROGRAMS[2],
    weeklyPlans: [],
    goals: ['Increase power output', 'Sport-specific conditioning', 'Tactical integration']
  },
  {
    id: 'mc3',
    name: 'Pre-Season Peak',
    phase: 'pre_season_peak',
    startWeek: 8,
    endWeek: 9,
    scProgram: PRESET_SC_PROGRAMS[0],
    weeklyPlans: [],
    goals: ['Match simulation', 'Peak fitness', 'Final selection trials']
  },
  {
    id: 'mc4',
    name: 'Early Season',
    phase: 'early_season',
    startWeek: 10,
    endWeek: 17,
    scProgram: PRESET_SC_PROGRAMS[1],
    weeklyPlans: [],
    goals: ['Maintain fitness', 'Recovery management', 'Address emerging issues']
  },
];

export default function Periodization() {
  const { getMyTeam, gameState } = useGame();
  const team = getMyTeam();
  const [macroCycles, setMacroCycles] = useState<MacroCycle[]>(SAMPLE_MACRO_CYCLES);
  const [selectedCycle, setSelectedCycle] = useState<MacroCycle | null>(SAMPLE_MACRO_CYCLES[0]);
  const [currentViewWeek, setCurrentViewWeek] = useState(gameState.currentWeek);
  const [showAddCycleDialog, setShowAddCycleDialog] = useState(false);

  if (!team) return null;

  const totalSeasonWeeks = 41; // Typical rugby season

  const getPhaseColor = (phase: MacroPhase): string => {
    const colors: Record<MacroPhase, string> = {
      pre_season_foundation: 'bg-blue-500/70',
      pre_season_build: 'bg-blue-600/70',
      pre_season_peak: 'bg-blue-700/70',
      early_season: 'bg-green-500/70',
      mid_season: 'bg-green-600/70',
      late_season: 'bg-amber-500/70',
      playoffs: 'bg-red-500/70',
      off_season: 'bg-slate-400/70',
    };
    return colors[phase];
  };

  // Generate weekly view data
  const weeksToShow = 12;
  const startWeek = Math.max(1, currentViewWeek - 2);
  const weekRange = Array.from({ length: weeksToShow }, (_, i) => startWeek + i).filter(w => w <= totalSeasonWeeks);

  const getCycleForWeek = (week: number): MacroCycle | undefined => {
    return macroCycles.find(c => week >= c.startWeek && week <= c.endWeek);
  };

  // Sample weekly plan data
  const getWeeklySessionCount = (week: number): number => {
    const cycle = getCycleForWeek(week);
    if (!cycle) return 0;
    // Simulate session counts based on phase intensity
    const baseCount = MACRO_PHASES[cycle.phase].intensity / 15;
    return Math.round(baseCount + (Math.random() * 2 - 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Season Periodization</h1>
          <p className="text-muted-foreground">Plan macro cycles and weekly training alignment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddCycleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Macro Cycle
          </Button>
        </div>
      </div>

      {/* Current Week Indicator */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Week</p>
                <p className="text-2xl font-bold">Week {gameState.currentWeek}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {getCycleForWeek(gameState.currentWeek) && (
                <Badge variant="default" className="text-sm py-1 px-3">
                  {MACRO_PHASES[getCycleForWeek(gameState.currentWeek)!.phase].name}
                </Badge>
              )}
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Season Progress</p>
                <Progress value={(gameState.currentWeek / totalSeasonWeeks) * 100} className="w-32 mt-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Season Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Season Overview</CardTitle>
            <div className="flex gap-2">
              {Object.entries(MACRO_PHASES).slice(0, 6).map(([key, phase]) => (
                <div key={key} className="flex items-center gap-1 text-xs">
                  <div className={`w-3 h-3 rounded ${getPhaseColor(key as MacroPhase)}`} />
                  <span className="text-muted-foreground">{phase.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline bar */}
            <div className="flex h-12 rounded-lg overflow-hidden border">
              {macroCycles.map(cycle => {
                const width = ((cycle.endWeek - cycle.startWeek + 1) / totalSeasonWeeks) * 100;
                const left = ((cycle.startWeek - 1) / totalSeasonWeeks) * 100;
                return (
                  <div
                    key={cycle.id}
                    className={`absolute h-full ${getPhaseColor(cycle.phase)} cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center`}
                    style={{ width: `${width}%`, left: `${left}%` }}
                    onClick={() => setSelectedCycle(cycle)}
                  >
                    <span className="text-xs font-medium text-white truncate px-2">
                      {cycle.name}
                    </span>
                  </div>
                );
              })}
              {/* Current week marker */}
              <div
                className="absolute h-full w-0.5 bg-foreground z-10"
                style={{ left: `${((gameState.currentWeek - 0.5) / totalSeasonWeeks) * 100}%` }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-1 rounded">
                  {gameState.currentWeek}
                </div>
              </div>
            </div>
            {/* Week markers */}
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Week 1</span>
              <span>Week {Math.round(totalSeasonWeeks / 4)}</span>
              <span>Week {Math.round(totalSeasonWeeks / 2)}</span>
              <span>Week {Math.round(totalSeasonWeeks * 3 / 4)}</span>
              <span>Week {totalSeasonWeeks}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Macro Cycle Details */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Macro Cycles</CardTitle>
              <CardDescription>Click to view details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 p-2">
                  {macroCycles.map(cycle => (
                    <div
                      key={cycle.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedCycle?.id === cycle.id ? 'bg-primary/10 border border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedCycle(cycle)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{cycle.name}</span>
                        <Badge variant="outline" className="text-xs">
                          W{cycle.startWeek}-{cycle.endWeek}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPhaseColor(cycle.phase)}`} />
                        <span className="text-xs text-muted-foreground">
                          {MACRO_PHASES[cycle.phase].name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cycle.endWeek - cycle.startWeek + 1} weeks • {MACRO_PHASES[cycle.phase].intensity}% intensity
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Selected Cycle Details */}
        <div className="col-span-8">
          {selectedCycle ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedCycle.name}</CardTitle>
                    <CardDescription>
                      Week {selectedCycle.startWeek} to Week {selectedCycle.endWeek} • {selectedCycle.endWeek - selectedCycle.startWeek + 1} weeks
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Cycle
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Phase Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Phase</span>
                    </div>
                    <p className="font-medium">{MACRO_PHASES[selectedCycle.phase].name}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Target Intensity</span>
                    </div>
                    <p className="font-medium">{MACRO_PHASES[selectedCycle.phase].intensity}%</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">S&C Program</span>
                    </div>
                    <p className="font-medium">{selectedCycle.scProgram.name}</p>
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <h4 className="font-medium mb-2">Phase Goals</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedCycle.goals.map((goal, i) => (
                      <Badge key={i} variant="secondary">{goal}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Weekly Breakdown */}
                <div>
                  <h4 className="font-medium mb-3">Weekly Breakdown</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from(
                      { length: selectedCycle.endWeek - selectedCycle.startWeek + 1 },
                      (_, i) => selectedCycle.startWeek + i
                    ).map(week => {
                      const isCurrentWeek = week === gameState.currentWeek;
                      const isPast = week < gameState.currentWeek;
                      return (
                        <div
                          key={week}
                          className={`p-3 rounded-lg border transition-colors ${
                            isCurrentWeek ? 'bg-primary/10 border-primary' :
                            isPast ? 'bg-muted/30 opacity-60' : 'bg-card hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Week {week}</span>
                            {isCurrentWeek && <Badge variant="default" className="text-xs">Current</Badge>}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{getWeeklySessionCount(week)} sessions</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a macro cycle to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Weekly Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Weekly Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentViewWeek(Math.max(1, currentViewWeek - 4))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Weeks {startWeek} - {startWeek + weeksToShow - 1}
              </span>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentViewWeek(Math.min(totalSeasonWeeks - weeksToShow + 1, currentViewWeek + 4))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-2">
            {weekRange.map(week => {
              const cycle = getCycleForWeek(week);
              const isCurrentWeek = week === gameState.currentWeek;
              return (
                <div
                  key={week}
                  className={`p-2 rounded-lg text-center transition-colors ${
                    isCurrentWeek ? 'ring-2 ring-primary bg-primary/10' :
                    cycle ? 'bg-muted/50' : 'bg-muted/20'
                  }`}
                >
                  <p className="text-xs font-medium">W{week}</p>
                  {cycle && (
                    <div className={`w-full h-1 rounded mt-1 ${getPhaseColor(cycle.phase)}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Macro Cycle Dialog */}
      <Dialog open={showAddCycleDialog} onOpenChange={setShowAddCycleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Macro Cycle</DialogTitle>
            <DialogDescription>Create a new training phase for your season</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cycle Name</Label>
              <Input placeholder="e.g., Mid-Season Recovery" />
            </div>
            <div className="space-y-2">
              <Label>Phase Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MACRO_PHASES).map(([key, phase]) => (
                    <SelectItem key={key} value={key}>{phase.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Week</Label>
                <Input type="number" placeholder="1" min={1} max={totalSeasonWeeks} />
              </div>
              <div className="space-y-2">
                <Label>End Week</Label>
                <Input type="number" placeholder="4" min={1} max={totalSeasonWeeks} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>S&C Program</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_SC_PROGRAMS.map(program => (
                    <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Goals (comma separated)</Label>
              <Textarea placeholder="Build strength, Improve conditioning, Address weaknesses" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddCycleDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowAddCycleDialog(false)}>Create Cycle</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
