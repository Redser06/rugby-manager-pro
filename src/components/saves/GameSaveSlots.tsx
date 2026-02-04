import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { GameSave } from '@/types/coach';
import { Save, Upload, Trash2, Clock, Users, Calendar, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GameSaveSlotsProps {
  currentGameState: Json;
  currentWeek: number;
  currentSeason: number;
  teamName?: string;
  coachProfileId?: string;
  onLoadGame: (gameState: Json) => void;
}

export function GameSaveSlots({
  currentGameState,
  currentWeek,
  currentSeason,
  teamName,
  coachProfileId,
  onLoadGame
}: GameSaveSlotsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saves, setSaves] = useState<GameSave[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);
  const [newSlotName, setNewSlotName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const TOTAL_SLOTS = 5;

  useEffect(() => {
    if (user) {
      fetchSaves();
    }
  }, [user]);

  const fetchSaves = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('game_saves')
      .select('*')
      .eq('user_id', user.id)
      .order('slot_number');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load save games'
      });
    } else {
      setSaves(data as GameSave[] || []);
    }
    setLoading(false);
  };

  const handleSave = async (slotNumber: number) => {
    if (!user) return;

    setSaving(slotNumber);
    const existingSave = saves.find(s => s.slot_number === slotNumber);
    const slotName = newSlotName || `Save ${slotNumber}`;

    const saveData = {
      user_id: user.id,
      coach_profile_id: coachProfileId || null,
      slot_number: slotNumber,
      slot_name: slotName,
      game_state: currentGameState,
      current_week: currentWeek,
      current_season: currentSeason,
      team_name: teamName
    };

    let result;
    if (existingSave) {
      result = await supabase
        .from('game_saves')
        .update(saveData)
        .eq('id', existingSave.id);
    } else {
      result = await supabase
        .from('game_saves')
        .insert(saveData);
    }

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: result.error.message
      });
    } else {
      toast({
        title: 'Game Saved!',
        description: `Saved to slot ${slotNumber}`
      });
      fetchSaves();
    }

    setSaving(null);
    setNewSlotName('');
    setSelectedSlot(null);
  };

  const handleLoad = async (save: GameSave) => {
    setLoadingSlot(save.slot_number);
    
    try {
      onLoadGame(save.game_state);
      toast({
        title: 'Game Loaded!',
        description: `Loaded ${save.slot_name}`
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Load Failed',
        description: 'Could not load the save game'
      });
    }
    
    setLoadingSlot(null);
  };

  const handleDelete = async (save: GameSave) => {
    const { error } = await supabase
      .from('game_saves')
      .delete()
      .eq('id', save.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message
      });
    } else {
      toast({
        title: 'Save Deleted',
        description: `Removed ${save.slot_name}`
      });
      fetchSaves();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1).map(slotNumber => {
        const save = saves.find(s => s.slot_number === slotNumber);

        return (
          <Card key={slotNumber} className={save ? 'border-primary/30' : 'border-dashed'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Slot {slotNumber}</span>
                {save && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Save?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{save.slot_name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(save)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardTitle>
              {save ? (
                <CardDescription>{save.slot_name}</CardDescription>
              ) : (
                <CardDescription>Empty Slot</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {save ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {save.team_name || 'Unknown Team'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      S{save.current_season} W{save.current_week}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(save.updated_at), { addSuffix: true })}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleLoad(save)}
                      disabled={loadingSlot === slotNumber}
                    >
                      {loadingSlot === slotNumber ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-1" />
                      )}
                      Load
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedSlot(slotNumber);
                            setNewSlotName(save.slot_name);
                          }}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Overwrite
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Overwrite Save?</DialogTitle>
                          <DialogDescription>
                            This will replace the existing save with your current progress.
                          </DialogDescription>
                        </DialogHeader>
                        <Input
                          placeholder="Save name"
                          value={newSlotName}
                          onChange={(e) => setNewSlotName(e.target.value)}
                        />
                        <DialogFooter>
                          <Button
                            onClick={() => handleSave(slotNumber)}
                            disabled={saving === slotNumber}
                          >
                            {saving === slotNumber ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Save Game
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedSlot(slotNumber);
                        setNewSlotName(`${teamName || 'Game'} Save`);
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Here
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Game</DialogTitle>
                      <DialogDescription>
                        Save your current progress to slot {slotNumber}
                      </DialogDescription>
                    </DialogHeader>
                    <Input
                      placeholder="Save name"
                      value={newSlotName}
                      onChange={(e) => setNewSlotName(e.target.value)}
                    />
                    <DialogFooter>
                      <Button
                        onClick={() => handleSave(slotNumber)}
                        disabled={saving === slotNumber}
                      >
                        {saving === slotNumber ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Save Game
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
