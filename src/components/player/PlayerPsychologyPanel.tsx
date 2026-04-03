import { useState } from 'react';
import { Player } from '@/types/game';
import { PlayerExtended, PlayerChat, ARCHETYPE_NAMES, InjuryRehab, ChronicInjury } from '@/types/playerExtended';
import { getOverallMorale, getMoraleLabel, getMoraleColor, generatePlayerChat } from '@/engine/playerPsychology';
import { applyRehabStrategy, chooseSurgery, shouldRestForChronic, updateChronicManagement } from '@/engine/injuryRehab';
import { shouldTriggerRetirementChat, generateRetirementChat, calculateCoachConversion, generateTestimonialEvent, RetirementChat, RetirementDecision } from '@/engine/retirement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Brain, Heart, Flame, Shield, MessageSquare, Trophy, TrendingUp, TrendingDown,
  Star, AlertTriangle, Users, Zap, Clock, Activity, Stethoscope, Sunset, UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlayerPsychologyPanelProps {
  players: Player[];
  playerExtendedData: Record<string, PlayerExtended>;
  onUpdateExtended: (playerId: string, updates: Partial<PlayerExtended>) => void;
  onSetMentor: (menteeId: string, mentorId: string) => void;
}

const MOMENTUM_ICONS: Record<string, { icon: typeof Flame; label: string; color: string }> = {
  hot: { icon: Flame, label: 'On Fire', color: 'text-red-500' },
  warm: { icon: TrendingUp, label: 'In Form', color: 'text-orange-400' },
  neutral: { icon: Shield, label: 'Steady', color: 'text-muted-foreground' },
  cold: { icon: TrendingDown, label: 'Out of Form', color: 'text-blue-400' },
  freezing: { icon: AlertTriangle, label: 'Struggling', color: 'text-blue-600' },
};

