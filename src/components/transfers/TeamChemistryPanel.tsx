import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Users, 
  Globe, 
  Star, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { calculateTeamChemistry, TeamChemistryState, getChemistryMatchModifier } from '@/engine/teamChemistry';
import { PlayerExtended } from '@/types/playerExtended';

export function TeamChemistryPanel() {
  const { getMyTeam } = useGame();
  const myTeam = getMyTeam();

  // Load extended data from localStorage
  const extendedData = useMemo<Record<string, PlayerExtended>>(() => {
    try {
      const saved = localStorage.getItem('rugbyManagerExtended');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }, []);

  const chemistry = useMemo<TeamChemistryState | null>(() => {
    if (!myTeam) return null;

    // Count recent signings (rough estimate)
    const newSignings = Object.values(extendedData).filter(e => e.isNewSigning && e.integrationWeeks > 0).length;

    return calculateTeamChemistry(
      myTeam.players,
      extendedData,
      myTeam.country,
      newSignings,
    );
  }, [myTeam, extendedData]);

  if (!myTeam || !chemistry) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Select a team to view chemistry.
        </CardContent>
      </Card>
    );
  }

  const matchMod = getChemistryMatchModifier(chemistry.overallChemistry);
  const matchModPct = (matchMod * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Heart className="h-5 w-5" />
        Team Chemistry & Culture
      </h3>

      {/* Overall Chemistry */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Overall Chemistry</span>
            <Badge variant={chemistry.overallChemistry >= 70 ? 'default' : chemistry.overallChemistry >= 50 ? 'secondary' : 'destructive'}>
              {chemistry.overallChemistry}/100
            </Badge>
          </div>
          <Progress value={chemistry.overallChemistry} className="h-3" />
          <p className="text-xs text-muted-foreground">
            Match performance modifier: {Number(matchModPct) > 0 ? '+' : ''}{matchModPct}%
          </p>
        </CardContent>
      </Card>

      {/* Cultural Balance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Cultural Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold">{chemistry.culturalBalance.homegrownCount}</p>
              <p className="text-xs text-muted-foreground">Homegrown</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{chemistry.culturalBalance.foreignCount}</p>
              <p className="text-xs text-muted-foreground">Foreign</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{chemistry.culturalBalance.homegrownPercentage}%</p>
              <p className="text-xs text-muted-foreground">HG Ratio</p>
            </div>
          </div>

          {chemistry.culturalBalance.dominantNationalities.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1">Nationality Breakdown</p>
              <div className="flex flex-wrap gap-1">
                {chemistry.culturalBalance.dominantNationalities.map(n => (
                  <Badge key={n.nationality} variant="outline" className="text-xs">
                    {n.nationality}: {n.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disruption Factors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Disruption Factors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>New Signings Disruption</span>
            <Badge variant={chemistry.recentSigningsDisruption > 15 ? 'destructive' : 'secondary'}>
              -{chemistry.recentSigningsDisruption}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Club vs Country Tension</span>
            <Badge variant={chemistry.clubVsCountryTension > 30 ? 'destructive' : 'secondary'}>
              {chemistry.clubVsCountryTension}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Superstar Impact */}
      {chemistry.culturalBalance.superstarPresence.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4" />
              Superstar Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {chemistry.culturalBalance.superstarPresence.map(star => (
              <div key={star.playerId} className="flex items-start gap-2 p-2 rounded bg-muted/30">
                <div className="mt-0.5">
                  {star.impactType === 'positive_culture' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : star.impactType === 'negative_disruption' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{star.playerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {star.nationality} • OVR {star.overall} • {star.internationalCaps} caps
                  </p>
                  <p className="text-xs mt-1">{star.impactDescription}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {star.cultureBonus > 0 ? '+' : ''}{star.cultureBonus} chemistry
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Chemistry Bonuses */}
      {chemistry.chemistryBonuses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Chemistry Bonuses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {chemistry.chemistryBonuses.map((bonus, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                <span>{bonus.description}</span>
                <Badge className="bg-green-500 text-xs">+{bonus.bonusValue}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
