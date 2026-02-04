import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamKit } from '@/types/game';
import { AICoach } from '@/types/coach';
import { generateAICoachesForTeam } from '@/data/coachGenerator';
import { Palette, Save, RotateCcw, Building2, Users } from 'lucide-react';
import { KitPreview } from '@/components/kit/KitPreview';
import { KitEditor } from '@/components/kit/KitEditor';
import { FacilitiesPanel } from '@/components/facilities/FacilitiesPanel';
import { ManagementStaffCard } from '@/components/coach/ManagementStaffCard';

const DEFAULT_KIT: TeamKit = {
  primary: '#1e3a5f',
  secondary: '#ffffff',
  accent: '#d4af37',
  pattern: 'solid',
  patternSize: 'medium',
  patternCount: 4,
  collarTrim: '#d4af37',
  cuffTrim: '#d4af37',
  shortsColor: '#1e3a5f',
  shortsTrim: '#ffffff',
  sockPrimary: '#1e3a5f',
  sockSecondary: '#ffffff',
  sockPattern: 'solid',
  sockHoopCount: 2
};

export default function TeamSettings() {
  const { getMyTeam, updateKit, requestFacilityUpgrade } = useGame();
  const { user } = useAuth();
  const team = getMyTeam();
  
  const [kit, setKit] = useState<TeamKit>(team?.kit || DEFAULT_KIT);
  const [hasChanges, setHasChanges] = useState(false);
  const [managementStaff, setManagementStaff] = useState<AICoach[]>([]);

  useEffect(() => {
    if (team) {
      fetchManagementStaff();
    }
  }, [team, user]);

  const fetchManagementStaff = async () => {
    if (!team) return;
    
    if (user) {
      // Try to fetch from database
      const { data } = await supabase
        .from('ai_coaches')
        .select('*')
        .eq('team_id', team.id);
      
      if (data && data.length > 0) {
        setManagementStaff(data as AICoach[]);
        return;
      }
    }
    
    // Generate locally if not in database
    const localCoaches = generateAICoachesForTeam(team.id, team.reputation);
    setManagementStaff(localCoaches);
  };

  useEffect(() => {
    if (team?.kit) {
      // Merge with defaults to handle any missing properties from older saves
      setKit({ ...DEFAULT_KIT, ...team.kit });
      setHasChanges(false);
    }
  }, [team?.kit]);

  const handleKitChange = (newKit: TeamKit) => {
    setKit(newKit);
    setHasChanges(true);
  };

  const handleSave = () => {
    updateKit(kit);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (team?.kit) {
      setKit({ ...DEFAULT_KIT, ...team.kit });
      setHasChanges(false);
    }
  };

  if (!team) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{team.name}</h1>
        <p className="text-muted-foreground">Team Settings & Facilities</p>
      </div>

      <Tabs defaultValue="kit">
        <TabsList>
          <TabsTrigger value="kit">
            <Palette className="h-4 w-4 mr-2" />
            Kit Designer
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Users className="h-4 w-4 mr-2" />
            Management
          </TabsTrigger>
          <TabsTrigger value="facilities">
            <Building2 className="h-4 w-4 mr-2" />
            Facilities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kit" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Kit Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Kit Designer
                </CardTitle>
                <CardDescription>Customize your team's kit with colors, patterns, and trims</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <KitEditor kit={kit} onChange={handleKitChange} />

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button onClick={handleSave} disabled={!hasChanges} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Kit
                  </Button>
                  <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Kit Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>See how your full kit will look on match day</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <KitPreview kit={kit} size="lg" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="facilities" className="mt-6">
          <FacilitiesPanel
            facilities={team.facilities}
            teamReputation={team.reputation}
            onRequestUpgrade={requestFacilityUpgrade}
          />
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          {managementStaff.length > 0 ? (
            <ManagementStaffCard coaches={managementStaff} teamName={team.name} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading management staff...
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