export default function PlayerPsychologyPanel({
  players, playerExtendedData, onUpdateExtended, onSetMentor
}: PlayerPsychologyPanelProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<PlayerChat | null>(null);
  const { toast } = useToast();

  const getExt = (id: string): PlayerExtended | null => playerExtendedData[id] || null;

  const handleChatResponse = (responseId: string) => {
    if (!activeChat) return;
    const response = activeChat.responses.find(r => r.id === responseId);
    if (!response) return;

    const ext = getExt(activeChat.playerId);
    if (!ext) return;

    const updates: Partial<PlayerExtended> = {
      happiness: Math.max(0, Math.min(100, ext.happiness + (response.effect.happiness || 0))),
      confidence: Math.max(0, Math.min(100, ext.confidence + (response.effect.confidence || 0))),
      ego: Math.max(0, Math.min(100, ext.ego + (response.effect.ego || 0))),
    };

    onUpdateExtended(activeChat.playerId, updates);
    setActiveChat({ ...activeChat, resolvedAt: new Date(), outcome: response.text });

    toast({
      title: 'Chat Resolved',
      description: `${response.tone === 'supportive' ? '😊' : response.tone === 'firm' ? '😤' : '🤝'} Player responded to your ${response.tone} approach.`,
    });
  };

  // Sort players by morale for overview
  const sortedPlayers = [...players].sort((a, b) => {
    const extA = getExt(a.id);
    const extB = getExt(b.id);
    if (!extA || !extB) return 0;
    return getOverallMorale(extA) - getOverallMorale(extB);
  });

  const selectedPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) : null;
  const selectedExt = selectedPlayerId ? getExt(selectedPlayerId) : null;

  // Find veterans for mentoring
  const veterans = players.filter(p => {
    const ext = getExt(p.id);
    return ext && ext.caps >= 50 && ext.leadership >= 60;
  });

  const youngPlayers = players.filter(p => p.age < 24);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="morale">
        <TabsList className="grid grid-cols-6 w-full max-w-2xl">
          <TabsTrigger value="morale" className="gap-1 text-xs">
            <Heart className="h-3 w-3" /> Morale
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1 text-xs">
            <MessageSquare className="h-3 w-3" /> Chat
          </TabsTrigger>
          <TabsTrigger value="mentoring" className="gap-1 text-xs">
            <Users className="h-3 w-3" /> Mentoring
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-1 text-xs">
            <Trophy className="h-3 w-3" /> Milestones
          </TabsTrigger>
          <TabsTrigger value="injuries" className="gap-1 text-xs">
            <Stethoscope className="h-3 w-3" /> Injuries
          </TabsTrigger>
          <TabsTrigger value="retirement" className="gap-1 text-xs">
            <Sunset className="h-3 w-3" /> Twilight
          </TabsTrigger>
          <TabsTrigger value="aging" className="gap-1 text-xs">
            <Activity className="h-3 w-3" /> Aging Curves
          </TabsTrigger>
        </TabsList>

        {/* AGING CURVES REFERENCE + SQUAD TABLE */}
        <TabsContent value="aging" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Position Aging Profiles (Reference)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-semibold">Position Group</th>
                      <th className="text-center p-2 font-semibold">Peak Range</th>
                      <th className="text-center p-2 font-semibold">Decline Onset</th>
                      <th className="text-center p-2 font-semibold">Physical Decline</th>
                      <th className="text-center p-2 font-semibold">Mental Growth</th>
                      <th className="text-left p-2 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { group: 'Props & Hookers', peak: '28–32', decline: '34–38', physical: 'Slow', mental: 'Strong', notes: 'Set-piece mastery improves with age. Latest decline window.' },
                      { group: 'Locks / 2nd Row', peak: '28–33', decline: '34–38', physical: 'Slow', mental: 'Strong', notes: 'Lineout craft & leadership peak late. Can play to 38+.' },
                      { group: 'Back Row', peak: '27–31', decline: '33–37', physical: 'Moderate', mental: 'Strong', notes: 'Breakdown specialists last longer. Carrying declines first.' },
                      { group: 'Scrum-Half', peak: '27–31', decline: '33–37', physical: 'Moderate', mental: 'Strong', notes: 'Less reliant on pace. Game management improves.' },
                      { group: 'Fly-Half / Out-Half', peak: '27–33', decline: '33–39', physical: 'Moderate', mental: 'Excellent', notes: 'Brain position. Sexton peaked at 35, Carter at 34. Widest range.' },
                      { group: 'Centres', peak: '26–30', decline: '31–35', physical: 'Fast', mental: 'Moderate', notes: 'Fast-twitch reliant. Crash-ball centres decline faster.' },
                      { group: 'Back Three (Wings & FB)', peak: '25–29', decline: '30–34', physical: 'Fastest', mental: 'Moderate', notes: 'Most pace-dependent. Earliest decline. Experience offsets partially.' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="p-2 font-medium">{row.group}</td>
                        <td className="p-2 text-center"><Badge variant="outline">{row.peak}</Badge></td>
                        <td className="p-2 text-center"><Badge variant="secondary">{row.decline}</Badge></td>
                        <td className="p-2 text-center">
                          <Badge variant={row.physical === 'Fastest' ? 'destructive' : row.physical === 'Fast' ? 'destructive' : row.physical === 'Slow' ? 'default' : 'secondary'}>
                            {row.physical}
                          </Badge>
                        </td>
                        <td className="p-2 text-center">
                          <Badge className={row.mental === 'Excellent' ? 'bg-green-600 text-white' : row.mental === 'Strong' ? 'bg-green-500/80 text-white' : 'bg-yellow-500 text-white'}>
                            {row.mental}
                          </Badge>
                        </td>
                        <td className="p-2 text-muted-foreground">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                * 5% of players are "sports science outliers" who decline 2 years later than their position norm. 10% age 1 year better. Mental attributes (rugby IQ, composure, vision) can improve during early decline.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Your Squad — Individual Aging Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-semibold">Player</th>
                      <th className="text-left p-2 font-semibold">Position</th>
                      <th className="text-center p-2 font-semibold">Age</th>
                      <th className="text-center p-2 font-semibold">Peak Age</th>
                      <th className="text-center p-2 font-semibold">Decline Onset</th>
                      <th className="text-center p-2 font-semibold">Status</th>
                      <th className="text-center p-2 font-semibold">Caps</th>
                      <th className="text-center p-2 font-semibold">Chronic Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players
                      .sort((a, b) => b.age - a.age)
                      .map(p => {
                        const ext = getExt(p.id);
                        if (!ext) return null;
                        const peakAge = ext.peakAge ?? 28;
                        const declineAge = ext.declineOnsetAge ?? 33;
                        let status: string;
                        let statusColor: string;
                        if (p.age < peakAge) { status = 'Developing'; statusColor = 'bg-blue-500 text-white'; }
                        else if (p.age <= peakAge + 1) { status = 'At Peak'; statusColor = 'bg-green-500 text-white'; }
                        else if (p.age < declineAge) { status = 'Prime'; statusColor = 'bg-green-600 text-white'; }
                        else if (p.age < declineAge + 3) { status = 'Early Decline'; statusColor = 'bg-yellow-500 text-white'; }
                        else { status = 'Twilight'; statusColor = 'bg-red-500 text-white'; }
                        return (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="p-2 font-medium">{p.firstName} {p.lastName}</td>
                            <td className="p-2 text-muted-foreground">{p.position}</td>
                            <td className="p-2 text-center font-bold">{p.age}</td>
                            <td className="p-2 text-center">{peakAge}</td>
                            <td className="p-2 text-center">{declineAge}</td>
                            <td className="p-2 text-center"><Badge className={statusColor}>{status}</Badge></td>
                            <td className="p-2 text-center">{ext.caps}</td>
                            <td className="p-2 text-center">{ext.chronicInjuries.length > 0 ? <Badge variant="destructive">{ext.chronicInjuries.length}</Badge> : '—'}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MORALE OVERVIEW */}
        <TabsContent value="morale" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Squad Morale</p>
                <p className="text-3xl font-bold text-primary">
                  {players.length > 0 ? Math.round(
                    players.reduce((sum, p) => {
                      const ext = getExt(p.id);
                      return sum + (ext ? getOverallMorale(ext) : 60);
                    }, 0) / players.length
                  ) : 0}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Unhappy Players</p>
                <p className="text-3xl font-bold text-destructive">
                  {players.filter(p => { const ext = getExt(p.id); return ext && ext.happiness < 40; }).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Players In Form</p>
                <p className="text-3xl font-bold text-green-500">
                  {players.filter(p => { const ext = getExt(p.id); return ext && (ext.momentum === 'hot' || ext.momentum === 'warm'); }).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Squad Psychology</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {sortedPlayers.map(player => {
                    const ext = getExt(player.id);
                    if (!ext) return null;
                    const morale = getOverallMorale(ext);
                    const momentumInfo = MOMENTUM_ICONS[ext.momentum] || MOMENTUM_ICONS.neutral;
                    const MomentumIcon = momentumInfo.icon;

                    return (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedPlayerId(player.id)}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {player.positionNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {player.firstName} {player.lastName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{ext.archetype ? ARCHETYPE_NAMES[ext.archetype] || ext.archetype : player.position}</span>
                            <span>•</span>
                            <span className={momentumInfo.color}>
                              <MomentumIcon className="h-3 w-3 inline mr-0.5" />
                              {momentumInfo.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-sm font-bold ${getMoraleColor(morale)}`}>{morale}%</p>
                            <p className="text-xs text-muted-foreground">{getMoraleLabel(morale)}</p>
                          </div>
                          <div className="w-16">
                            <Progress value={morale} className="h-2" />
                          </div>
                        </div>
                        {ext.wantsNewContract && (
                          <Badge variant="destructive" className="text-xs">Contract</Badge>
                        )}
                        {ext.isNewSigning && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLAYER CHAT */}
        <TabsContent value="chat" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Player Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <div className="space-y-3">
                  {players.map(player => {
                    const ext = getExt(player.id);
                    if (!ext) return null;
                    const chat = generatePlayerChat(ext, player);
                    if (!chat) return null;

                    return (
                      <div
                        key={player.id}
                        className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {player.positionNumber}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{player.firstName} {player.lastName}</p>
                            <Badge variant="outline" className="text-xs">{chat.topic.replace('_', ' ')}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 italic">"{chat.message}"</p>
                        <div className="flex flex-wrap gap-2">
                          {chat.responses.map(response => (
                            <Button
                              key={response.id}
                              size="sm"
                              variant={response.tone === 'supportive' ? 'default' : response.tone === 'firm' ? 'destructive' : 'outline'}
                              className="text-xs"
                              onClick={() => {
                                setActiveChat(chat);
                                handleChatResponse(response.id);
                              }}
                            >
                              {response.text.substring(0, 40)}...
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {players.every(p => { const ext = getExt(p.id); return !ext || !generatePlayerChat(ext, p); }) && (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No player concerns</p>
                      <p className="text-sm">Your squad is content. Keep up the good work!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MENTORING */}
        <TabsContent value="mentoring" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Mentors</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-2">
                    {veterans.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No veterans available. Mentors need 50+ caps and 60+ leadership.
                      </p>
                    )}
                    {veterans.map(player => {
                      const ext = getExt(player.id);
                      if (!ext) return null;
                      return (
                        <div key={player.id} className="p-3 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{player.firstName} {player.lastName}</p>
                              <p className="text-xs text-muted-foreground">
                                {ext.caps} caps • Leadership {ext.leadership}
                              </p>
                            </div>
                            <Badge variant="secondary">{player.position}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Young Prospects</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-2">
                    {youngPlayers.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No young players under 24 in the squad.
                      </p>
                    )}
                    {youngPlayers.map(player => {
                      const ext = getExt(player.id);
                      if (!ext) return null;
                      return (
                        <div key={player.id} className="p-3 rounded-lg border border-border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{player.firstName} {player.lastName}</p>
                              <p className="text-xs text-muted-foreground">
                                Age {player.age} • Dev Rate: {ext.developmentRate.toFixed(1)}x
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {ext.potentialRevealed ? (
                                <Badge variant="outline">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Pot: {ext.potential}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">? Potential</Badge>
                              )}
                              {ext.mentorId ? (
                                <Badge variant="default" className="text-xs">
                                  Has Mentor
                                </Badge>
                              ) : (
                                <select
                                  className="text-xs border rounded px-2 py-1 bg-background"
                                  defaultValue=""
                                  onChange={(e) => {
                                    if (e.target.value) onSetMentor(player.id, e.target.value);
                                  }}
                                >
                                  <option value="">Assign Mentor...</option>
                                  {veterans.map(v => (
                                    <option key={v.id} value={v.id}>
                                      {v.firstName} {v.lastName}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MILESTONES */}
        <TabsContent value="milestones" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" /> Player Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <div className="space-y-3">
                  {players.flatMap(player => {
                    const ext = getExt(player.id);
                    if (!ext || ext.milestones.length === 0) return [];
                    return ext.milestones.map((milestone, idx) => (
                      <div key={`${player.id}_${idx}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Trophy className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{milestone.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Season {milestone.achievedAt.season}, Week {milestone.achievedAt.week}
                          </p>
                        </div>
                      </div>
                    ));
                  })}
                  {players.every(p => { const ext = getExt(p.id); return !ext || ext.milestones.length === 0; }) && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No milestones yet</p>
                      <p className="text-sm">Milestones are earned as players rack up appearances and achievements.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        {/* INJURIES & REHAB */}
        <TabsContent value="injuries" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Injured Players */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-destructive" /> Injured Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-3">
                    {players.filter(p => p.injured).map(player => {
                      const ext = getExt(player.id);
                      if (!ext) return null;
                      return (
                        <div key={player.id} className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                          <p className="font-medium text-sm">{player.firstName} {player.lastName}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {player.position} • {player.injuryWeeks || '?'} weeks remaining
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                              toast({ title: 'Conservative Rehab', description: `${player.firstName} will take the full recovery time with reduced re-injury risk.` });
                            }}>
                              🛡️ Conservative
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                              toast({ title: '⚠️ Rush Back', description: `${player.firstName} returns 30% faster but re-injury risk doubles for 4 weeks!` });
                            }}>
                              ⚡ Rush Back
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                              toast({ title: '🏥 Surgery Option', description: `Longer recovery but fully fixes the issue. No recurring problems.` });
                            }}>
                              🔪 Surgery
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {players.filter(p => p.injured).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No injured players — clean bill of health!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chronic Injury Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" /> Chronic Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-3">
                    {players.map(player => {
                      const ext = getExt(player.id);
                      if (!ext || ext.chronicInjuries.length === 0) return null;
                      return ext.chronicInjuries.map((chronic, idx) => {
                        const restWarning = shouldRestForChronic(ext);
                        return (
                          <div key={`${player.id}_${idx}`} className="p-3 rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm">{player.firstName} {player.lastName}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {chronic.type.replace('_', ' ')} — {chronic.severity}
                                </p>
                              </div>
                              <Badge variant={chronic.severity === 'severe' ? 'destructive' : chronic.severity === 'moderate' ? 'secondary' : 'outline'}>
                                {chronic.reinjuryRisk}% flare risk
                              </Badge>
                            </div>
                            {restWarning && (
                              <div className="text-xs text-orange-500 mb-2 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> {restWarning.reason}
                              </div>
                            )}
                            <Select
                              value={chronic.managementStrategy}
                              onValueChange={(val) => {
                                const updated = updateChronicManagement(ext, idx, val as ChronicInjury['managementStrategy']);
                                onUpdateExtended(player.id, updated);
                                toast({ title: 'Management Updated', description: `${player.firstName}'s ${chronic.type} is now managed with: ${val.replace(/_/g, ' ')}` });
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Management</SelectItem>
                                <SelectItem value="rest_every_3rd">Rest Every 3rd Game</SelectItem>
                                <SelectItem value="reduced_training">Reduced Training Load</SelectItem>
                                <SelectItem value="managed_minutes">Managed Minutes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      });
                    })}
                    {players.every(p => { const ext = getExt(p.id); return !ext || ext.chronicInjuries.length === 0; }) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No chronic conditions in the squad.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* RETIREMENT & CAREER TWILIGHT */}
        <TabsContent value="retirement" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sunset className="h-5 w-5 text-orange-400" /> Career Twilight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {players.filter(p => p.age >= 31).sort((a, b) => b.age - a.age).map(player => {
                    const ext = getExt(player.id);
                    if (!ext) return null;
                    const shouldChat = shouldTriggerRetirementChat(player, ext);
                    const retChat = shouldChat ? generateRetirementChat(player, ext) : null;
                    const coachConversion = calculateCoachConversion(player, ext);
                    
                    return (
                      <div key={player.id} className="p-4 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">{player.firstName} {player.lastName}</p>
                            <p className="text-xs text-muted-foreground">
                              Age {player.age} • {ext.caps} caps • {player.position}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {player.age >= 35 && <Badge variant="destructive">Retiring Soon</Badge>}
                            {player.age >= 33 && player.age < 35 && <Badge variant="secondary">Twilight</Badge>}
                            {player.age >= 31 && player.age < 33 && <Badge variant="outline">Veteran</Badge>}
                          </div>
                        </div>
                        
                        {/* Chronic injuries warning */}
                        {ext.chronicInjuries.length > 0 && (
                          <div className="text-xs text-orange-500 mb-2">
                            ⚠️ {ext.chronicInjuries.length} chronic condition{ext.chronicInjuries.length > 1 ? 's' : ''}: {ext.chronicInjuries.map(c => c.type.replace('_', ' ')).join(', ')}
                          </div>
                        )}
                        
                        {/* Coaching potential */}
                        <div className="p-2 rounded bg-muted/30 mb-3">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-primary" />
                            <span className="text-xs">Post-career: {coachConversion.coachRole} ({coachConversion.specialization}) — Rating {coachConversion.coachRating}/100</span>
                          </div>
                        </div>
                        
                        {/* Retirement chat */}
                        {retChat && (
                          <div className="border-t border-border pt-3 mt-3">
                            <p className="text-sm italic text-muted-foreground mb-3">"{retChat.message}"</p>
                            <div className="flex flex-wrap gap-2">
                              {retChat.options.map(opt => (
                                <Button
                                  key={opt.id}
                                  size="sm"
                                  variant={opt.decision === 'coaching_role' ? 'default' : opt.decision === 'one_more_season' ? 'outline' : 'secondary'}
                                  className="text-xs"
                                  onClick={() => {
                                    if (opt.effect.happiness) onUpdateExtended(player.id, { happiness: Math.max(0, Math.min(100, ext.happiness + opt.effect.happiness)) });
                                    if (opt.effect.confidence) onUpdateExtended(player.id, { confidence: Math.max(0, Math.min(100, ext.confidence + (opt.effect.confidence || 0))) });
                                    toast({
                                      title: opt.decision === 'retire' ? '👋 Retirement Planned' : opt.decision === 'coaching_role' ? '🎓 Coaching Path' : '💪 One More Season',
                                      description: `${player.firstName} ${player.lastName}: ${opt.text.substring(0, 60)}...`,
                                    });
                                  }}
                                >
                                  {opt.text.substring(0, 45)}{opt.text.length > 45 ? '...' : ''}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Testimonial eligible */}
                        {ext.caps >= 150 && (
                          <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              <span className="text-xs font-medium">Testimonial Match Eligible — {ext.caps} caps</span>
                            </div>
                            <Button size="sm" variant="outline" className="text-xs mt-2" onClick={() => {
                              const event = generateTestimonialEvent(player, ext);
                              toast({
                                title: '🎉 Testimonial Match Scheduled!',
                                description: `${event.playerName}'s testimonial will generate €${event.revenueBoost.toLocaleString()} and boost squad morale by ${event.moraleBoost}%.`,
                              });
                            }}>
                              Schedule Testimonial
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {players.filter(p => p.age >= 31).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Sunset className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No veterans in the squad</p>
                      <p className="text-sm">Players over 31 will appear here for career management.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Player Detail Dialog */}
      {selectedPlayer && selectedExt && (
        <Dialog open={!!selectedPlayerId} onOpenChange={() => setSelectedPlayerId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedPlayer.firstName} {selectedPlayer.lastName} — Psychology</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Confidence', value: selectedExt.confidence, icon: Brain },
                  { label: 'Happiness', value: selectedExt.happiness, icon: Heart },
                  { label: 'Ego', value: selectedExt.ego, icon: Flame },
                  { label: 'Composure', value: selectedExt.composure, icon: Shield },
                  { label: 'Leadership', value: selectedExt.leadership, icon: Star },
                  { label: 'Discipline', value: selectedExt.discipline, icon: AlertTriangle },
                ].map(stat => (
                  <div key={stat.label} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="text-lg font-bold">{stat.value}</p>
                    <Progress value={stat.value} className="h-1.5 mt-1" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Form (Last 5)</p>
                  <div className="flex gap-1 mt-1">
                    {selectedExt.formHistory.length > 0 ? selectedExt.formHistory.map((r, i) => (
                      <span key={i} className={`text-sm font-bold ${r >= 7 ? 'text-green-500' : r >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {r.toFixed(1)}
                      </span>
                    )) : <span className="text-sm text-muted-foreground">No matches</span>}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Career</p>
                  <p className="text-sm font-medium mt-1">{selectedExt.caps} club caps</p>
                  <p className="text-sm font-medium">{selectedExt.internationalCaps} int'l caps</p>
                </div>
              </div>

              {selectedExt.bigGamePlayer && (
                <Badge variant="default" className="gap-1">
                  <Zap className="h-3 w-3" /> Big Game Player
                </Badge>
              )}
              {selectedExt.frenchLeverage && (
                <Badge variant="secondary" className="gap-1 ml-2">
                  🇫🇷 French Leverage
                </Badge>
              )}
              {selectedExt.isNewSigning && (
                <Badge variant="outline" className="gap-1 ml-2">
                  <Clock className="h-3 w-3" /> Integrating ({selectedExt.integrationWeeks}w left)
                </Badge>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
