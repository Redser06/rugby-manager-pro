import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Fixture, SeasonSchedule } from '@/types/fixture';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning,
  Sun,
  CloudFog,
  Snowflake,
  Plane,
  Home,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface FixturesListProps {
  schedule: SeasonSchedule;
  teamId: string;
  currentWeek: number;
  onReschedule?: (fixtureId: string) => void;
}

const weatherIcons: Record<string, React.ReactNode> = {
  clear: <Sun className="h-4 w-4 text-yellow-500" />,
  cloudy: <Cloud className="h-4 w-4 text-muted-foreground" />,
  light_rain: <CloudRain className="h-4 w-4 text-blue-400" />,
  heavy_rain: <CloudRain className="h-4 w-4 text-blue-600" />,
  storm: <CloudLightning className="h-4 w-4 text-purple-500" />,
  snow: <CloudSnow className="h-4 w-4 text-blue-200" />,
  fog: <CloudFog className="h-4 w-4 text-muted-foreground" />,
  frozen_pitch: <Snowflake className="h-4 w-4 text-cyan-400" />,
};

function FixtureCard({ 
  fixture, 
  teamId, 
  isCurrentWeek,
  isPast 
}: { 
  fixture: Fixture; 
  teamId: string; 
  isCurrentWeek: boolean;
  isPast: boolean;
}) {
  const isHome = fixture.homeTeamId === teamId;
  const opponent = isHome ? fixture.awayTeamName : fixture.homeTeamName;
  
  const getStatusBadge = () => {
    switch (fixture.status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-primary/10">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'postponed':
        return <Badge variant="destructive">Postponed</Badge>;
      case 'rescheduled':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">Rescheduled</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Card className={`${isCurrentWeek ? 'border-primary ring-2 ring-primary/20' : ''} ${isPast ? 'opacity-70' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Match Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">Week {fixture.week}</Badge>
              {getStatusBadge()}
              {isCurrentWeek && <Badge>This Week</Badge>}
            </div>
            
            <div className="flex items-center gap-2 mb-1">
              {isHome ? (
                <Home className="h-4 w-4 text-primary" />
              ) : (
                <Plane className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">
                {isHome ? 'vs' : '@'} {opponent}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{fixture.venue}</span>
            </div>
            
            {/* Score if completed */}
            {fixture.status === 'completed' && fixture.homeScore !== undefined && (
              <div className="mt-2 text-lg font-bold">
                {fixture.homeTeamName} {fixture.homeScore} - {fixture.awayScore} {fixture.awayTeamName}
              </div>
            )}
            
            {/* Postponement reason */}
            {fixture.status === 'postponed' && fixture.postponementReason && (
              <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {fixture.postponementReason}
                {fixture.rescheduledWeek && (
                  <span className="text-muted-foreground">
                    → Rescheduled to Week {fixture.rescheduledWeek}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Weather & Travel */}
          <div className="text-right space-y-2">
            {/* Weather */}
            {fixture.weather && (
              <div className="flex items-center justify-end gap-2">
                {weatherIcons[fixture.weather.condition]}
                <span className="text-xs text-muted-foreground">
                  {fixture.weather.description}
                </span>
              </div>
            )}
            
            {/* Travel info for away games */}
            {!isHome && fixture.travel && (
              <div className="space-y-1">
                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                  <Plane className="h-3 w-3" />
                  {fixture.travel.distance} km
                </div>
                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {fixture.travel.travelTime}h travel
                </div>
                {fixture.travel.requiresOvernight && (
                  <Badge variant="outline" className="text-xs">
                    Overnight stay
                  </Badge>
                )}
                {fixture.travel.trainingRestriction && (
                  <Badge variant="destructive" className="text-xs">
                    No training day before
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FixturesList({ schedule, teamId, currentWeek, onReschedule }: FixturesListProps) {
  const [filter, setFilter] = useState<'all' | 'home' | 'away'>('all');
  
  // Get team's fixtures
  const teamFixtures = schedule.fixtures.filter(f => 
    f.homeTeamId === teamId || f.awayTeamId === teamId
  );
  
  // Apply filter
  const filteredFixtures = teamFixtures.filter(f => {
    if (filter === 'home') return f.homeTeamId === teamId;
    if (filter === 'away') return f.awayTeamId === teamId;
    return true;
  });
  
  // Split into upcoming and past
  const upcomingFixtures = filteredFixtures
    .filter(f => f.week >= currentWeek && f.status !== 'completed')
    .sort((a, b) => a.week - b.week);
    
  const pastFixtures = filteredFixtures
    .filter(f => f.week < currentWeek || f.status === 'completed')
    .sort((a, b) => b.week - a.week);
  
  // Stats
  const postponedCount = teamFixtures.filter(f => f.status === 'postponed').length;
  const awayWithTravel = teamFixtures.filter(f => 
    f.awayTeamId === teamId && f.travel?.trainingRestriction
  ).length;
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{teamFixtures.length}</p>
                <p className="text-xs text-muted-foreground">Total Fixtures</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {teamFixtures.filter(f => f.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{postponedCount}</p>
                <p className="text-xs text-muted-foreground">Postponed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{awayWithTravel}</p>
                <p className="text-xs text-muted-foreground">Away (Long Travel)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filter */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button 
          variant={filter === 'home' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('home')}
        >
          <Home className="h-4 w-4 mr-1" />
          Home
        </Button>
        <Button 
          variant={filter === 'away' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('away')}
        >
          <Plane className="h-4 w-4 mr-1" />
          Away
        </Button>
      </div>
      
      {/* Fixtures Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingFixtures.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastFixtures.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {upcomingFixtures.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No upcoming fixtures
                </p>
              ) : (
                upcomingFixtures.map(fixture => (
                  <FixtureCard
                    key={fixture.id}
                    fixture={fixture}
                    teamId={teamId}
                    isCurrentWeek={fixture.week === currentWeek}
                    isPast={false}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="past" className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {pastFixtures.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No past fixtures
                </p>
              ) : (
                pastFixtures.map(fixture => (
                  <FixtureCard
                    key={fixture.id}
                    fixture={fixture}
                    teamId={teamId}
                    isCurrentWeek={false}
                    isPast={true}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
