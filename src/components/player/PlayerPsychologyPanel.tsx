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
        </TabsList>

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
