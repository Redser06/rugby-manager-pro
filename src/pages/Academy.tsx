import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GraduationCap, Users, Search, Star, MapPin, Handshake, 
  Brain, Dumbbell, Target, Heart, ArrowUpRight, Eye, EyeOff,
  Sparkles, School, Building
} from 'lucide-react';
import { toast } from 'sonner';
import {
  FeederClub, AcademyProspect, REGIONAL_DEMOGRAPHICS,
  generateFeedersForTeam, generateAnnualIntake, generateAcademyProspect,
  applyCoachSession, shouldRevealPotential, promoteToFirstTeam,
} from '@/engine/academy';

export default function Academy() {
  const { getMyTeam } = useGame();
  const team = getMyTeam();

  const [feeders, setFeeders] = useState<FeederClub[]>([]);
  const [prospects, setProspects] = useState<AcademyProspect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<AcademyProspect | null>(null);

  useEffect(() => {
    if (team) {
      const generated = generateFeedersForTeam(team.country, team.facilities.academy.reputation);
      setFeeders(generated);
      const intake = generateAnnualIntake(team.country, team.facilities.academy, generated);
      setProspects(intake);
    }
  }, [team?.id]);

  if (!team) return null;

  const academy = team.facilities.academy;
  const demographics = REGIONAL_DEMOGRAPHICS.filter(d => d.country === team.country);
  const analyst = team.staff?.find(s => s.role === 'analyst');

  const handleCoachSession = (prospectId: string, sessionType: 'skills' | 'mentoring' | 'physical' | 'tactical' | 'psychology') => {
    setProspects(prev => prev.map(p => {
      if (p.id !== prospectId) return p;
      const updated = applyCoachSession(p, sessionType, academy.coachingQuality * 20);
      setSelectedProspect(updated);
      return updated;
    }));
    toast.success(`Session completed`);
  };

  const handleRevealPotential = (prospectId: string) => {
    const scoutQuality = analyst?.quality || 0;
    setProspects(prev => prev.map(p => {
      if (p.id !== prospectId) return p;
      if (shouldRevealPotential(p.yearsInAcademy * 5, !!analyst, scoutQuality) || analyst) {
        const updated = { ...p, potentialRevealed: true };
        setSelectedProspect(updated);
        toast.success(`Potential revealed for ${p.firstName} ${p.lastName}: ${p.potentialCeiling}`);
        return updated;
      } else {
        toast.error('Need more data or a better analyst to reveal potential');
        return p;
      }
    }));
  };

  const handlePromote = (prospectId: string) => {
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) return;
    if (!prospect.readyForFirstTeam && prospect.currentAbility < 50) {
      toast.error(`${prospect.firstName} isn't ready for first-team rugby yet`);
      return;
    }
    toast.success(`${prospect.firstName} ${prospect.lastName} promoted to first team!`);
    setProspects(prev => prev.filter(p => p.id !== prospectId));
    setSelectedProspect(null);
  };

  const handleNewIntake = () => {
    const intake = generateAnnualIntake(team.country, academy, feeders);
    setProspects(prev => [...intake, ...prev]);
    toast.success(`${intake.length} new prospects joined the academy`);
  };

  const starIcons = (count: number) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`h-3 w-3 ${i < count ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`} />
  ));

  const attitudeColor = (att: string) => att === 'excellent' ? 'default' : att === 'good' ? 'secondary' : att === 'poor' ? 'destructive' : 'outline';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GraduationCap className="h-8 w-8" />
          {team.name} Academy
        </h1>
        <p className="text-muted-foreground">Youth development, feeder system, and talent pipeline</p>
      </div>

      {/* Academy overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Overall', value: academy.overallRating, icon: <Star className="h-4 w-4" /> },
          { label: 'Scouting', value: academy.scoutingNetwork, icon: <Search className="h-4 w-4" /> },
          { label: 'Coaching', value: academy.coachingQuality, icon: <Users className="h-4 w-4" /> },
          { label: 'Facilities', value: academy.youthFacilities, icon: <Building className="h-4 w-4" /> },
          { label: 'Pathway', value: academy.pathwayToFirstTeam, icon: <ArrowUpRight className="h-4 w-4" /> },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">{item.icon}<span className="text-xs text-muted-foreground">{item.label}</span></div>
              <div className="flex justify-center">{starIcons(item.value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="prospects">
        <TabsList>
          <TabsTrigger value="prospects"><Users className="h-4 w-4 mr-1" /> Prospects ({prospects.length})</TabsTrigger>
          <TabsTrigger value="feeders"><School className="h-4 w-4 mr-1" /> Feeder System</TabsTrigger>
          <TabsTrigger value="demographics"><MapPin className="h-4 w-4 mr-1" /> Demographics</TabsTrigger>
        </TabsList>

        {/* PROSPECTS TAB */}
        <TabsContent value="prospects">
          <div className="flex gap-2 mb-4">
            <Button size="sm" onClick={handleNewIntake}>
              <GraduationCap className="h-4 w-4 mr-1" /> Generate New Intake
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Prospect list */}
            <div className="lg:col-span-2 space-y-2">
              {prospects.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProspect(p)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedProspect?.id === p.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50 hover:bg-muted/80'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{p.firstName} {p.lastName}</span>
                      {p.isGenerationalTalent && p.potentialRevealed && (
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                      )}
                      <Badge variant="outline" className="text-xs">{p.position}</Badge>
                      <span className="text-xs text-muted-foreground">Age {p.age}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">{starIcons(p.starRating)}</div>
                      <span className="text-xs text-muted-foreground">OVR: {p.currentAbility}</span>
                      {p.potentialRevealed ? (
                        <span className="text-xs font-medium text-primary">POT: {p.potentialCeiling}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5"><EyeOff className="h-3 w-3" /> Hidden</span>
                      )}
                      <Badge variant={attitudeColor(p.attitude)} className="text-xs">{p.attitude}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      From: {p.feederSource} • {p.yearsInAcademy}yr in academy
                    </div>
                  </div>
                  {p.readyForFirstTeam && (
                    <Badge className="text-xs bg-green-600">Ready</Badge>
                  )}
                </div>
              ))}
              {prospects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No prospects in academy. Generate an intake to start.</p>
              )}
            </div>

            {/* Prospect detail panel */}
            <div>
              {selectedProspect ? (
                <Card className="sticky top-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {selectedProspect.firstName} {selectedProspect.lastName}
                      {selectedProspect.isGenerationalTalent && selectedProspect.potentialRevealed && (
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription>{selectedProspect.position} • Age {selectedProspect.age}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Ratings */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Ability</span>
                        <span className="font-medium">{selectedProspect.currentAbility}</span>
                      </div>
                      <Progress value={selectedProspect.currentAbility} className="h-2" />

                      {selectedProspect.potentialRevealed ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Potential Ceiling</span>
                            <span className="font-medium text-primary">{selectedProspect.potentialCeiling}</span>
                          </div>
                          <Progress value={selectedProspect.potentialCeiling} className="h-2" />
                        </>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => handleRevealPotential(selectedProspect.id)}>
                          <Eye className="h-4 w-4 mr-1" /> Reveal Potential
                        </Button>
                      )}
                    </div>

                    {/* Attributes */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Physical</span>
                        <Progress value={selectedProspect.physicalMaturity} className="h-1.5 mt-1" />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Coachability</span>
                        <Progress value={selectedProspect.coachability} className="h-1.5 mt-1" />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Resilience</span>
                        <Progress value={selectedProspect.resilience} className="h-1.5 mt-1" />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Coach Attention</span>
                        <Progress value={selectedProspect.coachAttention} className="h-1.5 mt-1" />
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Dev Rate: {selectedProspect.developmentRate.toFixed(2)}x
                      {selectedProspect.lastCoachSession && (
                        <div className="mt-1 italic">Last session: {selectedProspect.lastCoachSession}</div>
                      )}
                    </div>

                    {/* Coach sessions */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium">Coach Sessions</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([
                          { type: 'skills' as const, label: 'Skills', icon: <Target className="h-3 w-3" /> },
                          { type: 'mentoring' as const, label: 'Mentoring', icon: <Heart className="h-3 w-3" /> },
                          { type: 'physical' as const, label: 'Physical', icon: <Dumbbell className="h-3 w-3" /> },
                          { type: 'tactical' as const, label: 'Tactical', icon: <Brain className="h-3 w-3" /> },
                          { type: 'psychology' as const, label: 'Psychology', icon: <Heart className="h-3 w-3" /> },
                        ]).map(s => (
                          <Button
                            key={s.type}
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => handleCoachSession(selectedProspect.id, s.type)}
                          >
                            {s.icon} {s.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Promote */}
                    <Button
                      className="w-full"
                      size="sm"
                      disabled={!selectedProspect.readyForFirstTeam && selectedProspect.currentAbility < 50}
                      onClick={() => handlePromote(selectedProspect.id)}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1" /> Promote to First Team
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground text-sm">
                    Select a prospect to view details and run coaching sessions
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* FEEDERS TAB */}
        <TabsContent value="feeders">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feeders.map(f => (
              <Card key={f.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4" />
                        <span className="font-medium">{f.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-xs mr-2">{f.type}</Badge>
                        {f.region}
                      </div>
                    </div>
                    <Badge variant="secondary">{f.quality} quality</Badge>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Relationship</span>
                      <span>{f.relationship}%</span>
                    </div>
                    <Progress value={f.relationship} className="h-1.5" />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Youth Population</span>
                      <span>{f.youthPopulation}/100</span>
                    </div>
                    <Progress value={f.youthPopulation} className="h-1.5" />
                  </div>
                  {f.speciality && (
                    <p className="text-xs text-muted-foreground mt-2">Specialises in: {f.speciality}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* DEMOGRAPHICS TAB */}
        <TabsContent value="demographics">
          <div className="space-y-3">
            {demographics.map(d => (
              <Card key={d.region}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">{d.region}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{d.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Rugby Population</span>
                      <Progress value={d.rugbyPopulation} className="h-1.5 mt-1" />
                      <span className="text-xs">{d.rugbyPopulation}/100</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Competition Level</span>
                      <Progress value={d.competitionLevel} className="h-1.5 mt-1" />
                      <span className="text-xs">{d.competitionLevel}/100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {demographics.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No regional data available for {team.country}</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
