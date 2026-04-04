import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Shield,
  GraduationCap,
  MapPin,
  Clock,
  UserCheck,
  UserX
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { AcademyProspect, generateFeedersForTeam, generateAnnualIntake } from '@/engine/academy';
import {
  AcademyPoachingAttempt,
  generatePoachingAttempt,
  resolvePoachingAttempt,
  identifyAtRiskProspects,
} from '@/engine/academyPipeline';
import { LEAGUES } from '@/data/leagues';

export function AcademyPoachingPanel() {
  const { getMyTeam, getMyLeague, gameState } = useGame();
  const myTeam = getMyTeam();
  const myLeague = getMyLeague();

  const [prospects, setProspects] = useState<AcademyProspect[]>(() => {
    const saved = localStorage.getItem('rugbyManagerAcademyProspects');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return [];
  });

  const [poachingAttempts, setPoachingAttempts] = useState<AcademyPoachingAttempt[]>(() => {
    const saved = localStorage.getItem('rugbyManagerPoaching');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return [];
  });

  const [resolvedMessages, setResolvedMessages] = useState<string[]>([]);

  // Generate prospects if empty
  const handleGenerateIntake = () => {
    if (!myTeam) return;
    const feeders = generateFeedersForTeam(myTeam.country, myTeam.facilities?.academy?.reputation || 50);
    const intake = generateAnnualIntake(myTeam.country, myTeam.facilities?.academy || {
      overallRating: 3 as const,
      scoutingNetwork: 3 as const,
      coachingQuality: 3 as const,
      youthFacilities: 3 as const,
      pathwayToFirstTeam: 3 as const,
      reputation: 60,
    }, feeders);
    setProspects(prev => {
      const updated = [...prev, ...intake];
      localStorage.setItem('rugbyManagerAcademyProspects', JSON.stringify(updated));
      return updated;
    });
  };

  // Simulate rival poaching
  const handleSimulatePoaching = () => {
    if (!myTeam || !myLeague) return;

    // Get rival teams from same league
    const rivals = myLeague.teams.filter(t => t.id !== myTeam.id);

    const newAttempts: AcademyPoachingAttempt[] = [];
    prospects.forEach(prospect => {
      // Already has a pending attempt
      if (poachingAttempts.some(a => a.prospectId === prospect.id && a.status === 'pending')) return;

      // Pick a random rival
      const rival = rivals[Math.floor(Math.random() * rivals.length)];
      if (!rival) return;

      const attempt = generatePoachingAttempt(
        prospect,
        myTeam.country,
        rival.id,
        rival.name,
        rival.reputation,
        gameState.currentWeek,
      );
      if (attempt) newAttempts.push(attempt);
    });

    if (newAttempts.length > 0) {
      setPoachingAttempts(prev => {
        const updated = [...prev, ...newAttempts];
        localStorage.setItem('rugbyManagerPoaching', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleRespond = (attemptId: string, optionId: string) => {
    setPoachingAttempts(prev => {
      const attempt = prev.find(a => a.id === attemptId);
      if (!attempt) return prev;

      const result = resolvePoachingAttempt(attempt, optionId);
      setResolvedMessages(msgs => [...msgs, result.message]);

      if (!result.retained) {
        // Remove prospect
        setProspects(prospects => {
          const updated = prospects.filter(p => p.id !== attempt.prospectId);
          localStorage.setItem('rugbyManagerAcademyProspects', JSON.stringify(updated));
          return updated;
        });
      }

      const newStatus: 'retained' | 'lost' = result.retained ? 'retained' : 'lost';
      const updated = prev.map(a =>
        a.id === attemptId ? { ...a, status: newStatus } : a
      );
      localStorage.setItem('rugbyManagerPoaching', JSON.stringify(updated));
      return updated;
    });
  };

  const atRiskProspects = useMemo(() => {
    if (!myTeam) return [];
    return identifyAtRiskProspects(prospects, myTeam.reputation);
  }, [prospects, myTeam]);

  const pendingAttempts = poachingAttempts.filter(a => a.status === 'pending');

  if (!myTeam) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Academy Pipeline
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleGenerateIntake}>
            New Intake
          </Button>
          <Button size="sm" variant="outline" onClick={handleSimulatePoaching}>
            Advance Week
          </Button>
        </div>
      </div>

      {/* At-Risk Prospects */}
      {atRiskProspects.filter(r => r.riskLevel !== 'low').length > 0 && (
        <Card className="border-orange-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-500">
              <AlertTriangle className="h-4 w-4" />
              At-Risk Prospects — Offer Contracts Early
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {atRiskProspects.filter(r => r.riskLevel !== 'low').map(({ prospect, riskLevel, recommendation }) => (
              <div key={prospect.id} className="flex items-start justify-between p-2 rounded bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{prospect.firstName} {prospect.lastName}</p>
                  <p className="text-xs text-muted-foreground">
                    {prospect.position} • Age {prospect.age} • {'⭐'.repeat(prospect.starRating)}
                  </p>
                  <p className="text-xs mt-1">{recommendation}</p>
                </div>
                <Badge variant={riskLevel === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                  {riskLevel} risk
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Poaching Attempts */}
      {pendingAttempts.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <Shield className="h-4 w-4" />
              Rival Interest ({pendingAttempts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {pendingAttempts.map(attempt => (
                  <Card key={attempt.id} className="border-l-4 border-l-red-500">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{attempt.prospectName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {attempt.rivalTeamName} are interested
                          </p>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {attempt.deadline} weeks
                        </Badge>
                      </div>

                      <p className="text-xs bg-muted/50 rounded p-2">{attempt.reason}</p>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Willingness to leave: {attempt.prospectWillingnessToLeave}%</span>
                        <span>Offered: €{attempt.offeredSalary.toLocaleString()}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {attempt.counterOfferOptions.map(option => (
                          <Button
                            key={option.id}
                            size="sm"
                            variant={option.effect === 'retain' ? 'default' : option.effect === 'lose_gracefully' ? 'secondary' : 'outline'}
                            onClick={() => handleRespond(attempt.id, option.id)}
                            className="text-xs"
                            title={`${option.description} (${option.successChance}% success)`}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Resolved Messages */}
      {resolvedMessages.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-1">
            {resolvedMessages.map((msg, i) => (
              <p key={i} className="text-xs text-muted-foreground">{msg}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Current Prospects Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Academy Prospects ({prospects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {prospects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No prospects in academy. Click "New Intake" to generate this year's intake.
            </p>
          ) : (
            <div className="space-y-1">
              {prospects.slice(0, 10).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm p-1.5 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.firstName} {p.lastName}</span>
                    <span className="text-xs text-muted-foreground">{p.position}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Age {p.age}</span>
                    <span className="text-xs">{'⭐'.repeat(p.starRating)}</span>
                    <Badge variant="outline" className="text-xs">
                      {p.attitude}
                    </Badge>
                  </div>
                </div>
              ))}
              {prospects.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{prospects.length - 10} more prospects
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
