import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw,
  Video,
  X
} from 'lucide-react';
import { ReplayScene } from './ReplayScene';
import { ReplayEvent, ReplayMatch, ReplayKeyframe } from '@/types/replay';

interface ReplayViewerProps {
  match: ReplayMatch;
  onClose: () => void;
}

export function ReplayViewer({ match, onClose }: ReplayViewerProps) {
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const currentEvent = match.events[selectedEventIndex];
  
  // Find current and next keyframes based on playback time
  const getKeyframes = useCallback((): { 
    current: ReplayKeyframe; 
    next?: ReplayKeyframe; 
    interpolation: number;
  } => {
    if (!currentEvent || currentEvent.keyframes.length === 0) {
      return { 
        current: { 
          time: 0, 
          players: { home: [], away: [] }, 
          ball: { position: { x: 0, y: 0, z: 0 }, inPlay: false } 
        }, 
        interpolation: 0 
      };
    }
    
    const normalizedTime = playbackTime / currentEvent.duration;
    
    // Find the keyframe pair we're between
    let currentIdx = 0;
    for (let i = 0; i < currentEvent.keyframes.length - 1; i++) {
      if (normalizedTime >= currentEvent.keyframes[i].time && 
          normalizedTime < currentEvent.keyframes[i + 1].time) {
        currentIdx = i;
        break;
      }
      if (i === currentEvent.keyframes.length - 2) {
        currentIdx = i;
      }
    }
    
    const current = currentEvent.keyframes[currentIdx];
    const next = currentEvent.keyframes[currentIdx + 1];
    
    if (!next) {
      return { current, interpolation: 0 };
    }
    
    // Calculate interpolation between these keyframes
    const segmentStart = current.time;
    const segmentEnd = next.time;
    const segmentProgress = (normalizedTime - segmentStart) / (segmentEnd - segmentStart);
    
    return { 
      current, 
      next, 
      interpolation: Math.max(0, Math.min(1, segmentProgress)) 
    };
  }, [currentEvent, playbackTime]);
  
  // Playback animation loop
  useEffect(() => {
    if (!isPlaying || !currentEvent) return;
    
    const interval = setInterval(() => {
      setPlaybackTime(prev => {
        const next = prev + (0.016 * playbackSpeed);
        if (next >= currentEvent.duration) {
          setIsPlaying(false);
          return currentEvent.duration;
        }
        return next;
      });
    }, 16);
    
    return () => clearInterval(interval);
  }, [isPlaying, currentEvent, playbackSpeed]);
  
  const selectEvent = (index: number) => {
    setSelectedEventIndex(index);
    setPlaybackTime(0);
    setIsPlaying(false);
  };
  
  const togglePlayback = () => {
    if (playbackTime >= currentEvent?.duration) {
      setPlaybackTime(0);
    }
    setIsPlaying(!isPlaying);
  };
  
  const restart = () => {
    setPlaybackTime(0);
    setIsPlaying(false);
  };
  
  const skipToPrev = () => {
    if (selectedEventIndex > 0) {
      selectEvent(selectedEventIndex - 1);
    }
  };
  
  const skipToNext = () => {
    if (selectedEventIndex < match.events.length - 1) {
      selectEvent(selectedEventIndex + 1);
    }
  };
  
  const { current, next, interpolation } = getKeyframes();
  
  const getEventBadgeVariant = (type: ReplayEvent['type']) => {
    switch (type) {
      case 'try': return 'default';
      case 'conversion':
      case 'penalty_kick': return 'secondary';
      case 'scrum':
      case 'lineout': return 'outline';
      case 'tackle':
      case 'turnover': return 'destructive';
      default: return 'outline';
    }
  };
  
  return (
    <Card className="border-primary">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-primary" />
          <CardTitle>Match Replay</CardTitle>
          <Badge variant="outline">
            {match.homeTeam.shortName} {match.homeScore} - {match.awayScore} {match.awayTeam.shortName}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 3D Scene */}
        <ReplayScene
          match={match}
          currentKeyframe={current}
          nextKeyframe={next}
          interpolation={interpolation}
        />
        
        {/* Playback Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={skipToPrev} disabled={selectedEventIndex === 0}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={restart}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={togglePlayback}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={skipToNext} disabled={selectedEventIndex === match.events.length - 1}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Timeline slider */}
          <div className="flex-1 flex items-center gap-3">
            <Slider
              value={[playbackTime]}
              min={0}
              max={currentEvent?.duration || 1}
              step={0.01}
              onValueChange={([value]) => {
                setPlaybackTime(value);
                setIsPlaying(false);
              }}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-16">
              {playbackTime.toFixed(1)}s / {currentEvent?.duration || 0}s
            </span>
          </div>
          
          {/* Speed control */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Speed:</span>
            {[0.5, 1, 2].map(speed => (
              <Button
                key={speed}
                variant={playbackSpeed === speed ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlaybackSpeed(speed)}
              >
                {speed}x
              </Button>
            ))}
          </div>
        </div>
        
        {/* Current Event Info */}
        {currentEvent && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Badge variant={getEventBadgeVariant(currentEvent.type)}>
                {currentEvent.type.replace('_', ' ')}
              </Badge>
              <Badge variant="outline">{currentEvent.matchMinute}'</Badge>
              <span className="font-medium">{currentEvent.description}</span>
              {currentEvent.scorerName && (
                <Badge variant="secondary">{currentEvent.scorerName}</Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Event List */}
        <div>
          <h4 className="text-sm font-medium mb-2">Key Events</h4>
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {match.events.map((event, index) => (
                <button
                  key={event.id}
                  onClick={() => selectEvent(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    index === selectedEventIndex 
                      ? 'bg-primary/20 border border-primary' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-10 justify-center">
                      {event.matchMinute}'
                    </Badge>
                    <Badge variant={getEventBadgeVariant(event.type)}>
                      {event.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm flex-1 truncate">{event.description}</span>
                    <Badge variant="outline">
                      {event.team === 'home' ? match.homeTeam.shortName : match.awayTeam.shortName}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
