import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlayerPosition, PositionNumber } from '@/types/game';

type SetPieceType = 'scrum' | 'lineout' | 'kickoff_receive' | 'kickoff_chase' | 'dropout';

interface SetPieceSelectorProps {
  selected: SetPieceType | null;
  onSelect: (type: SetPieceType) => void;
  onApplyFormation: (positions: PlayerPosition[]) => void;
}

const SET_PIECE_FORMATIONS: Record<SetPieceType, { label: string; icon: string; positions: Omit<PlayerPosition, 'playerId'>[] }> = {
  scrum: {
    label: 'Scrum',
    icon: '⚙️',
    positions: [
      // Front row
      { positionNumber: 1, x: 45, y: 33 },
      { positionNumber: 2, x: 45, y: 35 },
      { positionNumber: 3, x: 45, y: 37 },
      // Locks
      { positionNumber: 4, x: 43, y: 33.5 },
      { positionNumber: 5, x: 43, y: 36.5 },
      // Back row
      { positionNumber: 6, x: 41, y: 32 },
      { positionNumber: 7, x: 41, y: 38 },
      { positionNumber: 8, x: 40, y: 35 },
      // Scrum-half
      { positionNumber: 9, x: 38, y: 37 },
      // Backs spread
      { positionNumber: 10, x: 35, y: 40 },
      { positionNumber: 12, x: 30, y: 45 },
      { positionNumber: 13, x: 25, y: 50 },
      { positionNumber: 11, x: 20, y: 15 },
      { positionNumber: 14, x: 20, y: 55 },
      { positionNumber: 15, x: 15, y: 35 },
    ]
  },
  lineout: {
    label: 'Lineout',
    icon: '📐',
    positions: [
      // Lineout jumpers (at touchline)
      { positionNumber: 2, x: 50, y: 8 },  // Hooker throwing
      { positionNumber: 4, x: 52, y: 12 }, // Front jumper
      { positionNumber: 6, x: 54, y: 12 }, // Front lifter
      { positionNumber: 5, x: 56, y: 12 }, // Middle jumper
      { positionNumber: 7, x: 58, y: 12 }, // Middle lifter
      { positionNumber: 8, x: 60, y: 12 }, // Back jumper
      // Props covering
      { positionNumber: 1, x: 52, y: 20 },
      { positionNumber: 3, x: 56, y: 20 },
      // Half backs
      { positionNumber: 9, x: 48, y: 18 },
      { positionNumber: 10, x: 42, y: 25 },
      // Centres
      { positionNumber: 12, x: 36, y: 30 },
      { positionNumber: 13, x: 30, y: 40 },
      // Back three
      { positionNumber: 11, x: 24, y: 10 },
      { positionNumber: 14, x: 24, y: 55 },
      { positionNumber: 15, x: 20, y: 35 },
    ]
  },
  kickoff_receive: {
    label: 'Kickoff Receive',
    icon: '🎯',
    positions: [
      // Catchers
      { positionNumber: 4, x: 55, y: 25 },
      { positionNumber: 5, x: 55, y: 45 },
      { positionNumber: 6, x: 52, y: 20 },
      { positionNumber: 7, x: 52, y: 50 },
      { positionNumber: 8, x: 50, y: 35 },
      // Props
      { positionNumber: 1, x: 48, y: 28 },
      { positionNumber: 2, x: 48, y: 35 },
      { positionNumber: 3, x: 48, y: 42 },
      // Half backs
      { positionNumber: 9, x: 42, y: 35 },
      { positionNumber: 10, x: 35, y: 35 },
      // Centres
      { positionNumber: 12, x: 30, y: 28 },
      { positionNumber: 13, x: 30, y: 42 },
      // Back three
      { positionNumber: 11, x: 25, y: 12 },
      { positionNumber: 14, x: 25, y: 58 },
      { positionNumber: 15, x: 20, y: 35 },
    ]
  },
  kickoff_chase: {
    label: 'Kickoff Chase',
    icon: '🏃',
    positions: [
      // Front chasers line
      { positionNumber: 6, x: 52, y: 20 },
      { positionNumber: 4, x: 52, y: 30 },
      { positionNumber: 5, x: 52, y: 40 },
      { positionNumber: 7, x: 52, y: 50 },
      // Second line
      { positionNumber: 8, x: 48, y: 25 },
      { positionNumber: 1, x: 48, y: 35 },
      { positionNumber: 3, x: 48, y: 45 },
      // Kicker
      { positionNumber: 10, x: 45, y: 35 },
      // Support
      { positionNumber: 2, x: 45, y: 28 },
      { positionNumber: 9, x: 42, y: 35 },
      { positionNumber: 12, x: 38, y: 28 },
      { positionNumber: 13, x: 38, y: 42 },
      // Sweepers
      { positionNumber: 11, x: 30, y: 15 },
      { positionNumber: 14, x: 30, y: 55 },
      { positionNumber: 15, x: 25, y: 35 },
    ]
  },
  dropout: {
    label: '22 Dropout',
    icon: '🔄',
    positions: [
      // Kicker and immediate support
      { positionNumber: 10, x: 22, y: 35 },
      { positionNumber: 9, x: 25, y: 38 },
      // Chase line
      { positionNumber: 6, x: 28, y: 20 },
      { positionNumber: 4, x: 28, y: 30 },
      { positionNumber: 5, x: 28, y: 40 },
      { positionNumber: 7, x: 28, y: 50 },
      { positionNumber: 8, x: 30, y: 35 },
      // Props
      { positionNumber: 1, x: 32, y: 28 },
      { positionNumber: 2, x: 32, y: 35 },
      { positionNumber: 3, x: 32, y: 42 },
      // Centres
      { positionNumber: 12, x: 35, y: 25 },
      { positionNumber: 13, x: 35, y: 45 },
      // Back three
      { positionNumber: 11, x: 18, y: 15 },
      { positionNumber: 14, x: 18, y: 55 },
      { positionNumber: 15, x: 12, y: 35 },
    ]
  }
};

export function SetPieceSelector({ selected, onSelect, onApplyFormation }: SetPieceSelectorProps) {
  const handleApply = () => {
    if (!selected) return;
    const formation = SET_PIECE_FORMATIONS[selected];
    onApplyFormation(formation.positions.map(p => ({
      ...p,
      playerId: '', // Will be filled by parent
      positionNumber: p.positionNumber as PositionNumber
    })));
  };

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Set Piece Type</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(SET_PIECE_FORMATIONS).map(([type, config]) => (
            <Button
              key={type}
              variant={selected === type ? 'default' : 'outline'}
              size="sm"
              className="justify-start gap-2"
              onClick={() => onSelect(type as SetPieceType)}
            >
              <span>{config.icon}</span>
              <span className="text-xs">{config.label}</span>
            </Button>
          ))}
        </div>
        {selected && (
          <Button size="sm" className="w-full" onClick={handleApply}>
            Apply Formation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export type { SetPieceType };
