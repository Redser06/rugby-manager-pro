import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Trophy, TrendingUp, Star, GraduationCap, UserMinus, FileX,
  Wallet, Calendar, ArrowRight, Medal, Shield
} from 'lucide-react';
import type { SeasonResult, SeasonResultTopPerformer } from '@/types/seasonResult';
import type { Player } from '@/types/game';

/**
 * End-of-season summary screen.
 *
 * Renders a SeasonResult produced by src/engine/seasonRollover.ts (Claude
 * Code, PLAN.md P0.1). Until the engine ships, falls back to a stubbed
 * SeasonResult derived from current GameContext so the page is testable
 * end-to-end and visually polished.
 */
export default function SeasonSummary() {
  const navigate = useNavigate();
  const { gameState, getMyTeam } = useGame();
  const team = getMyTeam();

  // Pull a real SeasonResult from gameState when present; otherwise stub.
  const result: SeasonResult | null = useMemo(() => {
    const real = (gameState as unknown as { lastSeasonResult?: SeasonResult }).lastSeasonResult;
    if (real) return real;
    if (!team) return null;
    return buildStubResult(team, gameState.currentSeason);
  }, [gameState, team]);

  if (!team || !result) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>No season to summarise yet</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Complete a full season to unlock the end-of-season review.
            <div className="mt-4">
              <Button onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const positionSuffix = ordinal(result.leagueFinalPosition);
  const headline = result.trophy
    ? `${result.trophy.competition} Champions`
    : result.relegated
      ? 'Relegation Heartbreak'
      : result.promoted
        ? 'Promoted!'
        : `Finished ${positionSuffix}`;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/15 via-background to-accent/10 p-6 sm:p-10">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-3">Season {result.season} · Final Review</Badge>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{team.name}</h1>
            <p className="text-lg sm:text-2xl font-semibold text-primary mt-2 flex items-center gap-2">
              {result.trophy ? <Trophy className="w-6 h-6" /> : <Medal className="w-6 h-6" />}
              {headline}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {team.league} · Final position {positionSuffix}
              {result.europeanQualified && ` · Qualified for ${result.europeanQualified}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/standings')}>
              View final table
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Begin Season {result.season + 1}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Headline grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatTile
          icon={<Trophy className="w-5 h-5" />}
          label="Trophy"
          value={result.trophy ? result.trophy.name : 'None'}
          hint={result.trophy?.competition}
        />
        <StatTile
          icon={<TrendingUp className="w-5 h-5" />}
          label="League Finish"
          value={positionSuffix}
          hint={team.league}
        />
        <StatTile
          icon={<Shield className="w-5 h-5" />}
          label="Europe"
          value={result.europeanQualified ?? 'Not qualified'}
        />
      </div>

      {/* Top performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result.topPerformers.length === 0 ? (
            <EmptyRow label="No standout performers recorded this season." />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr className="text-left">
                    <th className="py-2 px-2">Player</th>
                    <th className="py-2 px-2">Position</th>
                    <th className="py-2 px-2 text-right">Avg Rating</th>
                    <th className="py-2 px-2 text-right">Tries</th>
                  </tr>
                </thead>
                <tbody>
                  {result.topPerformers.map(p => (
                    <tr key={p.player.id} className="border-t border-border/40">
                      <td className="py-2 px-2 font-semibold">{p.player.firstName} {p.player.lastName}</td>
                      <td className="py-2 px-2 text-muted-foreground">{p.player.position}</td>
                      <td className="py-2 px-2 text-right font-mono">{p.rating.toFixed(1)}</td>
                      <td className="py-2 px-2 text-right font-mono">{p.tries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Squad churn */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PlayerListCard
          title="Academy Graduates"
          icon={<GraduationCap className="w-5 h-5 text-emerald-500" />}
          players={result.academyGraduates}
          empty="No academy promotions this season."
        />
        <PlayerListCard
          title="Retirements"
          icon={<UserMinus className="w-5 h-5 text-muted-foreground" />}
          players={result.retirements}
          empty="No retirements."
        />
        <PlayerListCard
          title="Contract Expiries"
          icon={<FileX className="w-5 h-5 text-amber-500" />}
          players={result.contractExpiries}
          empty="No expiring contracts."
        />
      </div>

      {/* Financials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Money label="Revenue" value={result.financials.revenue} />
            <Money label="Wage Bill" value={result.financials.wages} negative />
            <Money
              label="Profit / Loss"
              value={result.financials.profit}
              accent={result.financials.profit >= 0 ? 'positive' : 'negative'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Next season preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Season {result.season + 1} Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Competitions</p>
            <div className="flex flex-wrap gap-2">
              {result.nextSeasonPreview.competitions.map(c => (
                <Badge key={c} variant="secondary">{c}</Badge>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Key Fixtures</p>
            {result.nextSeasonPreview.keyFixtures.length === 0 ? (
              <p className="text-sm text-muted-foreground">Fixtures will be announced shortly.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {result.nextSeasonPreview.keyFixtures.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          {icon}{label}
        </div>
        <p className="mt-2 text-xl font-bold">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function PlayerListCard({ title, icon, players, empty }: { title: string; icon: React.ReactNode; players: Player[]; empty: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <EmptyRow label={empty} />
        ) : (
          <ul className="space-y-1.5 text-sm">
            {players.map(p => (
              <li key={p.id} className="flex items-center justify-between">
                <span className="truncate">{p.firstName} {p.lastName}</span>
                <Badge variant="outline" className="text-[10px] ml-2">{p.position}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Money({ label, value, negative, accent }: { label: string; value: number; negative?: boolean; accent?: 'positive' | 'negative' }) {
  const cls = accent === 'positive' ? 'text-emerald-500' : accent === 'negative' ? 'text-red-500' : '';
  const formatted = (negative ? '-' : '') + '£' + Math.abs(value).toLocaleString();
  return (
    <div className="rounded-lg border border-border/40 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold font-mono ${cls}`}>{formatted}</p>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground italic">{label}</p>;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Stub builder used until src/engine/seasonRollover.ts is wired and a real
 * SeasonResult is persisted on GameContext.
 */
function buildStubResult(team: ReturnType<typeof useGame>['gameState']['selectedTeam'] & object, season: number): SeasonResult {
  const players = team.players ?? [];
  const sorted = [...players].sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  const topPerformers: SeasonResultTopPerformer[] = sorted.slice(0, 5).map((p, i) => ({
    player: p,
    rating: 7.5 - i * 0.2,
    tries: Math.max(0, 8 - i * 2),
  }));
  return {
    season,
    team,
    leagueFinalPosition: 4,
    topPerformers,
    academyGraduates: [],
    retirements: [],
    contractExpiries: [],
    financials: { revenue: 12_500_000, wages: 9_800_000, profit: 2_700_000 },
    nextSeasonPreview: {
      competitions: [team.league, 'Champions Cup'].filter(Boolean) as string[],
      keyFixtures: [],
    },
  };
}
