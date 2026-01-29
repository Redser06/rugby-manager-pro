import { useState, useCallback, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { StrikePlay, PlayerPosition, RunningLine, PlayPhase, AttackPattern, PositionNumber } from '@/types/game';
import { RugbyPitch } from '@/components/pitch/RugbyPitch';
import { DraggablePlayer } from '@/components/pitch/DraggablePlayer';
import { RunningLineDrawer } from '@/components/pitch/RunningLineDrawer';
import { SetPieceSelector, SetPieceType } from '@/components/pitch/SetPieceSelector';
import { AttackPatternPanel } from '@/components/pitch/AttackPatternPanel';
import { PhaseEditor } from '@/components/pitch/PhaseEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Trash2, 
  Plus, 
  Pencil, 
  MousePointer, 
  MoveHorizontal, 
  ArrowRight,
  RotateCcw,
  Copy,
  Eye
} from 'lucide-react';

type EditorMode = 'select' | 'move' | 'draw_run' | 'draw_pass' | 'draw_kick';

const DEFAULT_ATTACK_PATTERN: AttackPattern = {
  wideChannels: true,
  narrowPods: false,
  tipOnPasses: false,
  crashBalls: false,
  kickingOptions: []
};

const DEFAULT_PLAYER_POSITIONS: PlayerPosition[] = [
  { playerId: '', positionNumber: 1, x: 50, y: 33 },
  { playerId: '', positionNumber: 2, x: 50, y: 35 },
  { playerId: '', positionNumber: 3, x: 50, y: 37 },
  { playerId: '', positionNumber: 4, x: 48, y: 33.5 },
  { playerId: '', positionNumber: 5, x: 48, y: 36.5 },
  { playerId: '', positionNumber: 6, x: 46, y: 32 },
  { playerId: '', positionNumber: 7, x: 46, y: 38 },
  { playerId: '', positionNumber: 8, x: 45, y: 35 },
  { playerId: '', positionNumber: 9, x: 42, y: 36 },
  { playerId: '', positionNumber: 10, x: 38, y: 40 },
  { playerId: '', positionNumber: 11, x: 25, y: 15 },
  { playerId: '', positionNumber: 12, x: 32, y: 42 },
  { playerId: '', positionNumber: 13, x: 28, y: 48 },
  { playerId: '', positionNumber: 14, x: 25, y: 55 },
  { playerId: '', positionNumber: 15, x: 20, y: 35 },
];

