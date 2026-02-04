import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/contexts/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { CoachProfileForm } from '@/components/coach/CoachProfileForm';
import { GameSaveSlots } from '@/components/saves/GameSaveSlots';
import { CoachDevelopmentPanel } from '@/components/coach/CoachDevelopmentPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CoachProfile } from '@/types/coach';
import { CoachDevelopmentState, getDefaultCoachSkills, DevelopmentActivity } from '@/types/coachDevelopment';
import { Json } from '@/integrations/supabase/types';
import { User, Save, LogOut, Loader2, Edit, GraduationCap } from 'lucide-react';

export default function CoachManager() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { gameState, loadGameState } = useGame();
  const { toast } = useToast();

  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Coach development state - stored in localStorage
  const [developmentState, setDevelopmentState] = useState<CoachDevelopmentState>(() => {
    const saved = localStorage.getItem('coachDevelopment');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const team = gameState.selectedTeam;
  const coachingBudget = 50000; // Available budget for development activities

  // Initialize development state when profile is loaded
  useEffect(() => {
    if (profile && !developmentState) {
      const initialSkills = getDefaultCoachSkills(profile.experience_level, profile.specialization);
      const initialState: CoachDevelopmentState = {
        skills: initialSkills,
        totalXP: 0,
        currentLevel: 1,
        xpToNextLevel: 100,
        completedActivities: [],
        activeActivity: null,
        activityHistory: []
      };
      setDevelopmentState(initialState);
    }
  }, [profile, developmentState]);

  // Persist development state
  useEffect(() => {
    if (developmentState) {
      localStorage.setItem('coachDevelopment', JSON.stringify(developmentState));
    }
  }, [developmentState]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load profile'
      });
    }

    setProfile(data as CoachProfile | null);
    setLoading(false);
  };

  const handleCreateProfile = async (data: Omit<CoachProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('coach_profiles')
      .insert({
        ...data,
        user_id: user.id,
        team_id: team?.id
      });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } else {
      toast({
        title: 'Profile Created!',
        description: `Welcome, Coach ${data.last_name}!`
      });
      fetchProfile();
      setIsEditing(false);
    }

    setSaving(false);
  };

  const handleUpdateProfile = async (data: Omit<CoachProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !profile) return;
    setSaving(true);

    const { error } = await supabase
      .from('coach_profiles')
      .update({
        ...data,
        team_id: team?.id
      })
      .eq('id', profile.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    } else {
      toast({
        title: 'Profile Updated!',
        description: 'Your changes have been saved.'
      });
      fetchProfile();
      setIsEditing(false);
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleLoadGame = (gameStateJson: Json) => {
    try {
      loadGameState(gameStateJson as unknown as typeof gameState);
      toast({
        title: 'Game Loaded!',
        description: 'Your saved progress has been restored.'
      });
      navigate('/dashboard');
    } catch {
      toast({
        variant: 'destructive',
        title: 'Load Failed',
        description: 'Could not load the saved game.'
      });
    }
  };

  const handleStartActivity = (activity: DevelopmentActivity) => {
    if (!developmentState) return;
    
    setDevelopmentState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        activeActivity: {
          activityId: activity.id,
          startedWeek: gameState.currentWeek,
          startedSeason: gameState.currentSeason,
          completionWeek: gameState.currentWeek + activity.duration,
          completionSeason: gameState.currentSeason
        }
      };
    });
    
    toast({
      title: 'Activity Started!',
      description: `You've enrolled in ${activity.name}.`
    });
  };

  const handleCancelActivity = () => {
    if (!developmentState?.activeActivity) return;
    
    setDevelopmentState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        activeActivity: null
      };
    });
    
    toast({
      title: 'Activity Cancelled',
      description: 'Your current development activity has been cancelled.'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Coach Manager</h1>
            <p className="text-muted-foreground">
              {user.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue={profile && !isEditing ? 'development' : 'profile'}>
          <TabsList>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="development" disabled={!profile}>
              <GraduationCap className="h-4 w-4 mr-2" />
              Development
            </TabsTrigger>
            <TabsTrigger value="saves" disabled={!profile}>
              <Save className="h-4 w-4 mr-2" />
              Save Games
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            {!profile || isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {profile ? 'Edit Your Coach' : 'Create Your Coach'}
                  </h2>
                  {profile && (
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
                <CoachProfileForm
                  initialData={profile || undefined}
                  onSubmit={profile ? handleUpdateProfile : handleCreateProfile}
                  isLoading={saving}
                  submitLabel={profile ? 'Save Changes' : 'Create Profile'}
                />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Coach {profile.first_name} {profile.last_name}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </CardTitle>
                  <CardDescription>Your coaching profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Nationality</span>
                      <p className="font-medium">{profile.nationality}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Experience</span>
                      <p className="font-medium capitalize">{profile.experience_level.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Specialization</span>
                      <p className="font-medium capitalize">{profile.specialization.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Current Team</span>
                      <p className="font-medium">{team?.name || 'No team selected'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="development" className="mt-6">
            {developmentState && (
              <CoachDevelopmentPanel
                developmentState={developmentState}
                currentWeek={gameState.currentWeek}
                currentSeason={gameState.currentSeason}
                budget={coachingBudget}
                onStartActivity={handleStartActivity}
                onCancelActivity={handleCancelActivity}
              />
            )}
          </TabsContent>

          <TabsContent value="saves" className="mt-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Save Games</h2>
                <p className="text-sm text-muted-foreground">
                  Save your progress or load a previous game
                </p>
              </div>
              <GameSaveSlots
                currentGameState={gameState as unknown as Json}
                currentWeek={gameState.currentWeek}
                currentSeason={gameState.currentSeason}
                teamName={team?.name}
                coachProfileId={profile?.id}
                onLoadGame={handleLoadGame}
              />
            </div>
          </TabsContent>
        </Tabs>

        {!team && profile && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Ready to Start?</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a team to begin your coaching career
                  </p>
                </div>
                <Button onClick={() => navigate('/')}>
                  Choose Team
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
