import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  StaffMember, StaffRole, STAFF_ROLE_INFO, CoachingPhilosophy, 
  COACHING_PHILOSOPHIES, calculateStaffBonuses,
} from '@/types/staff';
import { generateStaffCandidate } from '@/data/staffGenerator';
import { Team } from '@/types/game';
import { generateDetailedScoutingReport, DetailedScoutingReport, DEFENSIVE_FOCUS_PRESETS, DefensiveFocusArea } from '@/engine/scouting';
import { Users, Plus, X, Brain, Search, BarChart3, Shield, Swords, Target, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useGame } from '@/contexts/GameContext';

interface StaffManagementPanelProps {
  team: Team;
  onUpdateStaff: (staff: StaffMember[]) => void;
  onUpdatePhilosophy: (philosophy: CoachingPhilosophy) => void;
}

export function StaffManagementPanel({ team, onUpdateStaff, onUpdatePhilosophy }: StaffManagementPanelProps) {
  const staff = team.staff || [];
  const philosophy = team.coachingPhilosophy || 'structured';
  const bonuses = calculateStaffBonuses(staff);
  
  const [candidates, setCandidates] = useState<StaffMember[]>([]);
  const [searchingRole, setSearchingRole] = useState<StaffRole | null>(null);
  const [scoutingReports, setScoutingReports] = useState<DetailedScoutingReport[]>([]);
  const [defensiveFocus, setDefensiveFocus] = useState<DefensiveFocusArea[]>([]);
  const [scoutTarget, setScoutTarget] = useState<string>('');
  const { gameState } = useGame();

  // Get all teams in the league for scouting targets
  const leagueTeams = gameState.leagues
    .flatMap(l => l.teams)
    .filter(t => t.id !== team.id);

  const handleHire = (candidate: StaffMember) => {
    const existing = staff.find(s => s.role === candidate.role);
    let newStaff: StaffMember[];
    if (existing) {
      newStaff = staff.map(s => s.id === existing.id ? candidate : s);
      toast.success(`Replaced ${existing.firstName} ${existing.lastName} with ${candidate.firstName} ${candidate.lastName}`);
    } else {
      newStaff = [...staff, candidate];
      toast.success(`Hired ${candidate.firstName} ${candidate.lastName} as ${STAFF_ROLE_INFO[candidate.role].name}`);
    }
    onUpdateStaff(newStaff);
    setCandidates([]);
    setSearchingRole(null);
  };

  const handleFire = (memberId: string) => {
    const member = staff.find(s => s.id === memberId);
    if (!member) return;
    onUpdateStaff(staff.filter(s => s.id !== memberId));
    toast.info(`Released ${member.firstName} ${member.lastName}`);
  };

  const searchCandidates = (role: StaffRole) => {
    setSearchingRole(role);
    const results = Array.from({ length: 3 }, () => 
      generateStaffCandidate(role, team.reputation)
    ).sort((a, b) => b.quality - a.quality);
    setCandidates(results);
  };

  const generateScoutReport = () => {
    const analyst = staff.find(s => s.role === 'analyst');
    const quality = analyst ? analyst.quality : 20;
    
    const opponent = leagueTeams.find(t => t.id === scoutTarget);
    if (!opponent) {
      toast.error('Select an opponent to scout');
      return;
    }
    
    const report = generateDetailedScoutingReport(opponent, quality);
    setScoutingReports(prev => [report, ...prev].slice(0, 5));
    
    // Auto-set defensive focus from suggestions
    if (report.suggestedDefensiveFocus) {
      setDefensiveFocus(report.suggestedDefensiveFocus);
    }
    
    toast.success(`Scouting report on ${opponent.name} (${quality}% quality)`);
  };

  const applyDefensivePreset = (preset: typeof DEFENSIVE_FOCUS_PRESETS[0]) => {
    const areas: DefensiveFocusArea[] = preset.areas.map(a => ({
      ...a,
      id: Math.random().toString(36).substring(2, 7),
    }));
    setDefensiveFocus(areas);
    toast.success(`Applied: ${preset.label}`);
  };

  const philosophyData = COACHING_PHILOSOPHIES[philosophy];

  const rolesByCategory = {
    'Coaching': staff.filter(s => ['head_coach', 'attack_coach', 'defence_coach', 'scrum_coach', 'kicking_coach', 'lineout_coach'].includes(s.role)),
    'Performance': staff.filter(s => ['strength_conditioning', 'head_physio', 'nutritionist'].includes(s.role)),
    'Support': staff.filter(s => ['analyst', 'sports_psychologist'].includes(s.role)),
  };

  const allRoles: StaffRole[] = ['head_coach', 'attack_coach', 'defence_coach', 'scrum_coach', 'kicking_coach', 'lineout_coach', 'analyst', 'sports_psychologist', 'nutritionist', 'head_physio', 'strength_conditioning'];
  const vacantRoles = allRoles.filter(role => !staff.find(s => s.role === role));

  return (
    <Tabs defaultValue="staff">
      <TabsList className="mb-4">
        <TabsTrigger value="staff"><Users className="h-4 w-4 mr-1" /> Staff</TabsTrigger>
        <TabsTrigger value="philosophy"><Brain className="h-4 w-4 mr-1" /> Philosophy</TabsTrigger>
        <TabsTrigger value="bonuses"><BarChart3 className="h-4 w-4 mr-1" /> Bonuses</TabsTrigger>
        <TabsTrigger value="scouting"><Search className="h-4 w-4 mr-1" /> Scouting</TabsTrigger>
      </TabsList>

      {/* STAFF TAB */}
      <TabsContent value="staff">
        <div className="space-y-6">
          {Object.entries(rolesByCategory).map(([category, members]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map(member => {
                  const info = STAFF_ROLE_INFO[member.role];
                  return (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="text-2xl">{info.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.firstName} {member.lastName}</span>
                          <Badge variant="outline" className="text-xs">{info.name}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{member.nationality} • Age {member.age}</span>
                          <div className="flex items-center gap-1 flex-1 max-w-[120px]">
                            <Progress value={member.quality} className="h-1.5" />
                            <span className="text-xs font-medium">{member.quality}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{info.bonusArea}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>€{(member.salary / 1000).toFixed(0)}k/yr</div>
                        <div>{member.contractYears}yr left</div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleFire(member.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">No {category.toLowerCase()} staff hired</p>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Vacancies & Hiring */}
          {vacantRoles.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Vacancies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {vacantRoles.map(role => {
                  const info = STAFF_ROLE_INFO[role];
                  return (
                    <div key={role} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <span className="text-sm">{info.name}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => searchCandidates(role)}>
                        Search
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Candidates */}
          {searchingRole && candidates.length > 0 && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Candidates for {STAFF_ROLE_INFO[searchingRole].name}
                </CardTitle>
                <CardDescription>Select a candidate to hire or search again for new options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidates.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="flex-1">
                      <div className="font-medium">{c.firstName} {c.lastName}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.nationality} • Age {c.age} • Quality: {c.quality} • Exp: {c.experience}
                      </div>
                      <div className="text-xs text-muted-foreground">€{(c.salary / 1000).toFixed(0)}k/yr • {c.contractYears} year contract</div>
                    </div>
                    <Button size="sm" onClick={() => handleHire(c)}>Hire</Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => searchCandidates(searchingRole)}>
                  Search Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      {/* PHILOSOPHY TAB */}
      <TabsContent value="philosophy">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Philosophy</CardTitle>
              <CardDescription>Your philosophy affects training, match tactics, and player development</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={philosophy} onValueChange={(v) => onUpdatePhilosophy(v as CoachingPhilosophy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(COACHING_PHILOSOPHIES) as [CoachingPhilosophy, typeof philosophyData][]).map(([key, data]) => (
                    <SelectItem key={key} value={key}>
                      {data.name} — {data.example}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-1">{philosophyData.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{philosophyData.description}</p>
                <p className="text-xs text-muted-foreground italic mb-3">Reference: {philosophyData.example}</p>
                
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(philosophyData.effects).map(([key, value]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span>{label}</span>
                        <Badge variant={value > 0 ? 'default' : value < 0 ? 'destructive' : 'secondary'} className="text-xs">
                          {value > 0 ? '+' : ''}{value}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* BONUSES TAB */}
      <TabsContent value="bonuses">
        <Card>
          <CardHeader>
            <CardTitle>Staff Impact Analysis</CardTitle>
            <CardDescription>How your coaching staff improves team performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Scrum', value: bonuses.scrumBonus, max: 15, icon: <Target className="h-4 w-4" /> },
                { label: 'Lineout', value: bonuses.lineoutBonus, max: 15, icon: <Target className="h-4 w-4" /> },
                { label: 'Tackle Completion', value: bonuses.tackleBonus, max: 15, icon: <Shield className="h-4 w-4" /> },
                { label: 'Kicking', value: bonuses.kickingBonus, max: 15, icon: <Target className="h-4 w-4" /> },
                { label: 'Attack Patterns', value: bonuses.attackBonus, max: 15, icon: <Swords className="h-4 w-4" /> },
                { label: 'Ruck Speed', value: bonuses.ruckSpeedBonus, max: 10, icon: <Swords className="h-4 w-4" /> },
                { label: 'Fatigue Resistance', value: bonuses.fatigueResistance, max: 15, icon: <BarChart3 className="h-4 w-4" /> },
                { label: 'Injury Recovery', value: bonuses.injuryRecoveryBonus, max: 20, icon: <BarChart3 className="h-4 w-4" /> },
                { label: 'Confidence Recovery', value: bonuses.confidenceRecoveryBonus, max: 15, icon: <Brain className="h-4 w-4" /> },
                { label: 'Scouting Quality', value: bonuses.scoutingQuality, max: 100, icon: <Search className="h-4 w-4" /> },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm w-36">{item.label}</span>
                  <Progress value={(item.value / item.max) * 100} className="flex-1 h-2" />
                  <span className="text-sm font-medium w-8 text-right">+{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* SCOUTING TAB */}
      <TabsContent value="scouting">
        <div className="space-y-4">
          {/* Scout selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" /> Opposition Scouting
              </CardTitle>
              <CardDescription>
                {staff.find(s => s.role === 'analyst')
                  ? `Analyst quality: ${staff.find(s => s.role === 'analyst')!.quality}% — higher quality reveals more detail`
                  : 'Hire a Performance Analyst to unlock detailed scouting reports'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={scoutTarget} onValueChange={setScoutTarget}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select opponent to scout" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagueTeams.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={generateScoutReport} disabled={!scoutTarget}>
                  <Search className="h-4 w-4 mr-1" /> Scout
                </Button>
              </div>

              {/* Defensive focus presets */}
              <div>
                <p className="text-xs font-medium mb-2">Quick Defensive Presets</p>
                <div className="flex flex-wrap gap-2">
                  {DEFENSIVE_FOCUS_PRESETS.map((preset, i) => (
                    <Button key={i} size="sm" variant="outline" className="text-xs" onClick={() => applyDefensivePreset(preset)}>
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Active focus areas */}
              {defensiveFocus.length > 0 && (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <p className="text-xs font-medium mb-2 flex items-center gap-1"><Target className="h-3 w-3" /> Active Defensive Focus</p>
                  {defensiveFocus.map(f => (
                    <div key={f.id} className="flex items-center justify-between text-sm py-1">
                      <span>{f.instruction}</span>
                      <Badge variant="outline" className="text-xs">{f.area.replace(/_/g, ' ')}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reports */}
          {scoutingReports.map((report, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">{report.teamName}</CardTitle>
                  <Badge variant="outline">{report.quality}% intel</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Form */}
                {report.opponentFormLast5 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Form:</span>
                    <div className="flex gap-0.5">
                      {report.opponentFormLast5.split('').map((r, j) => (
                        <span key={j} className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded ${
                          r === 'W' ? 'bg-green-600/20 text-green-600' : r === 'L' ? 'bg-red-600/20 text-red-600' : 'bg-muted text-muted-foreground'
                        }`}>{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {report.scrumTendency && <div><span className="text-muted-foreground">Scrum:</span> {report.scrumTendency}</div>}
                  {report.primaryAttackSide && <div><span className="text-muted-foreground">Attack focus:</span> {report.primaryAttackSide}</div>}
                  {report.setPieceStrength && <div><span className="text-muted-foreground">Set piece:</span> {report.setPieceStrength}</div>}
                  {report.maulFrequency && <div><span className="text-muted-foreground">Maul tendency:</span> {report.maulFrequency}</div>}
                  {report.keyPlayer && <div><span className="text-muted-foreground">Key player:</span> {report.keyPlayer}</div>}
                  {report.targetChannel && <div><span className="text-muted-foreground">Attack channel:</span> {report.targetChannel}</div>}
                  {report.kickingPatterns && <div><span className="text-muted-foreground">Kicking:</span> {report.kickingPatterns}</div>}
                  {report.contestableKickRate != null && <div><span className="text-muted-foreground">Contestable kicks:</span> {report.contestableKickRate}%</div>}
                  {report.ruckSpeed && <div><span className="text-muted-foreground">Ruck speed:</span> {report.ruckSpeed}</div>}
                  {report.jackallThreat && <div><span className="text-muted-foreground">Jackal threat:</span> {report.jackallThreat}</div>}
                  {report.lineoutMaulPercentage != null && <div><span className="text-muted-foreground">Lineout → maul:</span> {report.lineoutMaulPercentage}%</div>}
                  {report.scrumPenaltyRate != null && <div><span className="text-muted-foreground">Scrum penalties/game:</span> {report.scrumPenaltyRate.toFixed(1)}</div>}
                  {report.defensiveWeakness && <div className="col-span-2"><span className="text-muted-foreground">Defence weakness:</span> {report.defensiveWeakness}</div>}
                </div>

                {/* Danger player */}
                {report.dangerPlayer && (
                  <div className="p-2 rounded bg-destructive/10 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium">{report.dangerPlayer.name}</span> ({report.dangerPlayer.position})
                      <br /><span className="text-muted-foreground">{report.dangerPlayer.threat}</span>
                    </div>
                  </div>
                )}

                {/* Lineout calls */}
                {report.lineoutCalls && report.lineoutCalls.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Known Lineout Calls:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {report.lineoutCalls.map((call, j) => (
                        <Badge key={j} variant="secondary" className="text-xs">{call}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weaknesses */}
                {report.weaknesses.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Exploitable Weaknesses:</span>
                    <ul className="mt-1 space-y-0.5">
                      {report.weaknesses.map((w, j) => (
                        <li key={j} className="text-xs text-muted-foreground">• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested focus */}
                {report.suggestedDefensiveFocus && report.suggestedDefensiveFocus.length > 0 && (
                  <div>
                    <span className="text-xs font-medium">Recommended Defensive Focus:</span>
                    <div className="mt-1 space-y-1">
                      {report.suggestedDefensiveFocus.map((f, j) => (
                        <div key={j} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50">
                          <span>{f.instruction}</span>
                          <Badge variant="outline" className="text-xs">{f.intensity}</Badge>
                        </div>
                      ))}
                    </div>
                    <Button 
                      size="sm" variant="outline" className="mt-2 text-xs"
                      onClick={() => { setDefensiveFocus(report.suggestedDefensiveFocus!); toast.success('Applied recommended focus areas'); }}
                    >
                      Apply Recommended Focus
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {scoutingReports.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Select an opponent and generate a scouting report</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
