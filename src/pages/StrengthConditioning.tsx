import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useGame } from '@/contexts/GameContext';
import { 
  SCFocusArea, 
  SC_FOCUS_AREAS, 
  UNIT_GROUPS, 
  UnitGroup, 
  MACRO_PHASES,
  MacroPhase,
  SCProgram,
  Exercise,
  SCSession 
} from '@/types/training';
import { 
  PRESET_EXERCISES, 
  PRESET_SC_PROGRAMS, 
  PRESET_SC_SESSIONS,
  getExercisesByFocus,
  createCustomSCSession 
} from '@/data/trainingData';
import { 
  Dumbbell, 
  Zap, 
  Heart, 
  Activity, 
  Target, 
  Plus, 
  Check, 
  ChevronRight,
  Calendar,
  Layers,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function StrengthConditioning() {
  const { getMyTeam } = useGame();
  const team = getMyTeam();
  const [activeTab, setActiveTab] = useState('programs');
  const [selectedProgram, setSelectedProgram] = useState<SCProgram | null>(PRESET_SC_PROGRAMS[0]);
  const [showSessionBuilder, setShowSessionBuilder] = useState(false);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<SCFocusArea[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [customPrograms, setCustomPrograms] = useState<SCProgram[]>([]);

  if (!team) return null;

  const allPrograms = [...PRESET_SC_PROGRAMS, ...customPrograms];

  const toggleFocusArea = (area: SCFocusArea) => {
    setSelectedFocusAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises(prev =>
      prev.includes(exerciseId) ? prev.filter(id => id !== exerciseId) : [...prev, exerciseId]
    );
  };

  const filteredExercises = selectedFocusAreas.length > 0
    ? PRESET_EXERCISES.filter(ex => selectedFocusAreas.includes(ex.category))
    : PRESET_EXERCISES;

  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Strength & Conditioning</h1>
          <p className="text-muted-foreground">Industry-leading S&C programs tailored for rugby</p>
        </div>
        <Button onClick={() => setShowSessionBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Session
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
        </TabsList>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Program List */}
            <div className="col-span-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preset Programs</CardTitle>
                  <CardDescription>Research-backed S&C programs</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-1 p-2">
                      {allPrograms.map(program => (
                        <Button
                          key={program.id}
                          variant={selectedProgram?.id === program.id ? 'secondary' : 'ghost'}
                          className="w-full justify-start h-auto py-3"
                          onClick={() => setSelectedProgram(program)}
                        >
                          <div className="text-left w-full">
                            <div className="flex items-center gap-2">
                              <Dumbbell className="h-4 w-4" />
                              <span className="font-medium">{program.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {program.description}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{program.duration} weeks</Badge>
                              <Badge variant="outline" className="text-xs">{MACRO_PHASES[program.phase].name}</Badge>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Program Details */}
            <div className="col-span-8 space-y-4">
              {selectedProgram ? (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedProgram.name}</CardTitle>
                          <CardDescription>{selectedProgram.description}</CardDescription>
                        </div>
                        <Button>
                          <Play className="h-4 w-4 mr-2" />
                          Activate Program
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold">{selectedProgram.duration}</p>
                          <p className="text-sm text-muted-foreground">Weeks</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold">{MACRO_PHASES[selectedProgram.phase].intensity}%</p>
                          <p className="text-sm text-muted-foreground">Intensity</p>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold">{selectedProgram.targetGroups.length}</p>
                          <p className="text-sm text-muted-foreground">Target Groups</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Weekly Schedule */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Weekly Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-7 gap-2">
                        {dayNames.map(day => {
                          const session = selectedProgram.weeklySchedule[day];
                          return (
                            <div key={day} className="text-center">
                              <p className="text-xs font-medium uppercase text-muted-foreground mb-2">
                                {day.slice(0, 3)}
                              </p>
                              {session ? (
                                <div className="p-2 bg-primary/10 rounded-lg min-h-[100px]">
                                  <p className="text-xs font-medium">{session.name}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{session.totalDuration}min</p>
                                  <div className="flex flex-wrap gap-1 justify-center mt-2">
                                    {session.focusAreas.slice(0, 2).map(area => (
                                      <span key={area} className="text-sm">{SC_FOCUS_AREAS[area].icon}</span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="p-2 bg-muted/30 rounded-lg min-h-[100px] flex items-center justify-center">
                                  <p className="text-xs text-muted-foreground">Rest</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a program to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PRESET_SC_SESSIONS.map(session => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{session.name}</CardTitle>
                    <Badge variant={session.intensity > 70 ? 'destructive' : 'secondary'}>
                      {session.intensity}%
                    </Badge>
                  </div>
                  <CardDescription>Target: {UNIT_GROUPS[session.targetGroup as UnitGroup]?.name || session.targetGroup}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {session.focusAreas.map(area => (
                      <Badge key={area} variant="outline">
                        {SC_FOCUS_AREAS[area].icon} {SC_FOCUS_AREAS[area].name}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">Duration: {session.totalDuration} min</p>
                    <p className="text-muted-foreground">{session.exercises.length} exercises</p>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-1">
                    {session.exercises.slice(0, 3).map(ex => (
                      <p key={ex.id} className="text-xs text-muted-foreground">• {ex.name}</p>
                    ))}
                    {session.exercises.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{session.exercises.length - 3} more</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises" className="space-y-6">
          {/* Focus Area Filters */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(SC_FOCUS_AREAS).map(([key, area]) => (
              <Button
                key={key}
                variant={selectedFocusAreas.includes(key as SCFocusArea) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleFocusArea(key as SCFocusArea)}
              >
                {area.icon} {area.name}
              </Button>
            ))}
            {selectedFocusAreas.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedFocusAreas([])}>
                Clear filters
              </Button>
            )}
          </div>

          {/* Exercise Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredExercises.map(exercise => (
              <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{SC_FOCUS_AREAS[exercise.category].icon}</span>
                    <Badge variant={
                      exercise.intensity === 'max' ? 'destructive' :
                      exercise.intensity === 'high' ? 'default' :
                      exercise.intensity === 'medium' ? 'secondary' : 'outline'
                    }>
                      {exercise.intensity}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{exercise.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{exercise.description}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{exercise.duration} min</span>
                    <span>{SC_FOCUS_AREAS[exercise.category].name}</span>
                  </div>
                  {exercise.equipment.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {exercise.equipment.map(eq => (
                        <Badge key={eq} variant="outline" className="text-xs">{eq}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Focus Area Selection */}
            <div className="col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">1. Select Focus Areas</CardTitle>
                  <CardDescription>What do you want to train?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(SC_FOCUS_AREAS).map(([key, area]) => (
                      <div
                        key={key}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedFocusAreas.includes(key as SCFocusArea) 
                            ? 'bg-primary/10 border border-primary' 
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                        onClick={() => toggleFocusArea(key as SCFocusArea)}
                      >
                        <span className="text-xl">{area.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{area.name}</p>
                          <p className="text-xs text-muted-foreground">{area.description}</p>
                        </div>
                        {selectedFocusAreas.includes(key as SCFocusArea) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Exercise Selection */}
            <div className="col-span-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2. Choose Exercises</CardTitle>
                  <CardDescription>
                    {selectedFocusAreas.length > 0 
                      ? `Showing exercises for: ${selectedFocusAreas.map(a => SC_FOCUS_AREAS[a].name).join(', ')}`
                      : 'Select focus areas to filter exercises'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {filteredExercises.map(exercise => (
                        <div
                          key={exercise.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedExercises.includes(exercise.id)
                              ? 'bg-primary/10 border border-primary'
                              : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                          onClick={() => toggleExercise(exercise.id)}
                        >
                          <Checkbox checked={selectedExercises.includes(exercise.id)} />
                          <span className="text-lg">{SC_FOCUS_AREAS[exercise.category].icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{exercise.name}</p>
                            <p className="text-xs text-muted-foreground">{exercise.description}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p>{exercise.duration} min</p>
                            <Badge variant="outline" className="text-xs">{exercise.intensity}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Session Preview */}
              {selectedExercises.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Session Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {selectedExercises.length} exercises selected
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total duration: {
                            PRESET_EXERCISES
                              .filter(ex => selectedExercises.includes(ex.id))
                              .reduce((sum, ex) => sum + ex.duration, 0)
                          } minutes
                        </p>
                      </div>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
