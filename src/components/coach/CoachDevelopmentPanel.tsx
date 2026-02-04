import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Zap, Shield, Target, Users, Activity, Trophy, Wind, Globe, 
  Medal, GraduationCap, Brain, LineChart, Crown, Calendar, TrendingDown,
  Dumbbell, Star, Lock, CheckCircle2, Clock, Coins, Swords
} from 'lucide-react';
import { 
  CoachDevelopmentState, 
  CoachSkills, 
  SKILL_LABELS, 
  SKILL_CATEGORIES,
  calculateLevel,
  DevelopmentActivity
} from '@/types/coachDevelopment';
import { 
  DEVELOPMENT_ACTIVITIES, 
  getAvailableActivities, 
  getActivitiesByCategory,
  CATEGORY_LABELS,
  getActivityById
} from '@/data/coachDevelopmentData';

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, Zap, Shield, Target, Users, Activity, Trophy, Wind, Globe,
  Medal, GraduationCap, Brain, LineChart, Crown, Calendar, TrendingDown,
  Dumbbell, Swords
};

interface CoachDevelopmentPanelProps {
  developmentState: CoachDevelopmentState;
  currentWeek: number;
  currentSeason: number;
  budget: number;
  onStartActivity: (activity: DevelopmentActivity) => void;
  onCancelActivity: () => void;
}

export function CoachDevelopmentPanel({
  developmentState,
  currentWeek,
  currentSeason,
  budget,
  onStartActivity,
  onCancelActivity
}: CoachDevelopmentPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('seminar');
  
  const { skills, totalXP, completedActivities, activeActivity } = developmentState;
  const { level, xpToNext, xpProgress } = calculateLevel(totalXP);
  const xpForCurrentLevel = xpProgress + xpToNext;
  const levelProgress = (xpProgress / xpForCurrentLevel) * 100;

  const availableActivities = getAvailableActivities(level, skills as unknown as Record<string, number>, completedActivities);
  const categoryActivities = getActivitiesByCategory(selectedCategory);

  const getWeeksRemaining = (): number => {
    if (!activeActivity) return 0;
    const activity = getActivityById(activeActivity.activityId);
    if (!activity) return 0;
    
    // Calculate weeks remaining based on current week/season
    const totalWeeksElapsed = (currentSeason - activeActivity.startedSeason) * 26 + (currentWeek - activeActivity.startedWeek);
    return Math.max(0, activity.duration - totalWeeksElapsed);
  };

  const renderSkillBar = (skillKey: keyof CoachSkills) => {
    const value = skills[skillKey];
    const label = SKILL_LABELS[skillKey];
    
    return (
      <div key={skillKey} className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
        <Progress value={value} className="h-2" />
      </div>
    );
  };

  const renderActivityCard = (activity: DevelopmentActivity) => {
    const IconComponent = ICON_MAP[activity.icon] || BookOpen;
    const isAvailable = availableActivities.some(a => a.id === activity.id);
    const isCompleted = completedActivities.includes(activity.id);
    const isActive = activeActivity?.activityId === activity.id;
    const canAfford = budget >= activity.cost;

    return (
      <Card 
        key={activity.id} 
        className={`transition-all ${isActive ? 'ring-2 ring-primary' : ''} ${!isAvailable && !isCompleted ? 'opacity-60' : ''}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isCompleted ? 'bg-accent' : 'bg-primary/10'}`}>
                <IconComponent className={`h-5 w-5 ${isCompleted ? 'text-accent-foreground' : 'text-primary'}`} />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {activity.name}
                  {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {!isAvailable && !isCompleted && <Lock className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {activity.duration > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.duration} week{activity.duration !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {activity.cost > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Coins className="h-3 w-3 mr-1" />
                      ${activity.cost.toLocaleString()}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    +{activity.xpReward} XP
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <CardDescription>{activity.description}</CardDescription>
          
          {Object.keys(activity.skillBoosts).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(activity.skillBoosts).map(([skill, boost]) => (
                <Badge key={skill} variant="outline" className="text-xs text-primary border-primary/30">
                  +{boost} {SKILL_LABELS[skill as keyof CoachSkills]}
                </Badge>
              ))}
            </div>
          )}

          {activity.requirements && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Requirements: </span>
              {activity.requirements.minLevel && `Level ${activity.requirements.minLevel}`}
              {activity.requirements.minSkill && Object.entries(activity.requirements.minSkill).map(([skill, val]) => 
                `, ${SKILL_LABELS[skill as keyof CoachSkills]} ${val}+`
              )}
            </div>
          )}

          {isActive ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary font-medium">In Progress</span>
                <span>{getWeeksRemaining()} week{getWeeksRemaining() !== 1 ? 's' : ''} remaining</span>
              </div>
              <Button variant="outline" size="sm" onClick={onCancelActivity} className="w-full">
                Cancel Activity
              </Button>
            </div>
          ) : isCompleted && !activity.repeatable ? (
            <Badge className="w-full justify-center" variant="secondary">Completed</Badge>
          ) : (
            <Button 
              size="sm" 
              className="w-full" 
              disabled={!isAvailable || !canAfford || !!activeActivity}
              onClick={() => onStartActivity(activity)}
            >
              {!canAfford ? 'Insufficient Funds' : activeActivity ? 'Activity in Progress' : 'Start Activity'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Level & XP Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Coach Development
          </CardTitle>
          <CardDescription>Improve your coaching skills through experience and education</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-bold">Level {level}</span>
              <p className="text-sm text-muted-foreground">{totalXP.toLocaleString()} total XP</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium">{xpProgress} / {xpForCurrentLevel} XP</span>
              <p className="text-xs text-muted-foreground">to Level {level + 1}</p>
            </div>
          </div>
          <Progress value={levelProgress} className="h-3" />

          {activeActivity && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  Currently: {getActivityById(activeActivity.activityId)?.name}
                </span>
                <Badge variant="outline" className="ml-auto">
                  {getWeeksRemaining()} weeks left
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skills Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="core">
            <TabsList className="mb-4">
              <TabsTrigger value="core">Core</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="mental">Mental</TabsTrigger>
            </TabsList>
            <TabsContent value="core" className="space-y-3">
              {SKILL_CATEGORIES.core.map(renderSkillBar)}
            </TabsContent>
            <TabsContent value="technical" className="space-y-3">
              {SKILL_CATEGORIES.technical.map(renderSkillBar)}
            </TabsContent>
            <TabsContent value="mental" className="space-y-3">
              {SKILL_CATEGORIES.mental.map(renderSkillBar)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Development Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Development Activities</CardTitle>
          <CardDescription>
            Available budget: <span className="font-semibold text-foreground">${budget.toLocaleString()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="mb-4 w-full justify-start">
              <TabsTrigger value="seminar">Seminars</TabsTrigger>
              <TabsTrigger value="cross_training">Cross-Training</TabsTrigger>
              <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
            </TabsList>

            {['seminar', 'cross_training', 'mentorship'].map(category => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="mb-4">
                  <h3 className="font-medium">{CATEGORY_LABELS[category].label}</h3>
                  <p className="text-sm text-muted-foreground">{CATEGORY_LABELS[category].description}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {getActivitiesByCategory(category).map(renderActivityCard)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Activity History */}
      {developmentState.activityHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {developmentState.activityHistory.slice(-5).reverse().map((entry, idx) => {
                const activity = getActivityById(entry.activityId);
                if (!activity) return null;
                const IconComponent = ICON_MAP[activity.icon] || BookOpen;
                
                return (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{activity.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Week {entry.completedWeek}, S{entry.completedSeason}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        +{entry.xpGained} XP
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
