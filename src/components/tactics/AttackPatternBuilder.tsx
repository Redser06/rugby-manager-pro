import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AttackPattern, 
  AttackPhase, 
  PhaseAction, 
  PATTERN_TEMPLATES,
  ATTACKING_SHAPES,
  BACKS_MOVES,
  KICKING_STRATEGIES,
  ForwardPodConfig
} from '@/types/tactics';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Sparkles, 
  Goal, 
  RotateCcw,
  Play,
  Target,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

interface AttackPatternBuilderProps {
  patterns: AttackPattern[];
  onChange: (patterns: AttackPattern[]) => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function PhaseActionBadge({ action }: { action: PhaseAction }) {
  const getActionDetails = () => {
    switch (action.type) {
      case 'forward_carry':
        const shape = ATTACKING_SHAPES.find(s => s.config === action.shape);
        return {
          icon: <Users className="h-3 w-3" />,
          label: `${shape?.config || action.shape} ${action.podTarget?.replace('_', ' ') || ''}`,
          variant: 'default' as const
        };
      case 'backs_move':
        const move = BACKS_MOVES.find(m => m.id === action.moveId);
        return {
          icon: <Sparkles className="h-3 w-3" />,
          label: move?.name || 'Backs Move',
          variant: 'secondary' as const
        };
      case 'kick':
        const kick = KICKING_STRATEGIES.find(k => k.id === action.kickId);
        return {
          icon: <Goal className="h-3 w-3" />,
          label: kick?.name || 'Kick',
          variant: 'outline' as const
        };
      case 'reset':
        return {
          icon: <RotateCcw className="h-3 w-3" />,
          label: action.resetType?.replace('_', ' ') || 'Reset',
          variant: 'outline' as const
        };
      default:
        return { icon: null, label: 'Unknown', variant: 'outline' as const };
    }
  };

  const details = getActionDetails();

  return (
    <Badge variant={details.variant} className="text-xs flex items-center gap-1">
      {details.icon}
      <span className="capitalize">{details.label}</span>
    </Badge>
  );
}

function PhaseCard({ 
  phase, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast 
}: { 
  phase: AttackPhase;
  onUpdate: (phase: AttackPhase) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const addAction = (type: PhaseAction['type']) => {
    const newAction: PhaseAction = {
      id: generateId(),
      type,
      ...(type === 'forward_carry' && { shape: '2-4-2' as ForwardPodConfig, podTarget: 'crash' as const }),
      ...(type === 'backs_move' && { moveId: 'move_crash' }),
      ...(type === 'kick' && { kickId: 'kick_box' }),
      ...(type === 'reset' && { resetType: 'quick_ball' as const })
    };
    onUpdate({ ...phase, actions: [...phase.actions, newAction] });
  };

  const updateAction = (actionId: string, updates: Partial<PhaseAction>) => {
    onUpdate({
      ...phase,
      actions: phase.actions.map(a => a.id === actionId ? { ...a, ...updates } : a)
    });
  };

  const deleteAction = (actionId: string) => {
    onUpdate({
      ...phase,
      actions: phase.actions.filter(a => a.id !== actionId)
    });
  };

  const intentColors: Record<string, string> = {
    gain_yards: 'bg-blue-500/10 border-blue-500/30',
    create_space: 'bg-purple-500/10 border-purple-500/30',
    target_edge: 'bg-amber-500/10 border-amber-500/30',
    score: 'bg-green-500/10 border-green-500/30',
    build_pressure: 'bg-orange-500/10 border-orange-500/30'
  };

  return (
    <div className={`border rounded-lg p-3 ${intentColors[phase.intent] || 'border-border'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Phase {phase.phaseNumber}</Badge>
          <Input
            value={phase.name}
            onChange={(e) => onUpdate({ ...phase, name: e.target.value })}
            className="h-7 w-32 text-sm font-medium"
            placeholder="Phase name"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={isFirst}>
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown} disabled={isLast}>
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Actions preview */}
      <div className="flex flex-wrap gap-1 mb-2">
        {phase.actions.map(action => (
          <PhaseActionBadge key={action.id} action={action} />
        ))}
        {phase.actions.length === 0 && (
          <span className="text-xs text-muted-foreground italic">No actions defined</span>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-3 border-t">
          {/* Intent selector */}
          <div className="flex items-center gap-2">
            <Label className="text-xs w-16">Intent:</Label>
            <Select value={phase.intent} onValueChange={(v) => onUpdate({ ...phase, intent: v as AttackPhase['intent'] })}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gain_yards">Gain Yards</SelectItem>
                <SelectItem value="create_space">Create Space</SelectItem>
                <SelectItem value="target_edge">Target Edge</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="build_pressure">Build Pressure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions editor */}
          <div className="space-y-2">
            <Label className="text-xs">Actions:</Label>
            {phase.actions.map((action, idx) => (
              <div key={action.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                
                <Select value={action.type} onValueChange={(v) => updateAction(action.id, { type: v as PhaseAction['type'] })}>
                  <SelectTrigger className="h-7 text-xs w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forward_carry">Forward Carry</SelectItem>
                    <SelectItem value="backs_move">Backs Move</SelectItem>
                    <SelectItem value="kick">Kick</SelectItem>
                    <SelectItem value="reset">Reset</SelectItem>
                  </SelectContent>
                </Select>

                {action.type === 'forward_carry' && (
                  <>
                    <Select value={action.shape} onValueChange={(v) => updateAction(action.id, { shape: v as ForwardPodConfig })}>
                      <SelectTrigger className="h-7 text-xs w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTACKING_SHAPES.map(s => (
                          <SelectItem key={s.id} value={s.config}>{s.config}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={action.podTarget} onValueChange={(v) => updateAction(action.id, { podTarget: v as any })}>
                      <SelectTrigger className="h-7 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blindside">Blindside</SelectItem>
                        <SelectItem value="openside">Openside</SelectItem>
                        <SelectItem value="pick_and_go">Pick & Go</SelectItem>
                        <SelectItem value="crash">Crash</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}

                {action.type === 'backs_move' && (
                  <Select value={action.moveId} onValueChange={(v) => updateAction(action.id, { moveId: v })}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BACKS_MOVES.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {action.type === 'kick' && (
                  <Select value={action.kickId} onValueChange={(v) => updateAction(action.id, { kickId: v })}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KICKING_STRATEGIES.map(k => (
                        <SelectItem key={k.id} value={k.id}>{k.icon} {k.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {action.type === 'reset' && (
                  <Select value={action.resetType} onValueChange={(v) => updateAction(action.id, { resetType: v as any })}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick_ball">Quick Ball</SelectItem>
                      <SelectItem value="slow_set">Slow Set</SelectItem>
                      <SelectItem value="switch_point">Switch Point</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteAction(action.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            <div className="flex gap-1 pt-1">
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => addAction('forward_carry')}>
                <Users className="h-3 w-3 mr-1" /> Forward
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => addAction('backs_move')}>
                <Sparkles className="h-3 w-3 mr-1" /> Backs
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => addAction('kick')}>
                <Goal className="h-3 w-3 mr-1" /> Kick
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => addAction('reset')}>
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Notes:</Label>
            <Textarea
              value={phase.notes || ''}
              onChange={(e) => onUpdate({ ...phase, notes: e.target.value })}
              placeholder="Optional coaching notes for this phase..."
              className="text-xs h-16 mt-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PatternCard({ 
  pattern, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: { 
  pattern: AttackPattern;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const riskColors = {
    conservative: 'text-green-600 bg-green-500/10',
    balanced: 'text-amber-600 bg-amber-500/10',
    aggressive: 'text-red-600 bg-red-500/10'
  };

  return (
    <Card className="cursor-pointer hover:border-primary transition-colors" onClick={onEdit}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              {pattern.name}
            </CardTitle>
            <CardDescription className="text-xs mt-1 line-clamp-2">
              {pattern.description}
            </CardDescription>
          </div>
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge variant="outline" className="text-[10px]">{pattern.trigger}</Badge>
          <Badge variant="outline" className="text-[10px]">{pattern.fieldZone.replace('_', ' ')}</Badge>
          <Badge className={`text-[10px] ${riskColors[pattern.riskProfile]}`}>
            {pattern.riskProfile}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {pattern.phases.length} phases
          </Badge>
        </div>
        
        {/* Phase timeline preview */}
        <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1">
          {pattern.phases.map((phase, idx) => (
            <div key={phase.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-[10px] font-medium">
                  {idx + 1}
                </div>
                <span className="text-[8px] text-muted-foreground mt-0.5 max-w-12 truncate">
                  {phase.name}
                </span>
              </div>
              {idx < pattern.phases.length - 1 && (
                <div className="w-4 h-px bg-border mx-0.5" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PatternEditor({ 
  pattern, 
  onSave, 
  onCancel 
}: { 
  pattern: AttackPattern | null;
  onSave: (pattern: AttackPattern) => void;
  onCancel: () => void;
}) {
  const [editedPattern, setEditedPattern] = useState<AttackPattern>(
    pattern || {
      id: generateId(),
      name: 'New Pattern',
      description: '',
      trigger: 'phase_play',
      fieldZone: 'midfield',
      phases: [],
      expectedDuration: 4,
      riskProfile: 'balanced',
      primaryObjective: ''
    }
  );

  const addPhase = () => {
    const newPhase: AttackPhase = {
      id: generateId(),
      phaseNumber: editedPattern.phases.length + 1,
      name: `Phase ${editedPattern.phases.length + 1}`,
      actions: [],
      intent: 'gain_yards'
    };
    setEditedPattern(prev => ({ ...prev, phases: [...prev.phases, newPhase] }));
  };

  const updatePhase = (phaseId: string, updates: Partial<AttackPhase>) => {
    setEditedPattern(prev => ({
      ...prev,
      phases: prev.phases.map(p => p.id === phaseId ? { ...p, ...updates } : p)
    }));
  };

  const deletePhase = (phaseId: string) => {
    setEditedPattern(prev => ({
      ...prev,
      phases: prev.phases
        .filter(p => p.id !== phaseId)
        .map((p, idx) => ({ ...p, phaseNumber: idx + 1 }))
    }));
  };

  const movePhase = (phaseId: string, direction: 'up' | 'down') => {
    const idx = editedPattern.phases.findIndex(p => p.id === phaseId);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === editedPattern.phases.length - 1)) return;
    
    const newPhases = [...editedPattern.phases];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newPhases[idx], newPhases[swapIdx]] = [newPhases[swapIdx], newPhases[idx]];
    
    setEditedPattern(prev => ({
      ...prev,
      phases: newPhases.map((p, i) => ({ ...p, phaseNumber: i + 1 }))
    }));
  };

  const applyTemplate = (template: Partial<AttackPattern>) => {
    setEditedPattern(prev => ({
      ...prev,
      ...template,
      id: prev.id,
      phases: (template.phases || []).map(p => ({ ...p, id: generateId(), actions: p.actions.map(a => ({ ...a, id: generateId() })) }))
    }));
    toast.success('Template applied');
  };

  return (
    <div className="space-y-4">
      {/* Pattern metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="text-xs">Pattern Name</Label>
          <Input
            value={editedPattern.name}
            onChange={(e) => setEditedPattern(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1"
          />
        </div>
        
        <div className="col-span-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            value={editedPattern.description}
            onChange={(e) => setEditedPattern(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1 h-16"
            placeholder="Describe the pattern's purpose and how it should unfold..."
          />
        </div>

        <div>
          <Label className="text-xs">Trigger</Label>
          <Select value={editedPattern.trigger} onValueChange={(v) => setEditedPattern(prev => ({ ...prev, trigger: v as any }))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lineout">Lineout</SelectItem>
              <SelectItem value="scrum">Scrum</SelectItem>
              <SelectItem value="penalty">Penalty</SelectItem>
              <SelectItem value="phase_play">Phase Play</SelectItem>
              <SelectItem value="turnover">Turnover</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Field Zone</Label>
          <Select value={editedPattern.fieldZone} onValueChange={(v) => setEditedPattern(prev => ({ ...prev, fieldZone: v as any }))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="own_22">Own 22</SelectItem>
              <SelectItem value="own_half">Own Half</SelectItem>
              <SelectItem value="midfield">Midfield</SelectItem>
              <SelectItem value="opposition_half">Opposition Half</SelectItem>
              <SelectItem value="opposition_22">Opposition 22</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Risk Profile</Label>
          <Select value={editedPattern.riskProfile} onValueChange={(v) => setEditedPattern(prev => ({ ...prev, riskProfile: v as any }))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Conservative</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="aggressive">Aggressive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Expected Duration (phases)</Label>
          <Input
            type="number"
            min={1}
            max={12}
            value={editedPattern.expectedDuration}
            onChange={(e) => setEditedPattern(prev => ({ ...prev, expectedDuration: parseInt(e.target.value) || 4 }))}
            className="mt-1"
          />
        </div>

        <div className="col-span-2">
          <Label className="text-xs">Primary Objective</Label>
          <Input
            value={editedPattern.primaryObjective}
            onChange={(e) => setEditedPattern(prev => ({ ...prev, primaryObjective: e.target.value }))}
            className="mt-1"
            placeholder="e.g., Create try-scoring opportunity on the left edge"
          />
        </div>
      </div>

      {/* Templates */}
      <div>
        <Label className="text-xs mb-2 block">Apply Template:</Label>
        <div className="flex flex-wrap gap-1">
          {PATTERN_TEMPLATES.map((template, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => applyTemplate(template)}
            >
              {template.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Phases */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Phases</Label>
          <Button variant="outline" size="sm" onClick={addPhase}>
            <Plus className="h-3 w-3 mr-1" /> Add Phase
          </Button>
        </div>
        
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {editedPattern.phases.map((phase, idx) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                onUpdate={(p) => updatePhase(phase.id, p)}
                onDelete={() => deletePhase(phase.id)}
                onMoveUp={() => movePhase(phase.id, 'up')}
                onMoveDown={() => movePhase(phase.id, 'down')}
                isFirst={idx === 0}
                isLast={idx === editedPattern.phases.length - 1}
              />
            ))}
            {editedPattern.phases.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No phases yet. Add your first phase or apply a template.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(editedPattern)}>
          <Play className="h-4 w-4 mr-1" /> Save Pattern
        </Button>
      </div>
    </div>
  );
}

export function AttackPatternBuilder({ patterns, onChange }: AttackPatternBuilderProps) {
  const [editingPattern, setEditingPattern] = useState<AttackPattern | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSave = (pattern: AttackPattern) => {
    const exists = patterns.find(p => p.id === pattern.id);
    if (exists) {
      onChange(patterns.map(p => p.id === pattern.id ? pattern : p));
    } else {
      onChange([...patterns, pattern]);
    }
    setIsDialogOpen(false);
    setEditingPattern(null);
    toast.success('Pattern saved');
  };

  const handleDelete = (patternId: string) => {
    onChange(patterns.filter(p => p.id !== patternId));
    toast.success('Pattern deleted');
  };

  const handleDuplicate = (pattern: AttackPattern) => {
    const duplicate: AttackPattern = {
      ...pattern,
      id: generateId(),
      name: `${pattern.name} (Copy)`,
      phases: pattern.phases.map(p => ({
        ...p,
        id: generateId(),
        actions: p.actions.map(a => ({ ...a, id: generateId() }))
      }))
    };
    onChange([...patterns, duplicate]);
    toast.success('Pattern duplicated');
  };

  const openNewPattern = () => {
    setEditingPattern(null);
    setIsDialogOpen(true);
  };

  const openEditPattern = (pattern: AttackPattern) => {
    setEditingPattern(pattern);
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Attack Patterns
            </CardTitle>
            <CardDescription>
              Create multi-phase attack sequences combining shapes, moves, and kicks into structured game plans.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewPattern}>
                <Plus className="h-4 w-4 mr-1" /> New Pattern
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPattern ? 'Edit Attack Pattern' : 'Create Attack Pattern'}
                </DialogTitle>
              </DialogHeader>
              <PatternEditor
                pattern={editingPattern}
                onSave={handleSave}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {patterns.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-medium mb-1">No Attack Patterns</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create multi-phase attack sequences to structure your team's approach.
            </p>
            <Button onClick={openNewPattern}>
              <Plus className="h-4 w-4 mr-1" /> Create First Pattern
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patterns.map(pattern => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                onEdit={() => openEditPattern(pattern)}
                onDelete={() => handleDelete(pattern.id)}
                onDuplicate={() => handleDuplicate(pattern)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
