import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useGame } from '@/contexts/GameContext';
import { UNIT_GROUPS, UnitGroup, TRAINING_SESSION_TYPES, TrainingSession } from '@/types/training';
import { PRESET_TRAINING_SESSIONS, PRESET_DRILLS } from '@/data/trainingData';
import { Users, UserCircle, Dumbbell, ClipboardList, Calendar, Plus, Play, Pause, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function Training() {
  const { getMyTeam } = useGame();
  const team = getMyTeam();
  const [selectedUnit, setSelectedUnit] = useState<UnitGroup>('squad');
  const [assignedSessions, setAssignedSessions] = useState<Record<UnitGroup, TrainingSession[]>>({
    squad: [PRESET_TRAINING_SESSIONS[1], PRESET_TRAINING_SESSIONS[4]],
    forwards: [PRESET_TRAINING_SESSIONS[0], PRESET_TRAINING_SESSIONS[2]],
    backs: [PRESET_TRAINING_SESSIONS[3]],
    front_row: [],
    second_row: [],
    back_row: [],
    halfbacks: [],
    midfield: [],
    back_three: [],
  });
  const [showSessionBuilder, setShowSessionBuilder] = useState(false);

  if (!team) return null;

  const unitPlayers = team.players.filter(p => 
    UNIT_GROUPS[selectedUnit].positions.includes(p.positionNumber)
  );

  const handleAssignSession = (session: TrainingSession) => {
    setAssignedSessions(prev => ({
      ...prev,
      [selectedUnit]: [...prev[selectedUnit], session]
    }));
  };

  const handleRemoveSession = (sessionId: string) => {
    setAssignedSessions(prev => ({
      ...prev,
      [selectedUnit]: prev[selectedUnit].filter(s => s.id !== sessionId)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training</h1>
          <p className="text-muted-foreground">Design training plans for your squad and units</p>
        </div>
        <Button onClick={() => setShowSessionBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Session
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Unit Selection Sidebar */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Training Groups
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-1 p-2">
                {/* Squad Level */}
                <Button
                  variant={selectedUnit === 'squad' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedUnit('squad')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Full Squad
                  <Badge variant="outline" className="ml-auto">{team.players.length}</Badge>
                </Button>

                <Separator className="my-2" />
                <p className="text-xs text-muted-foreground px-2 py-1">Working Groups</p>
                
                {/* Working Groups */}
                {(['forwards', 'backs'] as UnitGroup[]).map(unit => (
                  <Button
                    key={unit}
                    variant={selectedUnit === unit ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedUnit(unit)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {UNIT_GROUPS[unit].name}
                    <Badge variant="outline" className="ml-auto">
                      {team.players.filter(p => UNIT_GROUPS[unit].positions.includes(p.positionNumber)).length}
                    </Badge>
                  </Button>
                ))}

                <Separator className="my-2" />
                <p className="text-xs text-muted-foreground px-2 py-1">Position Units</p>

                {/* Position Units */}
                {(['front_row', 'second_row', 'back_row', 'halfbacks', 'midfield', 'back_three'] as UnitGroup[]).map(unit => (
                  <Button
                    key={unit}
                    variant={selectedUnit === unit ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-sm"
                    onClick={() => setSelectedUnit(unit)}
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    {UNIT_GROUPS[unit].name}
                    <Badge variant="outline" className="ml-auto">
                      {team.players.filter(p => UNIT_GROUPS[unit].positions.includes(p.positionNumber)).length}
                    </Badge>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="col-span-9 space-y-6">
          {/* Unit Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{UNIT_GROUPS[selectedUnit].name}</CardTitle>
                  <CardDescription>
                    {unitPlayers.length} players • Positions: {UNIT_GROUPS[selectedUnit].positions.join(', ')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default">{assignedSessions[selectedUnit].length} Sessions</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {unitPlayers.slice(0, 10).map(player => (
                  <Badge key={player.id} variant="outline">
                    #{player.positionNumber} {player.lastName}
                  </Badge>
                ))}
                {unitPlayers.length > 10 && (
                  <Badge variant="secondary">+{unitPlayers.length - 10} more</Badge>
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
                  Assigned Training Sessions
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Preset Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Training Session</DialogTitle>
                      <DialogDescription>Choose a preset session to assign to {UNIT_GROUPS[selectedUnit].name}</DialogDescription>
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
                                    {session.intensity}% intensity
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
              {assignedSessions[selectedUnit].length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No training sessions assigned to this group</p>
                  <p className="text-sm">Add a preset session or create a custom one</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedSessions[selectedUnit].map(session => (
                    <Card key={session.id} className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{session.name}</h4>
                              <Badge variant="outline">{TRAINING_SESSION_TYPES[session.type].name}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{session.description}</p>
                            <div className="flex gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {session.duration} min
                              </span>
                              <span>Intensity: {session.intensity}%</span>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {session.drills.map(drill => (
                                <Badge key={drill.id} variant="secondary" className="text-xs">
                                  {drill.name}
                                </Badge>
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

          {/* Available Drills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Drills Library</CardTitle>
              <CardDescription>Drills you can include in custom training sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PRESET_DRILLS.map(drill => (
                  <div key={drill.id} className="p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                    <h4 className="font-medium text-sm">{drill.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{drill.description}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {drill.focusAttributes.slice(0, 2).map(attr => (
                        <Badge key={attr} variant="outline" className="text-xs">
                          {attr}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{drill.duration} min</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session Builder Dialog */}
      <Dialog open={showSessionBuilder} onOpenChange={setShowSessionBuilder}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Custom Training Session</DialogTitle>
            <DialogDescription>Build a training session for {UNIT_GROUPS[selectedUnit].name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Session Name</Label>
                <Input placeholder="e.g., Morning Skills" />
              </div>
              <div className="space-y-2">
                <Label>Session Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRAINING_SESSION_TYPES).map(([key, type]) => (
                      <SelectItem key={key} value={key}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe the session focus and goals..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input type="number" placeholder="60" />
              </div>
              <div className="space-y-2">
                <Label>Intensity (%)</Label>
                <Input type="number" placeholder="70" min={0} max={100} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSessionBuilder(false)}>Cancel</Button>
              <Button onClick={() => setShowSessionBuilder(false)}>Create Session</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
