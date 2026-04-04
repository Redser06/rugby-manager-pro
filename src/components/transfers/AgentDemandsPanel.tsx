import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  MessageSquare, 
  DollarSign, 
  Clock, 
  UserCheck,
  Shield,
  Zap,
  Phone
} from 'lucide-react';
import { 
  AgentDemand, 
  PlayerAgent, 
  generateAgentPool, 
  assignAgentsToPlayers, 
  generateAgentDemand, 
  processWeeklyAgentActivity,
  getAgentTypeDescription
} from '@/engine/agentSystem';
import { useGame } from '@/contexts/GameContext';
import { useTransfer } from '@/contexts/TransferContext';

export function AgentDemandsPanel() {
  const { getMyTeam, gameState } = useGame();
  const { contracts, extendContract } = useTransfer();
  const myTeam = getMyTeam();

  const [agents, setAgents] = useState<PlayerAgent[]>(() => {
    const saved = localStorage.getItem('rugbyManagerAgents');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return generateAgentPool(15);
  });

  const [playerAgentMap, setPlayerAgentMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('rugbyManagerPlayerAgents');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return {};
  });

  const [demands, setDemands] = useState<AgentDemand[]>(() => {
    const saved = localStorage.getItem('rugbyManagerAgentDemands');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return [];
  });

  // Assign agents to team players if not done
  useEffect(() => {
    if (myTeam && Object.keys(playerAgentMap).length === 0) {
      const map = assignAgentsToPlayers(myTeam.players, agents);
      setPlayerAgentMap(map);
    }
  }, [myTeam]);

  // Persist
  useEffect(() => {
    localStorage.setItem('rugbyManagerAgents', JSON.stringify(agents));
    localStorage.setItem('rugbyManagerPlayerAgents', JSON.stringify(playerAgentMap));
    localStorage.setItem('rugbyManagerAgentDemands', JSON.stringify(demands));
  }, [agents, playerAgentMap, demands]);

  // Generate demands periodically
  const generateNewDemands = () => {
    if (!myTeam) return;

    const newDemands: AgentDemand[] = [];
    myTeam.players.forEach(player => {
      const agentId = playerAgentMap[player.id];
      if (!agentId) return;
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;
      const contract = contracts[player.id];
      if (!contract) return;

      // Don't stack demands
      if (demands.some(d => d.playerId === player.id && d.status === 'active')) return;

      const demand = generateAgentDemand(player, contract, agent, gameState.currentWeek);
      if (demand) newDemands.push(demand);
    });

    if (newDemands.length > 0) {
      setDemands(prev => [...prev, ...newDemands]);
    }
  };

  const handleResponse = (demandId: string, responseId: string) => {
    setDemands(prev => prev.map(d => {
      if (d.id !== demandId) return d;
      const response = d.responseOptions.find(r => r.id === responseId);
      if (!response) return d;

      if (response.effect.resolves) {
        // Accept/resolve — extend contract if salary offered
        if (response.effect.salaryOffer && response.effect.yearsOffer) {
          extendContract(d.playerId, response.effect.salaryOffer, response.effect.yearsOffer);
        }
        return { ...d, status: 'resolved' as const };
      }
      if (response.effect.escalates) {
        return { ...d, status: 'escalated' as const, playerMorale: Math.max(0, d.playerMorale + response.effect.moraleChange) };
      }
      return { ...d, playerMorale: Math.max(0, d.playerMorale + response.effect.moraleChange) };
    }));
  };

  const activeDemands = demands.filter(d => d.status === 'active');
  const resolvedDemands = demands.filter(d => d.status === 'resolved');
  const escalatedDemands = demands.filter(d => d.status === 'escalated');

  if (!myTeam) return null;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'ultimatum': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Agent Activity
        </h3>
        <Button size="sm" variant="outline" onClick={generateNewDemands}>
          Simulate Week
        </Button>
      </div>

      {activeDemands.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No active agent demands. Your players are content — for now.</p>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="max-h-[600px]">
        <div className="space-y-3">
          {activeDemands.map(demand => {
            const player = myTeam.players.find(p => p.id === demand.playerId);
            const agent = agents.find(a => a.id === demand.agentId);
            if (!player) return null;

            return (
              <Card key={demand.id} className="border-l-4" style={{ borderLeftColor: demand.urgency === 'ultimatum' ? '#ef4444' : demand.urgency === 'high' ? '#f97316' : '#3b82f6' }}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{player.firstName} {player.lastName}</p>
                      <p className="text-xs text-muted-foreground">{player.position} • OVR {player.overall}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {demand.frenchLeverage && (
                        <Badge variant="outline" className="text-xs">🇫🇷 French leverage</Badge>
                      )}
                      <Badge className={getUrgencyColor(demand.urgency)}>
                        {demand.urgency}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded p-3 text-sm italic">
                    "{demand.message}"
                  </div>

                  {agent && (
                    <p className="text-xs text-muted-foreground">
                      Agent: {agent.name} ({agent.type}) — {getAgentTypeDescription(agent.type)}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {demand.deadline} weeks to respond
                    </span>
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      Player morale: {demand.playerMorale}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {demand.responseOptions.map(option => (
                      <Button
                        key={option.id}
                        size="sm"
                        variant={option.id === 'accept' ? 'default' : option.id === 'reject' ? 'destructive' : 'outline'}
                        onClick={() => handleResponse(demand.id, option.id)}
                        className="text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {escalatedDemands.length > 0 && (
            <>
              <h4 className="text-sm font-semibold text-destructive flex items-center gap-1 mt-4">
                <AlertTriangle className="h-4 w-4" /> Escalated ({escalatedDemands.length})
              </h4>
              {escalatedDemands.map(d => {
                const player = myTeam.players.find(p => p.id === d.playerId);
                return (
                  <Card key={d.id} className="border-destructive/50">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">{player?.firstName} {player?.lastName}</p>
                      <p className="text-xs text-destructive">Agent has gone to the media. Player morale critically low.</p>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}

          {resolvedDemands.length > 0 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              {resolvedDemands.length} demand(s) resolved this season
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
