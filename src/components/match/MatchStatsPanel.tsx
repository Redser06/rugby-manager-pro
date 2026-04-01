import { MatchStats } from '@/types/matchEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface MatchStatsPanelProps {
  homeStats: MatchStats;
  awayStats: MatchStats;
  homeTeamName: string;
  awayTeamName: string;
}

function StatRow({ label, homeVal, awayVal, isPercentage = false }: { label: string; homeVal: number; awayVal: number; isPercentage?: boolean }) {
  const total = homeVal + awayVal || 1;
  const homePercent = isPercentage ? homeVal : (homeVal / total) * 100;
  const suffix = isPercentage ? '%' : '';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-primary">{homeVal}{suffix}</span>
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="font-semibold">{awayVal}{suffix}</span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 bg-muted rounded-full overflow-hidden flex justify-end">
          <div className="bg-primary rounded-full transition-all duration-500" style={{ width: `${homePercent}%` }} />
        </div>
        <div className="flex-1 bg-muted rounded-full overflow-hidden">
          <div className="bg-foreground/60 rounded-full transition-all duration-500" style={{ width: `${100 - homePercent}%` }} />
        </div>
      </div>
    </div>
  );
}

export function MatchStatsPanel({ homeStats, awayStats, homeTeamName, awayTeamName }: MatchStatsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex justify-between">
          <span className="text-primary">{homeTeamName}</span>
          <span>Match Stats</span>
          <span>{awayTeamName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatRow label="Possession" homeVal={homeStats.possession} awayVal={awayStats.possession} isPercentage />
        <StatRow label="Territory" homeVal={homeStats.territory} awayVal={awayStats.territory} isPercentage />
        <StatRow label="Carries" homeVal={homeStats.carries} awayVal={awayStats.carries} />
        <StatRow label="Metres Gained" homeVal={homeStats.metresGained} awayVal={awayStats.metresGained} />
        <StatRow label="Tackles Made" homeVal={homeStats.tackles.made} awayVal={awayStats.tackles.made} />
        <StatRow label="Tackle %" homeVal={homeStats.tackles.percentage} awayVal={awayStats.tackles.percentage} isPercentage />
        <StatRow label="Line Breaks" homeVal={homeStats.linebreaks} awayVal={awayStats.linebreaks} />
        <StatRow label="Offloads" homeVal={homeStats.offloads} awayVal={awayStats.offloads} />
        <StatRow label="Turnovers Won" homeVal={homeStats.turnoversWon} awayVal={awayStats.turnoversWon} />
        <StatRow label="Penalties Conceded" homeVal={homeStats.penalties.conceded} awayVal={awayStats.penalties.conceded} />
        <StatRow label="Scrums Won" homeVal={homeStats.scrums.won} awayVal={awayStats.scrums.won} />
        <StatRow label="Lineouts Won" homeVal={homeStats.lineouts.won} awayVal={awayStats.lineouts.won} />
        <StatRow label="Kicks from Hand" homeVal={homeStats.kicks.fromHand} awayVal={awayStats.kicks.fromHand} />
        {(homeStats.kicks.successful5022 > 0 || awayStats.kicks.successful5022 > 0) && (
          <StatRow label="50:22 Kicks" homeVal={homeStats.kicks.successful5022} awayVal={awayStats.kicks.successful5022} />
        )}
        {(homeStats.yellowCards > 0 || awayStats.yellowCards > 0) && (
          <StatRow label="Yellow Cards" homeVal={homeStats.yellowCards} awayVal={awayStats.yellowCards} />
        )}
        {(homeStats.redCards > 0 || awayStats.redCards > 0) && (
          <StatRow label="Red Cards" homeVal={homeStats.redCards} awayVal={awayStats.redCards} />
        )}
      </CardContent>
    </Card>
  );
}
