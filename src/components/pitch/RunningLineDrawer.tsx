import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { RunningLine } from '@/types/game';

interface RunningLineDrawerProps {
  lines: RunningLine[];
  onLineAdd: (line: Omit<RunningLine, 'id'>) => void;
  onLineUpdate: (id: string, points: { x: number; y: number }[]) => void;
  onLineDelete: (id: string) => void;
  selectedPlayerId?: string;
  currentPhase: number;
  isDrawing: boolean;
  lineType: 'run' | 'pass' | 'kick';
}

const LINE_COLORS: Record<string, string> = {
  run: '#22c55e',
  pass: '#3b82f6',
  kick: '#eab308'
};

export function RunningLineDrawer({
  lines,
  onLineAdd,
  onLineUpdate,
  onLineDelete,
  selectedPlayerId,
  currentPhase,
  isDrawing,
  lineType
}: RunningLineDrawerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [isCurrentlyDrawing, setIsCurrentlyDrawing] = useState(false);

  const getRelativeCoords = useCallback((e: React.MouseEvent): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing || !selectedPlayerId) return;
    const coords = getRelativeCoords(e);
    if (!coords) return;
    
    setIsCurrentlyDrawing(true);
    setCurrentPoints([coords]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isCurrentlyDrawing) return;
    const coords = getRelativeCoords(e);
    if (!coords) return;
    
    // Add point if moved enough distance
    const lastPoint = currentPoints[currentPoints.length - 1];
    const distance = Math.sqrt(
      Math.pow(coords.x - lastPoint.x, 2) + Math.pow(coords.y - lastPoint.y, 2)
    );
    
    if (distance > 2) {
      setCurrentPoints(prev => [...prev, coords]);
    }
  };

  const handleMouseUp = () => {
    if (!isCurrentlyDrawing || !selectedPlayerId || currentPoints.length < 2) {
      setIsCurrentlyDrawing(false);
      setCurrentPoints([]);
      return;
    }
    
    onLineAdd({
      playerId: selectedPlayerId,
      phase: currentPhase,
      points: currentPoints,
      lineType
    });
    
    setIsCurrentlyDrawing(false);
    setCurrentPoints([]);
  };

  const renderLine = (points: { x: number; y: number }[], color: string, isDashed: boolean = false) => {
    if (points.length < 2) return null;
    
    const pathData = points.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      
      // Create smooth curves
      const prev = points[i - 1];
      const midX = (prev.x + point.x) / 2;
      const midY = (prev.y + point.y) / 2;
      return `${acc} Q ${prev.x} ${prev.y} ${midX} ${midY}`;
    }, '');
    
    const lastPoint = points[points.length - 1];
    const secondLastPoint = points[points.length - 2];
    const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x);
    
    return (
      <g>
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={isDashed ? "3,2" : undefined}
        />
        {/* Arrow head */}
        <polygon
          points={`
            ${lastPoint.x},${lastPoint.y}
            ${lastPoint.x - 3 * Math.cos(angle - Math.PI / 6)},${lastPoint.y - 3 * Math.sin(angle - Math.PI / 6)}
            ${lastPoint.x - 3 * Math.cos(angle + Math.PI / 6)},${lastPoint.y - 3 * Math.sin(angle + Math.PI / 6)}
          `}
          fill={color}
        />
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 70"
      className={cn(
        "absolute inset-0 w-full h-full",
        isDrawing && selectedPlayerId ? "cursor-crosshair" : "pointer-events-none"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Existing lines */}
      {lines.filter(l => l.phase === currentPhase).map(line => (
        <g key={line.id} className="group">
          {renderLine(line.points, LINE_COLORS[line.lineType])}
          {/* Delete button on hover */}
          <circle
            cx={line.points[0]?.x}
            cy={line.points[0]?.y}
            r="2"
            fill="red"
            className="opacity-0 group-hover:opacity-100 cursor-pointer pointer-events-auto"
            onClick={() => onLineDelete(line.id)}
          />
        </g>
      ))}
      
      {/* Current drawing */}
      {isCurrentlyDrawing && currentPoints.length > 1 && (
        renderLine(currentPoints, LINE_COLORS[lineType], true)
      )}
    </svg>
  );
}
