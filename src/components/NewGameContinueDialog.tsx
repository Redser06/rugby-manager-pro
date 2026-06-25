import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGame } from '@/contexts/GameContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user chooses to start a new career (clears save and continues to team select). */
  onConfirmNew: () => void;
}

/**
 * First-run gate shown on TeamSelection when an existing season is present in
 * localStorage. Lets the user resume their career instead of silently
 * overwriting it (PLAN.md P0.6).
 */
export function NewGameContinueDialog({ open, onOpenChange, onConfirmNew }: Props) {
  const { gameState, resetGame } = useGame();
  const navigate = useNavigate();
  const team = gameState.selectedTeam;

  if (!team) return null;

  const handleContinue = () => {
    onOpenChange(false);
    navigate('/dashboard');
  };

  const handleNew = () => {
    resetGame();
    onConfirmNew();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resume your career?</DialogTitle>
          <DialogDescription>
            You have an active save with <span className="font-semibold text-foreground">{team.name}</span> —
            Season {gameState.currentSeason}, Week {gameState.currentWeek}.
            Starting a new career will permanently overwrite it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleNew}>Start new career</Button>
          <Button onClick={handleContinue}>Continue {team.shortName}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
