import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Player, PositionNumber } from '@/types/game';

interface DraggablePlayerProps {
  player?: Player;
  positionNumber: PositionNumber;
  x: number;
  y: number;
  onPositionChange: (x: number, y: number) => void;
  isSelected?: boolean;
  onClick?: () => void;
  showNumber?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const POSITION_COLORS: Record<number, string> = {
  1: 'bg-red-500', 2: 'bg-red-500', 3: 'bg-red-500', // Props + Hooker
  4: 'bg-orange-500', 5: 'bg-orange-500', // Locks
  6: 'bg-yellow-500', 7: 'bg-yellow-500', 8: 'bg-yellow-500', // Back row
  9: 'bg-green-500', 10: 'bg-green-500', // Half backs
  11: 'bg-blue-500', 14: 'bg-blue-500', 15: 'bg-blue-500', // Back three
  12: 'bg-purple-500', 13: 'bg-purple-500', // Centres
};

export function DraggablePlayer({
  player,
  positionNumber,
  x,
  y,
  onPositionChange,
  isSelected,
  onClick,
  showNumber = true,
  size = 'md'
}: DraggablePlayerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'w-4 h-4 text-[8px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm'
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = x;
    const startPosY = y;

    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;
      
      const newX = Math.max(0, Math.min(100, startPosX + deltaX));
      const newY = Math.max(0, Math.min(100, startPosY + deltaY));
      
      onPositionChange(newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute flex items-center justify-center rounded-full cursor-grab font-bold text-white shadow-lg border-2 border-white transition-transform",
        sizeClasses[size],
        POSITION_COLORS[positionNumber] || 'bg-muted',
        isDragging && 'cursor-grabbing scale-110 z-50',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-transparent scale-110'
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {showNumber && positionNumber}
    </div>
  );
}
