import { useState } from 'react';
import { useSixNations } from '@/contexts/SixNationsContext';
import { SixNationsNation } from '@/types/sixNations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PRESET_TRAINING_SESSIONS, PRESET_DRILLS } from '@/data/trainingData';
import { TrainingSession, UNIT_GROUPS, UnitGroup } from '@/types/training';
import { Users, UserCircle, Dumbbell, ClipboardList, Calendar, Plus, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface NationalTrainingPanelProps {
  nation: SixNationsNation;
}

// International camps have limited time — max 3 sessions per group
const MAX_INTERNATIONAL_SESSIONS = 3;

const INTERNATIONAL_UNITS: { key: UnitGroup; label: string; icon: React.ElementType }[] = [
  { key: 'squad', label: 'Full Squad', icon: Users },
  { key: 'forwards', label: 'Forwards', icon: Users },
  { key: 'backs', label: 'Backs', icon: Users },
  { key: 'front_row', label: 'Front Row', icon: UserCircle },
  { key: 'second_row', label: 'Second Row', icon: UserCircle },
  { key: 'back_row', label: 'Back Row', icon: UserCircle },
  { key: 'halfbacks', label: 'Half-Backs', icon: UserCircle },
  { key: 'midfield', label: 'Midfield', icon: UserCircle },
  { key: 'back_three', label: 'Back Three', icon: UserCircle },
];

export function NationalTrainingPanel({ nation }: NationalTrainingPanelProps) {
  const { sixNationsState } = useSixNations();
  const [selectedUnit, setSelectedUnit] = useState<UnitGroup>('squad');
  const [assignedSessions, setAssignedSessions] = useState<Record<UnitGroup, TrainingSession[]>>({
    squad: [],
    forwards: [],
    backs: [],
    front_row: [],
    second_row: [],
    back_row: [],
    halfbacks: [],
    midfield: [],
    back_three: [],
  });

  if (!sixNationsState) return null;

  const nationalTeam = sixNationsState.nationalTeams.find(nt => nt.nation === nation);
  if (!nationalTeam) return null;

  const unitPlayers = nationalTeam.squad.filter(p =>
    UNIT_GROUPS[selectedUnit].positions.includes(p.positionNumber)
  );

  const currentSessions = assignedSessions[selectedUnit];
  const canAddMore = currentSessions.length < MAX_INTERNATIONAL_SESSIONS;

  const handleAssignSession = (session: TrainingSession) => {
    if (!canAddMore) {
      toast.error('Session limit reached', {
        description: `International camps are limited to ${MAX_INTERNATIONAL_SESSIONS} sessions per group`
      });
      return;
    }
    setAssignedSessions(prev => ({
      ...prev,
      [selectedUnit]: [...prev[selectedUnit], session]
    }));
    toast.success(`Added "${session.name}" to ${UNIT_GROUPS[selectedUnit].name}`);
  };

  const handleRemoveSession = (sessionId: string) => {
    setAssignedSessions(prev => ({
      ...prev,
      [selectedUnit]: prev[selectedUnit].filter(s => s.id !== sessionId)
    }));
  };

  const totalSessions = Object.values(assignedSessions).reduce((sum, s) => sum + s.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">International Training Camp</h2>
          <p className="text-sm text-muted-foreground">
            Condensed preparation for {nation} — limited to {MAX_INTERNATIONAL_SESSIONS} sessions per group
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{totalSessions} total sessions</Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            International window
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Unit Selection */}
        <Card className="col-span-12 md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Training Groups
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-1 p-2">
                {INTERNATIONAL_UNITS.map(({ key, label, icon: Icon }) => {
                  const count = nationalTeam.squad.filter(p =>
                    UNIT_GROUPS[key].positions.includes(p.positionNumber)
                  ).length;
                  const sessions = assignedSessions[key].length;
                  return (
                    <Button
                      key={key}
                      variant={selectedUnit === key ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedUnit(key)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="truncate">{label}</span>
                      <div className="ml-auto flex gap-1">
                        <Badge variant="outline" className="text-xs">{count}</Badge>
                        {sessions > 0 && (
                          <Badge variant="default" className="text-xs">{sessions}</Badge>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-9 space-y-4">
          {/* Unit Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{UNIT_GROUPS[selectedUnit].name}</CardTitle>
                  <CardDescription>
                    {unitPlayers.length} players in squad
                    {' • '}
                    {currentSessions.length}/{MAX_INTERNATIONAL_SESSIONS} sessions assigned
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {unitPlayers.map(player => (
                  <Badge key={player.id} variant="outline">
                    #{player.positionNumber} {player.lastName}
                  </Badge>
                ))}
                {unitPlayers.length === 0 && (
                  <p className="text-sm text-muted-foreground">No players in this group from current squad</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Camp Sessions
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!canAddMore}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Training Session</DialogTitle>
                      <DialogDescription>
                        Choose a session for {UNIT_GROUPS[selectedUnit].name}
                        ({currentSessions.length}/{MAX_INTERNATIONAL_SESSIONS} used)
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {PRESET_TRAINING_SESSIONS.map(session => (
                          <Card key={session.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleAssignSession(session)}>
                            <CardHeader className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-base">{session.name}</CardTitle>
                                  <CardDescription>{session.description}</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="outline">{session.duration}min</Badge>
                                  <Badge variant={session.intensity > 70 ? 'destructive' : 'secondary'}>
                                    {session.intensity}%
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {currentSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sessions assigned yet</p>
                  <p className="text-sm">International camps have limited preparation time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentSessions.map(session => (
                    <Card key={session.id} className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-semibold">{session.name}</h4>
                            <p className="text-sm text-muted-foreground">{session.description}</p>
                            <div className="flex gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {session.duration} min
                              </span>
                              <span>Intensity: {session.intensity}%</span>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {session.drills.map(drill => (
                                <Badge key={drill.id} variant="secondary" className="text-xs">{drill.name}</Badge>
                              ))}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveSession(session.id)}>
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Drills Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Drill Library</CardTitle>
              <CardDescription>Reference drills for building sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PRESET_DRILLS.slice(0, 9).map(drill => (
                  <div key={drill.id} className="p-3 rounded-lg border bg-card/50">
                    <h4 className="font-medium text-sm">{drill.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{drill.description}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {drill.focusAttributes.slice(0, 2).map(attr => (
                        <Badge key={attr} variant="outline" className="text-xs">{attr}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