export default function StrikePlayEditor() {
  const { getMyTeam } = useGame();
  const team = getMyTeam();

  // Editor state
  const [mode, setMode] = useState<EditorMode>('move');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedSetPiece, setSelectedSetPiece] = useState<SetPieceType | null>('scrum');

  // Play data
  const [playName, setPlayName] = useState('New Strike Play');
  const [trigger, setTrigger] = useState<StrikePlay['trigger']>('scrum');
  const [targetArea, setTargetArea] = useState<StrikePlay['targetArea']>('openside');
  const [playerPositions, setPlayerPositions] = useState<PlayerPosition[]>(DEFAULT_PLAYER_POSITIONS);
  const [runningLines, setRunningLines] = useState<RunningLine[]>([]);
  const [phases, setPhases] = useState<PlayPhase[]>([{ number: 1, description: 'First Phase', attackStyle: 'wide' }]);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [attackPattern, setAttackPattern] = useState<AttackPattern>(DEFAULT_ATTACK_PATTERN);

  // Saved plays
  const [savedPlays, setSavedPlays] = useState<StrikePlay[]>([]);
  const [editingPlayId, setEditingPlayId] = useState<string | null>(null);

  // Initialize player positions with actual player IDs
  useEffect(() => {
    if (team) {
      setPlayerPositions(prev => prev.map(pos => {
        const player = team.players.find(p => p.positionNumber === pos.positionNumber);
        return { ...pos, playerId: player?.id || '' };
      }));
    }
  }, [team]);

  const handlePlayerPositionChange = useCallback((positionNumber: PositionNumber, x: number, y: number) => {
    setPlayerPositions(prev => prev.map(p => 
      p.positionNumber === positionNumber ? { ...p, x, y } : p
    ));
  }, []);

  const handleApplyFormation = (positions: PlayerPosition[]) => {
    if (!team) return;
    setPlayerPositions(positions.map(pos => {
      const player = team.players.find(p => p.positionNumber === pos.positionNumber);
      return { ...pos, playerId: player?.id || '' };
    }));
  };

  const handleAddLine = (line: Omit<RunningLine, 'id'>) => {
    setRunningLines(prev => [...prev, { ...line, id: crypto.randomUUID() }]);
  };

  const handleDeleteLine = (id: string) => {
    setRunningLines(prev => prev.filter(l => l.id !== id));
  };

  const handleSavePlay = () => {
    const play: StrikePlay = {
      id: editingPlayId || crypto.randomUUID(),
      name: playName,
      trigger,
      targetArea,
      attackPattern,
      playerPositions,
      runningLines,
      phases,
      description: phases.map(p => p.description).join(' → ')
    };

    if (editingPlayId) {
      setSavedPlays(prev => prev.map(p => p.id === editingPlayId ? play : p));
    } else {
      setSavedPlays(prev => [...prev, play]);
    }
    
    setEditingPlayId(play.id);
  };

  const handleLoadPlay = (play: StrikePlay) => {
    setEditingPlayId(play.id);
    setPlayName(play.name);
    setTrigger(play.trigger);
    setTargetArea(play.targetArea);
    setAttackPattern(play.attackPattern);
    setPlayerPositions(play.playerPositions);
    setRunningLines(play.runningLines);
    setPhases(play.phases);
    setCurrentPhase(1);
  };

  const handleNewPlay = () => {
    setEditingPlayId(null);
    setPlayName('New Strike Play');
    setTrigger('scrum');
    setTargetArea('openside');
    setAttackPattern(DEFAULT_ATTACK_PATTERN);
    setPlayerPositions(DEFAULT_PLAYER_POSITIONS.map(pos => {
      const player = team?.players.find(p => p.positionNumber === pos.positionNumber);
      return { ...pos, playerId: player?.id || '' };
    }));
    setRunningLines([]);
    setPhases([{ number: 1, description: 'First Phase', attackStyle: 'wide' }]);
    setCurrentPhase(1);
  };

  const handleDeletePlay = (id: string) => {
    setSavedPlays(prev => prev.filter(p => p.id !== id));
    if (editingPlayId === id) handleNewPlay();
  };

  const handleDuplicatePlay = (play: StrikePlay) => {
    const newPlay = { ...play, id: crypto.randomUUID(), name: `${play.name} (Copy)` };
    setSavedPlays(prev => [...prev, newPlay]);
  };

  const clearLines = () => {
    setRunningLines(prev => prev.filter(l => l.phase !== currentPhase));
  };

  if (!team) return null;

  const modeButtons: { mode: EditorMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'select', icon: <MousePointer className="h-4 w-4" />, label: 'Select' },
    { mode: 'move', icon: <MoveHorizontal className="h-4 w-4" />, label: 'Move' },
    { mode: 'draw_run', icon: <ArrowRight className="h-4 w-4 text-green-500" />, label: 'Run' },
    { mode: 'draw_pass', icon: <ArrowRight className="h-4 w-4 text-blue-500" />, label: 'Pass' },
    { mode: 'draw_kick', icon: <ArrowRight className="h-4 w-4 text-yellow-500" />, label: 'Kick' },
  ];

  return (
    <div className="p-4 h-[calc(100vh-4rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Input
            value={playName}
            onChange={(e) => setPlayName(e.target.value)}
            className="text-lg font-semibold w-64"
          />
          <Badge variant={editingPlayId ? 'secondary' : 'outline'}>
            {editingPlayId ? 'Editing' : 'New'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNewPlay}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
          <Button size="sm" onClick={handleSavePlay}>
            <Save className="h-4 w-4 mr-1" />
            Save Play
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Left Panel - Set Pieces & Saved Plays */}
        <div className="col-span-2 flex flex-col gap-4 overflow-hidden">
          <SetPieceSelector
            selected={selectedSetPiece}
            onSelect={setSelectedSetPiece}
            onApplyFormation={handleApplyFormation}
          />
          
          <Card className="flex-1 min-h-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Saved Plays</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[calc(100%-2rem)]">
                <div className="space-y-1">
                  {savedPlays.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No saved plays yet
                    </p>
                  )}
                  {savedPlays.map(play => (
                    <div
                      key={play.id}
                      className={`p-2 rounded-md border cursor-pointer hover:bg-muted/50 ${
                        editingPlayId === play.id ? 'border-primary bg-primary/10' : ''
                      }`}
                      onClick={() => handleLoadPlay(play)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium truncate">{play.name}</p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={(e) => { e.stopPropagation(); handleDuplicatePlay(play); }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDeletePlay(play.id); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {play.trigger}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Centre - Pitch */}
        <div className="col-span-7 flex flex-col gap-3">
          {/* Toolbar */}
          <Card>
            <CardContent className="py-2 px-3 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {modeButtons.map(btn => (
                  <Button
                    key={btn.mode}
                    variant={mode === btn.mode ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-1"
                    onClick={() => setMode(btn.mode)}
                  >
                    {btn.icon}
                    <span className="text-xs">{btn.label}</span>
                  </Button>
                ))}
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button variant="ghost" size="sm" onClick={clearLines} className="gap-1">
                <RotateCcw className="h-3 w-3" />
                <span className="text-xs">Clear Lines</span>
              </Button>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Trigger:</span>
                <Select value={trigger} onValueChange={(v) => setTrigger(v as StrikePlay['trigger'])}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scrum">Scrum</SelectItem>
                    <SelectItem value="lineout">Lineout</SelectItem>
                    <SelectItem value="kickoff">Kickoff</SelectItem>
                    <SelectItem value="dropout">Dropout</SelectItem>
                    <SelectItem value="penalty">Penalty</SelectItem>
                    <SelectItem value="free_kick">Free Kick</SelectItem>
                  </SelectContent>
                </Select>

                <span className="text-xs text-muted-foreground">Target:</span>
                <Select value={targetArea} onValueChange={(v) => setTargetArea(v as StrikePlay['targetArea'])}>
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blindside">Blindside</SelectItem>
                    <SelectItem value="midfield">Midfield</SelectItem>
                    <SelectItem value="openside">Openside</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="crossfield">Crossfield</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pitch */}
          <div className="flex-1 min-h-0">
            <RugbyPitch className="w-full h-full aspect-[100/70]">
              {/* Running lines layer */}
              <RunningLineDrawer
                lines={runningLines}
                onLineAdd={handleAddLine}
                onLineUpdate={() => {}}
                onLineDelete={handleDeleteLine}
                selectedPlayerId={selectedPlayerId || undefined}
                currentPhase={currentPhase}
                isDrawing={mode.startsWith('draw_')}
                lineType={mode === 'draw_pass' ? 'pass' : mode === 'draw_kick' ? 'kick' : 'run'}
              />
              
              {/* Players layer */}
              {playerPositions.map(pos => {
                const player = team.players.find(p => p.id === pos.playerId);
                return (
                  <DraggablePlayer
                    key={pos.positionNumber}
                    player={player}
                    positionNumber={pos.positionNumber}
                    x={pos.x}
                    y={pos.y}
                    onPositionChange={(x, y) => handlePlayerPositionChange(pos.positionNumber, x, y)}
                    isSelected={selectedPlayerId === pos.playerId}
                    onClick={() => setSelectedPlayerId(pos.playerId)}
                    size="md"
                  />
                );
              })}
            </RugbyPitch>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-500" />
              <span>Run</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-blue-500" />
              <span>Pass</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-yellow-500" />
              <span>Kick</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Phases & Attack Patterns */}
        <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
          <PhaseEditor
            phases={phases}
            currentPhase={currentPhase}
            onCurrentPhaseChange={setCurrentPhase}
            onPhasesChange={setPhases}
          />
          
          <AttackPatternPanel
            pattern={attackPattern}
            onChange={setAttackPattern}
          />

          {/* Selected Player Info */}
          {selectedPlayerId && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Selected Player</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const player = team.players.find(p => p.id === selectedPlayerId);
                  if (!player) return null;
                  return (
                    <div className="text-sm">
                      <p className="font-medium">{player.firstName} {player.lastName}</p>
                      <p className="text-muted-foreground">{player.position}</p>
                      <p className="text-xs mt-1">
                        Click and drag on the pitch to draw running lines for this player
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
